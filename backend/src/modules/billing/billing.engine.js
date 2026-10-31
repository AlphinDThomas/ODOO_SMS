import { prisma } from '../../config/prisma.js';
import { addDays, addInterval, isEligibleBillingPeriod, toUtcDate } from '../../utils/dates.js';
import { getNextSequenceNumber } from '../../utils/sequence.js';
import { isUniqueConstraint } from './transactions.js';

function round2(num) {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

/**
 * Runs recurring billing across all active subscriptions due on or before `asOfDate`.
 * Idempotent: uses BillingRecord unique(subscriptionId, periodStart).
 */
export async function runBillingCycle({ asOfDate = new Date(), subscriptionId = null, actorId = null } = {}) {
  const asOf = toUtcDate(asOfDate);

  // 1. Find candidate subscriptions
  const where = {
    status: 'ACTIVE',
    pausedAt: null,
  };
  if (subscriptionId) {
    where.id = subscriptionId;
  }

  const subscriptions = await prisma.subscription.findMany({
    where,
    include: {
      customer: true,
      plan: true,
      lines: {
        include: {
          product: {
            include: {
              taxRules: {
                include: { taxRule: true },
              },
            },
          },
          variant: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
      discounts: {
        where: { isActive: true },
        include: {
          discount: {
            include: { products: true },
          },
        },
      },
    },
  });

  const results = {
    asOfDate: asOf.toISOString().split('T')[0],
    processedCount: 0,
    createdInvoices: [],
    skipped: [],
    closedSubscriptions: [],
    errors: [],
  };

  for (const sub of subscriptions) {
    const periodStart = toUtcDate(sub.nextBillingDate || sub.startDate);

    // Skip if not yet due
    if (periodStart.getTime() > asOf.getTime()) {
      continue;
    }

    results.processedCount++;

    // Check if period start is past subscription expiry
    const expiryDate = toUtcDate(sub.expiryDate);
    if (!isEligibleBillingPeriod(periodStart, sub.startDate, sub.expiryDate)) {
      // Period is beyond expiry. If auto-close enabled, close the subscription.
      if (sub.plan?.autoCloseOnEnd && sub.status === 'ACTIVE') {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: 'CLOSED',
            closedAt: new Date(),
            closeReason: 'Subscription reached end date',
          },
        });
        results.closedSubscriptions.push({
          subscriptionId: sub.id,
          number: sub.number,
          reason: 'Subscription reached end date',
        });
      }
      results.skipped.push({
        subscriptionId: sub.id,
        number: sub.number,
        periodStart: periodStart.toISOString().split('T')[0],
        reason: 'Period start is on or after expiry date',
      });
      continue;
    }

    // Process single subscription billing inside an isolated transaction
    try {
      const billingResult = await prisma.$transaction(async (tx) => {
        // Double-check idempotency under transaction
        const existingRecord = await tx.billingRecord.findUnique({
          where: {
            subscriptionId_periodStart: {
              subscriptionId: sub.id,
              periodStart,
            },
          },
        });

        if (existingRecord && !existingRecord.voidedAt) {
          await tx.billingAttempt.create({
            data: {
              billingRecordId: existingRecord.id,
              subscriptionId: sub.id,
              periodStart,
              status: 'SKIPPED',
              errorMessage: 'Invoice already exists for this billing period',
            },
          });
          return { skipped: true, reason: 'Already billed for period' };
        }

        const periodEnd = addInterval(periodStart, sub.billingInterval);
        const issueDate = toUtcDate(new Date());
        const dueDate = addDays(issueDate, sub.paymentTermsDays || 15);

        // 1. Calculate base subtotal & quantities
        let subtotal = 0;
        let totalQuantity = 0;
        const lineDrafts = sub.lines.map((line) => {
          const qty = line.quantity;
          const unitPrice = Number(line.unitPrice);
          const lineSubtotal = round2(qty * unitPrice);
          subtotal += lineSubtotal;
          totalQuantity += qty;

          // Determine tax rate
          let taxRate = Number(line.taxRatePercent || 0);
          if (taxRate === 0 && line.product?.taxRules?.length) {
            taxRate = line.product.taxRules
              .filter((tr) => tr.taxRule?.isActive)
              .reduce((acc, tr) => acc + Number(tr.taxRule.ratePercent), 0);
          }

          let description = line.product?.name || 'Subscription item';
          if (line.variant) {
            description += ` (${line.variant.name})`;
          }

          return {
            subscriptionLineId: line.id,
            productId: line.productId,
            variantId: line.variantId,
            description,
            quantity: qty,
            unitPrice,
            lineSubtotal,
            taxRatePercent: taxRate,
            discountAmount: 0,
            taxAmount: 0,
            lineTotal: 0,
            sortOrder: line.sortOrder,
          };
        });

        subtotal = round2(subtotal);

        // 2. Evaluate and apply active discounts
        let discountTotal = 0;
        const appliedDiscounts = [];

        for (const subDisc of sub.discounts) {
          const rule = subDisc.discount;
          if (!rule || !rule.isActive) continue;

          // Validity date check
          const validFrom = toUtcDate(rule.validFrom);
          if (periodStart.getTime() < validFrom.getTime()) continue;
          if (rule.validTo && periodStart.getTime() > toUtcDate(rule.validTo).getTime()) continue;

          // Max uses check
          if (rule.maxUses != null && rule.usesCount >= rule.maxUses) continue;

          // Thresholds
          if (rule.minPurchaseAmount != null && subtotal < Number(rule.minPurchaseAmount)) continue;
          if (rule.minQuantity != null && totalQuantity < rule.minQuantity) continue;

          let appliedAmount = 0;

          if (rule.scope === 'PRODUCT') {
            const productIds = new Set(rule.products.map((p) => p.productId));
            const matchingLines = lineDrafts.filter((l) => productIds.has(l.productId));
            const matchSubtotal = matchingLines.reduce((acc, l) => acc + l.lineSubtotal, 0);

            if (matchSubtotal > 0) {
              if (rule.type === 'PERCENTAGE') {
                const pct = Number(rule.value) / 100;
                for (const line of matchingLines) {
                  const lineDisc = round2(line.lineSubtotal * pct);
                  line.discountAmount = round2(line.discountAmount + lineDisc);
                  appliedAmount += lineDisc;
                }
              } else if (rule.type === 'FIXED') {
                const fixedVal = Number(rule.value);
                const capped = Math.min(matchSubtotal, fixedVal);
                for (const line of matchingLines) {
                  const proportion = line.lineSubtotal / matchSubtotal;
                  const lineDisc = round2(capped * proportion);
                  line.discountAmount = round2(line.discountAmount + lineDisc);
                  appliedAmount += lineDisc;
                }
              }
            }
          } else {
            // SUBSCRIPTION scope
            if (rule.type === 'PERCENTAGE') {
              const pct = Number(rule.value) / 100;
              for (const line of lineDrafts) {
                const lineDisc = round2(line.lineSubtotal * pct);
                line.discountAmount = round2(line.discountAmount + lineDisc);
                appliedAmount += lineDisc;
              }
            } else if (rule.type === 'FIXED') {
              const fixedVal = Number(rule.value);
              const capped = Math.min(subtotal, fixedVal);
              for (const line of lineDrafts) {
                const proportion = subtotal > 0 ? line.lineSubtotal / subtotal : 0;
                const lineDisc = round2(capped * proportion);
                line.discountAmount = round2(line.discountAmount + lineDisc);
                appliedAmount += lineDisc;
              }
            }
          }

          if (appliedAmount > 0) {
            discountTotal += appliedAmount;
            appliedDiscounts.push({
              discountRuleId: rule.id,
              subscriptionDiscountId: subDisc.id,
              appliedAmount: round2(appliedAmount),
            });
          }
        }

        discountTotal = Math.min(subtotal, round2(discountTotal));

        // 3. Compute taxes and final line totals
        let taxTotal = 0;
        for (const line of lineDrafts) {
          line.discountAmount = Math.min(line.lineSubtotal, round2(line.discountAmount));
          const taxableAmount = Math.max(0, round2(line.lineSubtotal - line.discountAmount));
          line.taxAmount = round2(taxableAmount * (line.taxRatePercent / 100));
          line.lineTotal = round2(taxableAmount + line.taxAmount);
          taxTotal += line.taxAmount;
        }

        taxTotal = round2(taxTotal);
        const grandTotal = round2(Math.max(0, subtotal - discountTotal + taxTotal));

        // 4. Generate sequential invoice number (e.g. INV-0001)
        const invoiceNumber = await getNextSequenceNumber(tx, 'invoice', 'INV-', 4);

        // 5. Create customer snapshot
        const customerSnapshot = {
          companyName: sub.customer.companyName,
          billingEmail: sub.customer.billingEmail,
          phone: sub.customer.phone || null,
          addressLine1: sub.customer.addressLine1 || null,
          addressLine2: sub.customer.addressLine2 || null,
          city: sub.customer.city || null,
          state: sub.customer.state || null,
          postalCode: sub.customer.postalCode || null,
          country: sub.customer.country || null,
        };

        // 6. Insert Invoice & Lines
        const invoice = await tx.invoice.create({
          data: {
            number: invoiceNumber,
            subscriptionId: sub.id,
            customerId: sub.customerId,
            status: 'CONFIRMED', // Recurring invoices generated on billing day are created as Confirmed
            periodStart,
            periodEnd,
            issueDate,
            dueDate,
            subtotal,
            discountTotal,
            taxTotal,
            grandTotal,
            amountPaid: 0,
            balanceDue: grandTotal,
            customerSnapshot,
            confirmedAt: new Date(),
            lines: {
              create: lineDrafts.map((l) => ({
                productId: l.productId,
                variantId: l.variantId,
                description: l.description,
                quantity: l.quantity,
                unitPrice: l.unitPrice,
                taxRatePercent: l.taxRatePercent,
                taxAmount: l.taxAmount,
                discountAmount: l.discountAmount,
                lineTotal: l.lineTotal,
                sortOrder: l.sortOrder,
              })),
            },
          },
        });

        // 7. Insert BillingRecord (duplicate gate)
        const billingRecord = await tx.billingRecord.create({
          data: {
            subscriptionId: sub.id,
            periodStart,
            periodEnd,
            invoiceId: invoice.id,
          },
        });

        // 8. Log BillingAttempt (SUCCESS)
        await tx.billingAttempt.create({
          data: {
            billingRecordId: billingRecord.id,
            subscriptionId: sub.id,
            periodStart,
            status: 'SUCCESS',
          },
        });

        // 9. Update discount usage counters
        for (const ad of appliedDiscounts) {
          await tx.discountRule.update({
            where: { id: ad.discountRuleId },
            data: { usesCount: { increment: 1 } },
          });
          await tx.subscriptionDiscount.update({
            where: { id: ad.subscriptionDiscountId },
            data: { timesApplied: { increment: 1 } },
          });
        }

        // 10. Advance nextBillingDate on subscription
        const nextDate = addInterval(periodStart, sub.billingInterval);
        const isLastPeriod = toUtcDate(periodEnd).getTime() >= expiryDate.getTime();

        const subUpdateData = {
          nextBillingDate: nextDate,
        };

        if (isLastPeriod && sub.plan?.autoCloseOnEnd) {
          subUpdateData.status = 'CLOSED';
          subUpdateData.closedAt = new Date();
          subUpdateData.closeReason = 'Completed final billing period';
        }

        await tx.subscription.update({
          where: { id: sub.id },
          data: subUpdateData,
        });

        return {
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
          subscriptionId: sub.id,
          subscriptionNumber: sub.number,
          customerName: sub.customer.companyName,
          periodStart: periodStart.toISOString().split('T')[0],
          periodEnd: periodEnd.toISOString().split('T')[0],
          grandTotal,
          status: invoice.status,
          closed: !!subUpdateData.status,
        };
      });

      if (billingResult.skipped) {
        results.skipped.push({
          subscriptionId: sub.id,
          number: sub.number,
          reason: billingResult.reason,
        });
      } else {
        results.createdInvoices.push(billingResult);
        if (billingResult.closed) {
          results.closedSubscriptions.push({
            subscriptionId: sub.id,
            number: sub.number,
            reason: 'Completed final billing period',
          });
        }
      }
    } catch (err) {
      if (isUniqueConstraint(err)) {
        results.skipped.push({
          subscriptionId: sub.id,
          number: sub.number,
          reason: 'Duplicate billing attempt caught by unique constraint',
        });
      } else {
        console.error(`Billing error on subscription ${sub.number}:`, err);
        results.errors.push({
          subscriptionId: sub.id,
          number: sub.number,
          error: err.message,
        });
      }
    }
  }

  return results;
}
