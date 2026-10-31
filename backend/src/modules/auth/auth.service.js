import { prisma } from '../../config/prisma.js';
import { adminAuthClient, authClient } from '../../config/supabase.js';
import { HttpError } from '../../utils/httpError.js';

async function createAuthUser({ email, password, fullName, emailConfirm }) {
  const { data, error } = await adminAuthClient.auth.admin.createUser({
    email,
    password,
    email_confirm: emailConfirm,
    user_metadata: { fullName },
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

  const { data, error } = await authClient.auth.signUp({
    email,
    password,
    options: { data: { fullName } },
  });

  if (error) {
    if (String(error.message).toLowerCase().includes('already')) {
      throw new HttpError(409, 'An account with this email already exists');
    }
    throw new HttpError(400, error.message);
  }

  const user = data.user;
  if (!user?.id) {
    throw new HttpError(400, 'Registration did not return a user. Confirm email settings in Supabase Auth.');
  }

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

export async function listUsers({ page = 1, pageSize = 20 }) {
  const skip = (page - 1) * pageSize;
  const [items, total] = await prisma.$transaction([
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
      },
    }),
    prisma.userProfile.count(),
  ]);

  return { items, total, page, pageSize };
}

export function assertRoleImmutable(body) {
  if (body && Object.prototype.hasOwnProperty.call(body, 'role')) {
    throw new HttpError(400, 'Role cannot be set from this request');
  }
}
