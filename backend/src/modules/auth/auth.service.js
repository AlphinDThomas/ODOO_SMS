import { prisma } from '../../config/prisma.js';
import { adminAuthClient } from '../../config/supabase.js';
import { HttpError } from '../../utils/httpError.js';

async function createAuthUser({ email, password, fullName, emailConfirm, role }) {
  const { data, error } = await adminAuthClient.auth.admin.createUser({
    email,
    password,
    email_confirm: emailConfirm,
    app_metadata: { role },
    user_metadata: { fullName, role },
  });

  if (error) {
    if (String(error.message).toLowerCase().includes('already')) {
      throw new HttpError(409, 'An account with this email already exists');
    }
    throw new HttpError(400, error.message);
  }

  return data.user;
}

export async function registerCustomer({ email, password, fullName, companyName }) {
  const existing = await prisma.userProfile.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    throw new HttpError(409, 'An account with this email already exists');
  }

  // Use admin client with email_confirm: true to prevent hitting Supabase free-tier SMTP rate limits
  const user = await createAuthUser({
    email,
    password,
    fullName,
    emailConfirm: true,
    role: 'CUSTOMER',
  });

  try {
    return await prisma.$transaction(async (tx) => {
      const profile = await tx.userProfile.create({
        data: {
          id: user.id,
          email: email.toLowerCase(),
          fullName,
          role: 'CUSTOMER',
        },
      });

      const customer = await tx.customer.create({
        data: {
          userId: profile.id,
          companyName,
          billingEmail: email.toLowerCase(),
        },
      });

      return { profile, customer };
    });
  } catch (error) {
    await adminAuthClient.auth.admin.deleteUser(user.id);
    throw error;
  }
}

export async function createStaffAccount({ email, password, fullName }) {
  const existing = await prisma.userProfile.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    throw new HttpError(409, 'An account with this email already exists');
  }

  const user = await createAuthUser({
    email,
    password,
    fullName,
    emailConfirm: true,
    role: 'STAFF',
  });

  try {
    return await prisma.userProfile.create({
      data: {
        id: user.id,
        email: email.toLowerCase(),
        fullName,
        role: 'STAFF',
      },
    });
  } catch (error) {
    await adminAuthClient.auth.admin.deleteUser(user.id);
    throw error;
  }
}

export async function getSession(profile) {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    role: profile.role,
    customerId: profile.customer?.id ?? null,
  };
}

export async function listUsers({ page = 1, pageSize = 20 } = {}) {
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    prisma.userProfile.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        customer: { select: { id: true, companyName: true } },
      },
    }),
    prisma.userProfile.count(),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}

export function assertRoleImmutable(payload) {
  if (payload && 'role' in payload) {
    delete payload.role;
  }
}
