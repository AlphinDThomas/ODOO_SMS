import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../utils/httpError.js';
import { applyPaymentStatus } from '../billing/transactions.js';

export async function recordPayment({ actor, invoiceId, method, amount, paidAt, note }) {
  const payAmount = Number(amount);
  if (isNaN(payAmount) || payAmount <= 0) {
    throw new HttpError(400, 'Payment amount must be greater than zero');
  }

  return prisma.$transaction(async (tx) => {
    // 1. Fetch invoice inside transaction
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true },
    });

    if (!invoice) {
      throw new HttpError(404, 'Invoice not found');
    }

    if (invoice.status === 'DRAFT') {
      throw new HttpError(400, 'Cannot record payment for a draft invoice. Confirm it first.');
    }

    if (invoice.status === 'CANCELLED') {
      throw new HttpError(400, 'Cannot record payment for a cancelled invoice');
    }

    if (invoice.status === 'PAID' || Number(invoice.balanceDue) <= 0) {
      throw new HttpError(400, 'This invoice is already fully paid');
    }

    const currentBalance = Number(invoice.balanceDue);
    if (payAmount > currentBalance) {
      throw new HttpError(
        400,
        `Payment amount (${payAmount.toFixed(2)}) exceeds outstanding balance (${currentBalance.toFixed(2)})`,
      );
    }

    // 2. Create Payment record
    const payment = await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        method,
        amount: payAmount,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        note: note || null,
        recordedById: actor.id,
      },
      include: {
        recordedBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    // 3. Recompute balance and status
    const currentPaid = Number(invoice.amountPaid);
    const newPaidTotal = currentPaid + payAmount;
    const { status: newStatus, amountPaid, balanceDue } = applyPaymentStatus(
      Number(invoice.grandTotal),
      newPaidTotal,
    );

    // 4. Update Invoice
    const updatedInvoice = await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        amountPaid,
        balanceDue,
        status: newStatus,
      },
    });

    return {
      payment,
      invoice: updatedInvoice,
    };
  });
}

export async function listPayments({ actor, invoiceId, customerId, page = 1, pageSize = 20 }) {
  const where = {};

  if (actor.role === 'CUSTOMER') {
    const ownCustomerId = actor.customer?.id;
    if (!ownCustomerId) return { payments: [], total: 0, page, pageSize, totalPages: 0 };
    where.invoice = { customerId: ownCustomerId };
  } else {
    if (customerId) {
      where.invoice = { customerId };
    }
  }

  if (invoiceId) {
    where.invoiceId = invoiceId;
  }

  const skip = (page - 1) * pageSize;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { paidAt: 'desc' },
      include: {
        invoice: {
          select: {
            id: true,
            number: true,
            status: true,
            grandTotal: true,
            balanceDue: true,
            customer: {
              select: { id: true, companyName: true },
            },
          },
        },
        recordedBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    payments,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}
