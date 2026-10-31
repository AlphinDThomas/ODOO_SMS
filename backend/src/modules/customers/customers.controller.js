import * as customerService from './customers.service.js';

export async function listCustomers(req, res, next) {
  try {
    const result = await customerService.listCustomers(req.query);
    res.json({
      success: true,
      data: result,
      items: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCustomer(req, res, next) {
  try {
    const customer = await customerService.getCustomerById(req.params.id, req.profile);
    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
}

export async function createCustomer(req, res, next) {
  try {
    const customer = await customerService.createCustomer(req.body);
    res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCustomer(req, res, next) {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body, req.profile);
    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
}
