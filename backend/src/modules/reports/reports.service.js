import { prisma } from '../../config/prisma.js';

/**
 * Normalizes a subscription amount to a Monthly Recurring Revenue (MRR) equivalent.
 */
export function normalizeToMonthly(amount, interval) {
  const num = Number(amount) || 0;
  switch (interval) {
    case 'DAILY':
      return num * 30;
    case 'WEEKLY':
      return num * (52 / 12);
    case 'MONTHLY':
      return num;
    case 'YEARLY':
      return num / 12;
    default:
      return num;
  }
}

/**
 * Calculates financial analytics metrics across Subscriptions, Invoices, and Payments.
 * Optimized with aggregated Prisma queries for fast response (<2s).
 */
export async function getFinanceAnalytics({ startDate, endDate } = {}) {
  const now = new Date();

  // 1. Payment date range filter for Revenue Collected
  const paymentFilter = {};
  if (startDate || endDate) {
    paymentFilter.paidAt = {};
    if (startDate) {
      paymentFilter.paidAt.gte = new Date(startDate);
    }
    if (endDate) {
      // Set to end of day if only date is passed
      const end = new Date(endDate);
      if (typeof endDate === 'string' && !endDate.includes('T')) {
        end.setUTCHours(23, 59, 59, 999);
      }
      paymentFilter.paidAt.lte = end;
    }
  }

  // Execute aggregated queries concurrently in parallel
  const [
    activeSubsCount,
    activeSubscriptions,
    revenueAgg,
    outstandingAgg,
    overdueInvoicesRaw,
    allPlans,
  ] = await Promise.all([
    // Active Subscriptions count
    prisma.subscription.count({
      where: { status: 'ACTIVE' },
    }),

    // Active subscriptions with plan and lines to compute MRR/ARR & breakdown
    prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        billingInterval: true,
        plan: {
          select: {
            id: true,
            name: true,
            amount: true,
            interval: true,
          },
        },
        lines: {
          select: {
            quantity: true,
            unitPrice: true,
            lineAmount: true,
          },
        },
      },
    }),

    // Total Revenue Collected within specified date range
    prisma.payment.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: paymentFilter,
    }),

    // Total Outstanding Balance on CONFIRMED and PARTIALLY_PAID invoices
    prisma.invoice.aggregate({
      _sum: { balanceDue: true },
      _count: { id: true },
      where: {
        status: { in: ['CONFIRMED', 'PARTIALLY_PAID'] },
      },
    }),

    // Overdue Invoices: status not PAID (and active invoices: CONFIRMED/PARTIALLY_PAID), dueDate < now
    prisma.invoice.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PARTIALLY_PAID'] },
        dueDate: { lt: now },
      },
      select: {
        id: true,
        number: true,
        status: true,
        dueDate: true,
        issueDate: true,
        grandTotal: true,
        amountPaid: true,
        balanceDue: true,
        customer: {
          select: {
            id: true,
            companyName: true,
            billingEmail: true,
            phone: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    }),

    // All available plans for complete breakdown visibility
    prisma.plan.findMany({
      select: { id: true, name: true, interval: true, amount: true },
      where: { isActive: true },
    }),
  ]);

  // Compute MRR & ARR
  let totalMrr = 0;
  const planMrrMap = new Map();

  for (const sub of activeSubscriptions) {
    const linesTotal = sub.lines.reduce((acc, l) => {
      const lineAmt = l.lineAmount != null ? Number(l.lineAmount) : Number(l.unitPrice) * l.quantity;
      return acc + lineAmt;
    }, 0);

    const subAmount = linesTotal > 0 ? linesTotal : Number(sub.plan.amount);
    const interval = sub.billingInterval || sub.plan.interval;
    const monthlyNormalized = normalizeToMonthly(subAmount, interval);

    totalMrr += monthlyNormalized;

    const planId = sub.plan.id;
    const existing = planMrrMap.get(planId) || {
      planId,
      planName: sub.plan.name,
      interval: sub.plan.interval,
      activeCount: 0,
      mrr: 0,
    };
    existing.activeCount += 1;
    existing.mrr += monthlyNormalized;
    planMrrMap.set(planId, existing);
  }

  // Round values
  totalMrr = Math.round(totalMrr * 100) / 100;
  const totalArr = Math.round(totalMrr * 12 * 100) / 100;

  // Plan Breakdown list
  const planBreakdown = allPlans.map((plan) => {
    const data = planMrrMap.get(plan.id) || {
      planId: plan.id,
      planName: plan.name,
      interval: plan.interval,
      activeCount: 0,
      mrr: 0,
    };
    const roundedMrr = Math.round(data.mrr * 100) / 100;
    const sharePercentage = totalMrr > 0 ? Math.round((roundedMrr / totalMrr) * 1000) / 10 : 0;
    return {
      planId: plan.id,
      planName: plan.name,
      interval: plan.interval,
      activeCount: data.activeCount,
      mrr: roundedMrr,
      sharePercentage,
    };
  });

  // Overdue Invoices with days overdue calculation
  const overdueInvoices = overdueInvoicesRaw.map((inv) => {
    const dueTime = new Date(inv.dueDate).getTime();
    const diffDays = Math.max(1, Math.floor((now.getTime() - dueTime) / (1000 * 60 * 60 * 24)));
    return {
      id: inv.id,
      number: inv.number,
      status: inv.status,
      dueDate: inv.dueDate,
      issueDate: inv.issueDate,
      grandTotal: Number(inv.grandTotal),
      amountPaid: Number(inv.amountPaid),
      balanceDue: Number(inv.balanceDue),
      daysOverdue: diffDays,
      customer: inv.customer,
    };
  });

  const totalRevenueCollected = Number(revenueAgg._sum.amount ?? 0);
  const totalOutstandingReceivables = Number(outstandingAgg._sum.balanceDue ?? 0);

  return {
    metrics: {
      activeSubscriptionsCount: activeSubsCount,
      monthlyRecurringRevenue: totalMrr,
      annualRecurringRevenue: totalArr,
      totalRevenueCollected: Math.round(totalRevenueCollected * 100) / 100,
      paymentsCount: revenueAgg._count.id,
      totalOutstandingReceivables: Math.round(totalOutstandingReceivables * 100) / 100,
      outstandingInvoicesCount: outstandingAgg._count.id,
      overdueInvoicesCount: overdueInvoices.length,
      asOf: now.toISOString(),
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    },
    planBreakdown,
    overdueInvoices,
  };
}

