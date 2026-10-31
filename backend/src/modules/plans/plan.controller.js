import * as planService from './plan.service.js';

export async function list(req, res, next) {
  try {
    res.json(await planService.listPlans(req.query));
  } catch (err) { next(err); }
}

export async function get(req, res, next) {
  try {
    res.json(await planService.getPlan(req.params.id));
  } catch (err) { next(err); }
}

export async function create(req, res, next) {
  try {
    res.status(201).json(await planService.createPlan(req.body));
  } catch (err) { next(err); }
}

export async function update(req, res, next) {
  try {
    res.json(await planService.updatePlan(req.params.id, req.body));
  } catch (err) { next(err); }
}

export async function remove(req, res, next) {
  try {
    await planService.deletePlan(req.params.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
}
