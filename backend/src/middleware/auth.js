import { getUserFromAccessToken } from '../config/supabase.js';
import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/httpError.js';

function readAccessToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  return null;
}

export async function requireAuth(req, _res, next) {
  try {
    const accessToken = readAccessToken(req);
    if (!accessToken) {
      throw new HttpError(401, 'Missing access token');
    }

    const authUser = await getUserFromAccessToken(accessToken);
    if (!authUser?.id || !authUser.email) {
      throw new HttpError(401, 'Invalid or expired access token');
    }

    const profile = await prisma.userProfile.findUnique({
      where: { id: authUser.id },
      include: { customer: true },
    });

    if (!profile || !profile.isActive) {
      throw new HttpError(403, 'Account is not active');
    }

    req.authUser = authUser;
    req.profile = profile;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.profile || !roles.includes(req.profile.role)) {
      next(new HttpError(403, 'Insufficient permissions'));
      return;
    }
    next();
  };
}

export function requireCustomerOwner(getCustomerId) {
  return (req, _res, next) => {
    try {
      if (req.profile.role === 'ADMIN' || req.profile.role === 'STAFF') {
        next();
        return;
      }
      const customerId = getCustomerId(req);
      const ownId = req.profile.customer?.id;
      if (!ownId || ownId !== customerId) {
        throw new HttpError(403, 'You can only access your own records');
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
