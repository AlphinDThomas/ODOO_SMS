import * as invoicesService from './invoices.service.js';

export async function listInvoices(req, res, next) {
  try {
    const result = await invoicesService.listInvoices({
      actor: req.profile,
      ...req.query,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getInvoice(req, res, next) {
  try {
    const invoice = await invoicesService.getInvoiceById(req.params.id, req.profile);
    res.json(invoice);
  } catch (error) {
    next(error);
  }
}

export async function confirmInvoice(req, res, next) {
  try {
    const invoice = await invoicesService.confirmInvoice(req.params.id);
    res.json({ message: 'Invoice confirmed', invoice });
  } catch (error) {
    next(error);
  }
}

export async function cancelInvoice(req, res, next) {
  try {
    const invoice = await invoicesService.cancelInvoice(req.params.id);
    res.json({ message: 'Invoice cancelled', invoice });
  } catch (error) {
    next(error);
  }
}

export async function sendInvoice(req, res, next) {
  try {
    const result = await invoicesService.sendInvoice(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
