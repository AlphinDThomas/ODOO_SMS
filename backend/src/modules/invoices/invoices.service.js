import { prisma } from '../../config/prisma.js';
import { toUtcDate } from '../../utils/dates.js';
import { HttpError } from '../../utils/httpError.js';

export async function listInvoices({
  actor,
  page = 1,
  pageSize = 20,
  status = 'ALL',
  search,
  customerId,
  subscriptionId,
}) {
  const where = {};

  // Customer scope enforcement
  if (actor.role === 'CUSTOMER') {
    const ownCustomerId = actor.customer?.id;
    if (!ownCustomerId) {
      return { invoices: [], total: 0, page, pageSize, totalPages: 0, metrics: { totalDue: 0, totalPaid: 0, countOverdue: 0, totalOverdue: 0 } };
    }
    where.customerId = ownCustomerId;
  } else if (customerId) {
    where.customerId = customerId;
  }

  if (subscriptionId) {
    where.subscriptionId = subscriptionId;
  }

  const today = toUtcDate(new Date());

  // Status handling including virtual OVERDUE
  if (status && status !== 'ALL') {
    if (status === 'OVERDUE') {
      where.status = { in: ['CONFIRMED', 'PARTIALLY_PAID'] };
      where.dueDate = { lt: today };
    } else {
      where.status = status;
    }
  }

  // Search by invoice number or customer name
  if (search) {
    where.OR = [
      { number: { contains: search, mode: 'insensitive' } },
      { customer: { companyName: { contains: search, mode: 'insensitive' } } },
      { customer: { billingEmail: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const skip = (page - 1) * pageSize;

  const [invoices, total, allUnpaid, allPaid, allOverdue] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            billingEmail: true,
          },
        },
        subscription: {
          select: {
            id: true,
            number: true,
            plan: { select: { name: true, interval: true } },
          },
        },
        _count: {
          select: { payments: true, lines: true },
        },
      },
    }),
    prisma.invoice.count({ where }),

    // Metrics for dashboard summary cards
    prisma.invoice.aggregate({
      where: actor.role === 'CUSTOMER' ? { customerId: actor.customer?.id } : {},
      _sum: { balanceDue: true },
    }),
    prisma.invoice.aggregate({
      where: actor.role === 'CUSTOMER' ? { customerId: actor.customer?.id } : {},
      _sum: { amountPaid: true },
    }),
    prisma.invoice.findMany({
      where: {
        ...(actor.role === 'CUSTOMER' ? { customerId: actor.customer?.id } : {}),
        status: { in: ['CONFIRMED', 'PARTIALLY_PAID'] },
        dueDate: { lt: today },
      },
      select: { balanceDue: true },
    }),
  ]);

  const countOverdue = allOverdue.length;
  const totalOverdue = allOverdue.reduce((acc, curr) => acc + Number(curr.balanceDue), 0);

  return {
    invoices: invoices.map((inv) => ({
      ...inv,
      isOverdue:
        ['CONFIRMED', 'PARTIALLY_PAID'].includes(inv.status) &&
        toUtcDate(inv.dueDate).getTime() < today.getTime(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
    metrics: {
      totalDue: Number(allUnpaid._sum.balanceDue || 0),
      totalPaid: Number(allPaid._sum.amountPaid || 0),
      countOverdue,
      totalOverdue,
    },
  };
}

export async function getInvoiceById(id, actor) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      subscription: {
        include: {
          plan: true,
        },
      },
      lines: {
        include: {
          product: true,
          variant: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
      payments: {
        include: {
          recordedBy: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { paidAt: 'desc' },
      },
      billingRecord: true,
    },
  });

  if (!invoice) {
    throw new HttpError(404, 'Invoice not found');
  }

  // Customer permission check
  if (actor.role === 'CUSTOMER') {
    const ownCustomerId = actor.customer?.id;
    if (!ownCustomerId || ownCustomerId !== invoice.customerId) {
      throw new HttpError(403, 'You can only view your own invoices');
    }
  }

  const today = toUtcDate(new Date());
  const isOverdue =
    ['CONFIRMED', 'PARTIALLY_PAID'].includes(invoice.status) &&
    toUtcDate(invoice.dueDate).getTime() < today.getTime();

  return {
    ...invoice,
    isOverdue,
  };
}

export async function confirmInvoice(id) {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) {
    throw new HttpError(404, 'Invoice not found');
  }

  if (invoice.status !== 'DRAFT') {
    throw new HttpError(400, `Cannot confirm an invoice with status ${invoice.status}`);
  }

  return prisma.invoice.update({
    where: { id },
    data: {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
    },
  });
}

export async function cancelInvoice(id) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { payments: true, billingRecord: true },
  });

  if (!invoice) {
    throw new HttpError(404, 'Invoice not found');
  }

  if (invoice.status === 'PAID') {
    throw new HttpError(400, 'Cannot cancel a fully paid invoice');
  }

  if (invoice.payments.length > 0 || Number(invoice.amountPaid) > 0) {
    throw new HttpError(400, 'Cannot cancel an invoice with recorded payments');
  }

  return prisma.$transaction(async (tx) => {
    // Void billing record so period can be re-billed if appropriate
    if (invoice.billingRecord) {
      await tx.billingRecord.update({
        where: { id: invoice.billingRecord.id },
        data: { voidedAt: new Date() },
      });
    }

    return tx.invoice.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });
  });
}

export async function sendInvoice(id) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { customer: true },
  });

  if (!invoice) {
    throw new HttpError(404, 'Invoice not found');
  }

  const sentAt = new Date();
  await prisma.invoice.update({
    where: { id },
    data: { sentAt },
  });

  return {
    sentAt,
    recipientEmail: invoice.customer.billingEmail,
    message: `Invoice ${invoice.number} sent to ${invoice.customer.billingEmail}`,
  };
}
