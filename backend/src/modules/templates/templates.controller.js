import * as templateService from './templates.service.js';

export async function listTemplates(req, res, next) {
  try {
    const result = await templateService.listTemplates(req.query);
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

export async function getTemplate(req, res, next) {
  try {
    const template = await templateService.getTemplateById(req.params.id);
    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
}

export async function createTemplate(req, res, next) {
  try {
    const template = await templateService.createTemplate(req.body);
    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTemplate(req, res, next) {
  try {
    const template = await templateService.updateTemplate(req.params.id, req.body);
    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTemplate(req, res, next) {
  try {
    await templateService.deleteTemplate(req.params.id);
    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}
