import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../utils/httpError.js';

export async function listCustomers({ search, page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { companyName: { contains: search, mode: 'insensitive' } },
          { billingEmail: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [total, items] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            subscriptions: true,
            invoices: true,
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

export async function getCustomerById(id, actor) {
  if (actor.role === 'CUSTOMER') {
    const ownId = actor.customer?.id;
    if (!ownId || ownId !== id) {
      throw new HttpError(403, 'You can only access your own customer profile');
    }
  }

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
        },
      },
      subscriptions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              interval: true,
              amount: true,
            },
          },
          _count: {
            select: { lines: true },
          },
        },
      },
      _count: {
        select: {
          subscriptions: true,
          invoices: true,
        },
      },
    },
  });

  if (!customer) {
    throw new HttpError(404, 'Customer not found');
  }

  return customer;
}

export async function createCustomer(data) {
  const existing = await prisma.customer.findFirst({
    where: { billingEmail: data.billingEmail.toLowerCase().trim() },
  });

  if (existing) {
    throw new HttpError(409, 'A customer with this billing email already exists');
  }

  if (data.userId) {
    const user = await prisma.userProfile.findUnique({
      where: { id: data.userId },
      include: { customer: true },
    });
    if (!user) {
      throw new HttpError(404, 'Linked user profile not found');
    }
    if (user.customer) {
      throw new HttpError(409, 'User is already associated with another customer profile');
    }
  }

  const customer = await prisma.customer.create({
    data: {
      companyName: data.companyName.trim(),
      billingEmail: data.billingEmail.toLowerCase().trim(),
      phone: data.phone?.trim() || null,
      addressLine1: data.addressLine1?.trim() || null,
      addressLine2: data.addressLine2?.trim() || null,
      city: data.city?.trim() || null,
      state: data.state?.trim() || null,
      postalCode: data.postalCode?.trim() || null,
      country: data.country?.trim() || null,
      userId: data.userId || null,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
        },
      },
    },
  });

  return customer;
}

export async function updateCustomer(id, data, actor) {
  if (actor.role === 'CUSTOMER') {
    const ownId = actor.customer?.id;
    if (!ownId || ownId !== id) {
      throw new HttpError(403, 'You can only update your own customer profile');
    }
  }

  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Customer not found');
  }

  if (data.billingEmail && data.billingEmail.toLowerCase().trim() !== existing.billingEmail) {
    const emailConflict = await prisma.customer.findFirst({
      where: {
        billingEmail: data.billingEmail.toLowerCase().trim(),
        NOT: { id },
      },
    });
    if (emailConflict) {
      throw new HttpError(409, 'Another customer is already using this billing email');
    }
  }

  if (data.userId && data.userId !== existing.userId) {
    if (actor.role === 'CUSTOMER') {
      throw new HttpError(403, 'Customers cannot modify user link');
    }
    const user = await prisma.userProfile.findUnique({
      where: { id: data.userId },
      include: { customer: true },
    });
    if (!user) {
      throw new HttpError(404, 'Linked user profile not found');
    }
    if (user.customer && user.customer.id !== id) {
      throw new HttpError(409, 'User is already linked to another customer');
    }
  }

  const updateData = {};
  if (data.companyName !== undefined) updateData.companyName = data.companyName.trim();
  if (data.billingEmail !== undefined) updateData.billingEmail = data.billingEmail.toLowerCase().trim();
  if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
  if (data.addressLine1 !== undefined) updateData.addressLine1 = data.addressLine1?.trim() || null;
  if (data.addressLine2 !== undefined) updateData.addressLine2 = data.addressLine2?.trim() || null;
  if (data.city !== undefined) updateData.city = data.city?.trim() || null;
  if (data.state !== undefined) updateData.state = data.state?.trim() || null;
  if (data.postalCode !== undefined) updateData.postalCode = data.postalCode?.trim() || null;
  if (data.country !== undefined) updateData.country = data.country?.trim() || null;
  if (data.userId !== undefined && actor.role !== 'CUSTOMER') updateData.userId = data.userId || null;

  const customer = await prisma.customer.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
        },
      },
    },
  });

  return customer;
}
