import * as authService from './auth.service.js';

export async function register(req, res, next) {
  try {
    authService.assertRoleImmutable(req.body);
    const result = await authService.registerCustomer(req.body);
    res.status(201).json({
      id: result.profile.id,
      email: result.profile.email,
      role: result.profile.role,
      customerId: result.customer.id,
    });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    const session = await authService.getSession(req.profile);
    res.json(session);
  } catch (error) {
    next(error);
  }
}

export async function createStaff(req, res, next) {
  try {
    authService.assertRoleImmutable(req.body);
    const profile = await authService.createStaffAccount(req.body);
    res.status(201).json({
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      role: profile.role,
    });
  } catch (error) {
    next(error);
  }
}

export async function listUsers(req, res, next) {
  try {
    const result = await authService.listUsers(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
