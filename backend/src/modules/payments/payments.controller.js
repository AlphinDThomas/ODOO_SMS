import * as paymentsService from './payments.service.js';

export async function recordPayment(req, res, next) {
  try {
    const result = await paymentsService.recordPayment({
      actor: req.profile,
      ...req.body,
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listPayments(req, res, next) {
  try {
    const result = await paymentsService.listPayments({
      actor: req.profile,
      ...req.query,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}
