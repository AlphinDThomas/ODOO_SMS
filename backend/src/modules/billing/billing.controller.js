import { prisma } from '../../config/prisma.js';
import * as billingEngine from './billing.engine.js';

export async function runBilling(req, res, next) {
  try {
    const { asOfDate, subscriptionId } = req.body || {};
    const results = await billingEngine.runBillingCycle({
      asOfDate: asOfDate ? new Date(asOfDate) : new Date(),
      subscriptionId,
      actorId: req.profile?.id,
    });
    res.json(results);
  } catch (error) {
    next(error);
  }
}

export async function getBillingHistory(req, res, next) {
  try {
    const limit = Number(req.query.limit || 50);
    const records = await prisma.billingRecord.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: {
          select: {
            id: true,
            number: true,
            status: true,
            customer: {
              select: { id: true, companyName: true, billingEmail: true },
            },
          },
        },
        invoice: {
          select: {
            id: true,
            number: true,
            status: true,
            grandTotal: true,
            balanceDue: true,
          },
        },
        attempts: {
          orderBy: { attemptedAt: 'desc' },
          take: 5,
        },
      },
    });

    res.json({ records });
  } catch (error) {
    next(error);
  }
}
