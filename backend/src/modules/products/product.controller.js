import * as productService from './product.service.js';

export async function list(req, res, next) {
  try {
    const result = await productService.listProducts(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function get(req, res, next) {
  try {
    const product = await productService.getProduct(req.params.id);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await productService.deleteProduct(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function listVariants(req, res, next) {
  try {
    const variants = await productService.listVariants(req.params.id);
    res.json(variants);
  } catch (err) {
    next(err);
  }
}

export async function createVariant(req, res, next) {
  try {
    const variant = await productService.createVariant(req.params.id, req.body);
    res.status(201).json(variant);
  } catch (err) {
    next(err);
  }
}

export async function updateVariant(req, res, next) {
  try {
    const variant = await productService.updateVariant(req.params.id, req.params.variantId, req.body);
    res.json(variant);
  } catch (err) {
    next(err);
  }
}

export async function removeVariant(req, res, next) {
  try {
    await productService.deleteVariant(req.params.id, req.params.variantId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
