import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../utils/httpError.js';

export async function listDiscounts({ page, pageSize, isActive, scope }) {
  const skip = (page - 1) * pageSize;
  const where = {};
  if (isActive !== undefined) where.isActive = isActive;
  if (scope !== undefined) where.scope = scope;

  const [items, total] = await prisma.$transaction([
    prisma.discountRule.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { products: { include: { product: { select: { id: true, name: true } } } } },
    }),
    prisma.discountRule.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getDiscount(id) {
  const discount = await prisma.discountRule.findUnique({
    where: { id },
    include: { products: { include: { product: { select: { id: true, name: true } } } } },
  });
  if (!discount) throw new HttpError(404, 'Discount not found');
  return discount;
}

export async function createDiscount(body) {
  const {
    name,
    type,
    value,
    minPurchaseAmount,
    minQuantity,
    validFrom,
    validTo,
    maxUses,
    scope,
    isActive,
    productIds,
  } = body;

  if (validTo && new Date(validTo) <= new Date(validFrom)) {
    throw new HttpError(400, 'validTo must be after validFrom');
  }

  return prisma.$transaction(async (tx) => {
    const discount = await tx.discountRule.create({
      data: {
        name,
        type,
        value,
        minPurchaseAmount: minPurchaseAmount ?? null,
        minQuantity: minQuantity ?? null,
        validFrom: new Date(validFrom),
        validTo: validTo ? new Date(validTo) : null,
        maxUses: maxUses ?? null,
        scope,
        isActive: isActive ?? true,
      },
    });

    if (scope === 'PRODUCT' && productIds?.length) {
      await tx.discountProduct.createMany({
        data: productIds.map((productId) => ({ discountId: discount.id, productId })),
      });
    }

    return tx.discountRule.findUnique({
      where: { id: discount.id },
      include: { products: { include: { product: { select: { id: true, name: true } } } } },
    });
  });
}

export async function updateDiscount(id, body) {
  const discount = await prisma.discountRule.findUnique({ where: { id } });
  if (!discount) throw new HttpError(404, 'Discount not found');

  const from = body.validFrom ? new Date(body.validFrom) : discount.validFrom;
  const to = body.validTo !== undefined ? (body.validTo ? new Date(body.validTo) : null) : discount.validTo;
  if (to && to <= from) {
    throw new HttpError(400, 'validTo must be after validFrom');
  }

  return prisma.$transaction(async (tx) => {
    await tx.discountRule.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.value !== undefined && { value: body.value }),
        ...(body.minPurchaseAmount !== undefined && { minPurchaseAmount: body.minPurchaseAmount }),
        ...(body.minQuantity !== undefined && { minQuantity: body.minQuantity }),
        ...(body.validFrom !== undefined && { validFrom: new Date(body.validFrom) }),
        ...(body.validTo !== undefined && { validTo: body.validTo ? new Date(body.validTo) : null }),
        ...(body.maxUses !== undefined && { maxUses: body.maxUses }),
        ...(body.scope !== undefined && { scope: body.scope }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    if (body.productIds !== undefined) {
      await tx.discountProduct.deleteMany({ where: { discountId: id } });
      if (body.productIds.length) {
        await tx.discountProduct.createMany({
          data: body.productIds.map((productId) => ({ discountId: id, productId })),
        });
      }
    }

    return tx.discountRule.findUnique({
      where: { id },
      include: { products: { include: { product: { select: { id: true, name: true } } } } },
    });
  });
}

export async function deleteDiscount(id) {
  const discount = await prisma.discountRule.findUnique({ where: { id } });
  if (!discount) throw new HttpError(404, 'Discount not found');
  return prisma.discountRule.update({ where: { id }, data: { isActive: false } });
}
