import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../utils/httpError.js';

export async function listTemplates({ search, planId, isActive, page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;

  const where = {
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    ...(planId ? { planId } : {}),
    ...(isActive !== undefined ? { isActive: isActive === 'true' } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.quotationTemplate.count({ where }),
    prisma.quotationTemplate.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            interval: true,
            amount: true,
            allowPause: true,
            allowRenewal: true,
            allowEarlyClose: true,
          },
        },
        lines: {
          orderBy: { sortOrder: 'asc' },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                salesPrice: true,
                type: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                priceAdjustment: true,
              },
            },
          },
        },
        _count: {
          select: {
            lines: true,
            subscriptions: true,
          },
        },
      },
    }),
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getTemplateById(id) {
  const template = await prisma.quotationTemplate.findUnique({
    where: { id },
    include: {
      plan: true,
      lines: {
        orderBy: { sortOrder: 'asc' },
        include: {
          product: {
            include: {
              variants: true,
              taxRules: {
                include: { taxRule: true },
              },
            },
          },
          variant: true,
        },
      },
      _count: {
        select: {
          subscriptions: true,
        },
      },
    },
  });

  if (!template) {
    throw new HttpError(404, 'Quotation template not found');
  }

  return template;
}

export async function createTemplate(data) {
  // Validate plan exists
  const plan = await prisma.plan.findUnique({
    where: { id: data.planId },
  });
  if (!plan) {
    throw new HttpError(404, 'Associated plan not found');
  }

  // Validate all products exist
  const productIds = [...new Set(data.lines.map((l) => l.productId))];
  const foundProducts = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  if (foundProducts.length !== productIds.length) {
    throw new HttpError(400, 'One or more selected products do not exist');
  }

  // Validate variants belong to products if supplied
  for (const line of data.lines) {
    if (line.variantId) {
      const variant = await prisma.productVariant.findFirst({
        where: { id: line.variantId, productId: line.productId },
      });
      if (!variant) {
        throw new HttpError(400, `Variant ${line.variantId} does not belong to product ${line.productId}`);
      }
    }
  }

  // Create template and lines in transaction
  return await prisma.$transaction(async (tx) => {
    const template = await tx.quotationTemplate.create({
      data: {
        name: data.name.trim(),
        planId: data.planId,
        validityDays: data.validityDays,
        lines: {
          create: data.lines.map((line, idx) => ({
            productId: line.productId,
            variantId: line.variantId || null,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            sortOrder: line.sortOrder ?? idx,
          })),
        },
      },
      include: {
        plan: true,
        lines: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    return template;
  });
}

export async function updateTemplate(id, data) {
  const existing = await prisma.quotationTemplate.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new HttpError(404, 'Quotation template not found');
  }

  if (data.planId) {
    const plan = await prisma.plan.findUnique({ where: { id: data.planId } });
    if (!plan) throw new HttpError(404, 'Associated plan not found');
  }

  if (data.lines) {
    const productIds = [...new Set(data.lines.map((l) => l.productId))];
    const foundProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    if (foundProducts.length !== productIds.length) {
      throw new HttpError(400, 'One or more selected products do not exist');
    }
  }

  return await prisma.$transaction(async (tx) => {
    if (data.lines) {
      // Remove old lines and create new ones
      await tx.quotationTemplateLine.deleteMany({
        where: { templateId: id },
      });

      await tx.quotationTemplateLine.createMany({
        data: data.lines.map((line, idx) => ({
          templateId: id,
          productId: line.productId,
          variantId: line.variantId || null,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          sortOrder: line.sortOrder ?? idx,
        })),
      });
    }

    const updated = await tx.quotationTemplate.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.planId ? { planId: data.planId } : {}),
        ...(data.validityDays ? { validityDays: data.validityDays } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      include: {
        plan: true,
        lines: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    return updated;
  });
}

export async function deleteTemplate(id) {
  const existing = await prisma.quotationTemplate.findUnique({
    where: { id },
    include: { _count: { select: { subscriptions: true } } },
  });

  if (!existing) {
    throw new HttpError(404, 'Quotation template not found');
  }

  // If already used in subscriptions, soft-delete via isActive: false
  if (existing._count.subscriptions > 0) {
    return await prisma.quotationTemplate.update({
      where: { id },
      data: { isActive: false },
    });
  }

  return await prisma.quotationTemplate.delete({
    where: { id },
  });
}
