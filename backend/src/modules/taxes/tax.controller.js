import * as taxService from './tax.service.js';

export async function list(req, res, next) {
  try {
    const items = await taxService.listTaxRules(req.query);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function get(req, res, next) {
  try {
    const rule = await taxService.getTaxRule(req.params.id);
    res.json(rule);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const rule = await taxService.createTaxRule(req.body);
    res.status(201).json(rule);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const rule = await taxService.updateTaxRule(req.params.id, req.body);
    res.json(rule);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await taxService.deleteTaxRule(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
