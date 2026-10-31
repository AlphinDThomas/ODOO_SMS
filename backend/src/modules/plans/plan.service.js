import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../utils/httpError.js';

export async function listPlans({ page, pageSize, interval, isActive, search }) {
  const skip = (page - 1) * pageSize;
  const where = {};
  if (interval !== undefined) where.interval = interval;
  if (isActive !== undefined) where.isActive = isActive;
  if (search) {
    where.OR = [{ name: { contains: search, mode: 'insensitive' } }];
  }

  const [items, total] = await prisma.$transaction([
    prisma.plan.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
    prisma.plan.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getPlan(id) {
  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) throw new HttpError(404, 'Plan not found');
  return plan;
}

export async function createPlan(body) {
  const {
    name,
    amount,
    interval,
    minQuantity,
    availableFrom,
    availableTo,
    autoCloseOnEnd,
    allowEarlyClose,
    allowPause,
    allowRenewal,
    isActive,
  } = body;

  // Validate dates
  if (availableTo && new Date(availableTo) <= new Date(availableFrom)) {
    throw new HttpError(400, 'availableTo must be after availableFrom');
  }

  return prisma.plan.create({
    data: {
      name,
      amount,
      interval,
      minQuantity: minQuantity ?? 1,
      availableFrom: new Date(availableFrom),
      availableTo: availableTo ? new Date(availableTo) : null,
      autoCloseOnEnd: autoCloseOnEnd ?? true,
      allowEarlyClose: allowEarlyClose ?? false,
      allowPause: allowPause ?? false,
      allowRenewal: allowRenewal ?? true,
      isActive: isActive ?? true,
    },
  });
}

export async function updatePlan(id, body) {
  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) throw new HttpError(404, 'Plan not found');

  const from = body.availableFrom ? new Date(body.availableFrom) : plan.availableFrom;
  const to = body.availableTo !== undefined ? (body.availableTo ? new Date(body.availableTo) : null) : plan.availableTo;
  if (to && to <= from) {
    throw new HttpError(400, 'availableTo must be after availableFrom');
  }

  return prisma.plan.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.amount !== undefined && { amount: body.amount }),
      ...(body.interval !== undefined && { interval: body.interval }),
      ...(body.minQuantity !== undefined && { minQuantity: body.minQuantity }),
      ...(body.availableFrom !== undefined && { availableFrom: new Date(body.availableFrom) }),
      ...(body.availableTo !== undefined && { availableTo: body.availableTo ? new Date(body.availableTo) : null }),
      ...(body.autoCloseOnEnd !== undefined && { autoCloseOnEnd: body.autoCloseOnEnd }),
      ...(body.allowEarlyClose !== undefined && { allowEarlyClose: body.allowEarlyClose }),
      ...(body.allowPause !== undefined && { allowPause: body.allowPause }),
      ...(body.allowRenewal !== undefined && { allowRenewal: body.allowRenewal }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });
}

export async function deletePlan(id) {
  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) throw new HttpError(404, 'Plan not found');
  return prisma.plan.update({ where: { id }, data: { isActive: false } });
}
