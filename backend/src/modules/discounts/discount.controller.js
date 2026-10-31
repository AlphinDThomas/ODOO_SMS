import * as discountService from './discount.service.js';

export async function list(req, res, next) {
  try {
    res.json(await discountService.listDiscounts(req.query));
  } catch (err) {
    next(err);
  }
}

export async function get(req, res, next) {
  try {
    res.json(await discountService.getDiscount(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const item = await discountService.createDiscount(req.body);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const item = await discountService.updateDiscount(req.params.id, req.body);
    res.json(item);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await discountService.deleteDiscount(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
