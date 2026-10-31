import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { requireAuth } from '../../middleware/auth.js';

export const catalogRouter = Router();

catalogRouter.get('/products', requireAuth, async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        variants: { where: { isActive: true } },
        taxRules: { include: { taxRule: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({
      success: true,
      data: products,
      items: products,
    });
  } catch (error) {
    next(error);
  }
});

catalogRouter.get('/plans', requireAuth, async (req, res, next) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json({
      success: true,
      data: plans,
      items: plans,
    });
  } catch (error) {
    next(error);
  }
});

catalogRouter.get('/taxes', requireAuth, async (req, res, next) => {
  try {
    const taxes = await prisma.taxRule.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json({
      success: true,
      data: taxes,
      items: taxes,
    });
  } catch (error) {
    next(error);
  }
});

catalogRouter.get('/discounts', requireAuth, async (req, res, next) => {
  try {
    const discounts = await prisma.discountRule.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json({
      success: true,
      data: discounts,
      items: discounts,
    });
  } catch (error) {
    next(error);
  }
});
