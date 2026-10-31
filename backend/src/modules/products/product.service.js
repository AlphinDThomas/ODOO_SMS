import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../utils/httpError.js';

export async function listProducts({ page, pageSize, type, isActive, search }) {
  const skip = (page - 1) * pageSize;
  const where = {};

  if (type !== undefined) where.type = type;
  if (isActive !== undefined) where.isActive = isActive;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { notes: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        variants: { where: { isActive: true }, orderBy: { name: 'asc' } },
        taxRules: { include: { taxRule: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getProduct(id) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { name: 'asc' } },
      taxRules: { include: { taxRule: true } },
    },
  });
  if (!product) throw new HttpError(404, 'Product not found');
  return product;
}

export async function createProduct({ name, type, salesPrice, costPrice, notes, isActive, taxRuleIds }) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name,
        type,
        salesPrice,
        costPrice,
        notes,
        isActive: isActive ?? true,
      },
    });

    if (taxRuleIds?.length) {
      await tx.productTaxRule.createMany({
        data: taxRuleIds.map((taxRuleId) => ({ productId: product.id, taxRuleId })),
      });
    }

    return tx.product.findUnique({
      where: { id: product.id },
      include: {
        variants: true,
        taxRules: { include: { taxRule: true } },
      },
    });
  });
}

export async function updateProduct(id, { name, type, salesPrice, costPrice, notes, isActive, taxRuleIds }) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Product not found');

  return prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(salesPrice !== undefined && { salesPrice }),
        ...(costPrice !== undefined && { costPrice }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    if (taxRuleIds !== undefined) {
      await tx.productTaxRule.deleteMany({ where: { productId: id } });
      if (taxRuleIds.length) {
        await tx.productTaxRule.createMany({
          data: taxRuleIds.map((taxRuleId) => ({ productId: id, taxRuleId })),
        });
      }
    }

    return tx.product.findUnique({
      where: { id },
      include: {
        variants: { orderBy: { name: 'asc' } },
        taxRules: { include: { taxRule: true } },
      },
    });
  });
}

export async function deleteProduct(id) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Product not found');
  // Soft delete
  return prisma.product.update({ where: { id }, data: { isActive: false } });
}

// Variants
export async function listVariants(productId) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new HttpError(404, 'Product not found');
  return prisma.productVariant.findMany({
    where: { productId },
    orderBy: { name: 'asc' },
  });
}

export async function createVariant(productId, { name, priceAdjustment, isActive }) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new HttpError(404, 'Product not found');

  try {
    return await prisma.productVariant.create({
      data: {
        productId,
        name,
        priceAdjustment,
        isActive: isActive ?? true,
      },
    });
  } catch (err) {
    if (err.code === 'P2002') {
      throw new HttpError(409, 'A variant with this name already exists for this product');
    }
    throw err;
  }
}

export async function updateVariant(productId, variantId, body) {
  const variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId } });
  if (!variant) throw new HttpError(404, 'Variant not found');

  return prisma.productVariant.update({
    where: { id: variantId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.priceAdjustment !== undefined && { priceAdjustment: body.priceAdjustment }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });
}

export async function deleteVariant(productId, variantId) {
  const variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId } });
  if (!variant) throw new HttpError(404, 'Variant not found');
  return prisma.productVariant.update({ where: { id: variantId }, data: { isActive: false } });
}
