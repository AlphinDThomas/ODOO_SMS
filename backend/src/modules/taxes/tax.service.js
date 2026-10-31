import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../utils/httpError.js';

export async function listTaxRules({ isActive } = {}) {
  const where = {};
  if (isActive !== undefined) where.isActive = isActive;
  return prisma.taxRule.findMany({ where, orderBy: { name: 'asc' } });
}

export async function getTaxRule(id) {
  const rule = await prisma.taxRule.findUnique({ where: { id } });
  if (!rule) throw new HttpError(404, 'Tax rule not found');
  return rule;
}

export async function createTaxRule({ name, ratePercent, isDefault, isActive }) {
  return prisma.$transaction(async (tx) => {
    // Only one tax rule may be the default at a time.
    if (isDefault) {
      await tx.taxRule.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }
    return tx.taxRule.create({
      data: {
        name,
        ratePercent,
        isDefault: isDefault ?? false,
        isActive: isActive ?? true,
      },
    });
  });
}

export async function updateTaxRule(id, body) {
  const rule = await prisma.taxRule.findUnique({ where: { id } });
  if (!rule) throw new HttpError(404, 'Tax rule not found');

  return prisma.$transaction(async (tx) => {
    // If this update is setting isDefault=true, clear all others first.
    if (body.isDefault === true) {
      await tx.taxRule.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }
    return tx.taxRule.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.ratePercent !== undefined && { ratePercent: body.ratePercent }),
        ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });
  });
}

export async function deleteTaxRule(id) {
  const rule = await prisma.taxRule.findUnique({ where: { id } });
  if (!rule) throw new HttpError(404, 'Tax rule not found');
  return prisma.taxRule.update({ where: { id }, data: { isActive: false } });
}
