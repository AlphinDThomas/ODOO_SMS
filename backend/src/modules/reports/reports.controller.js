import * as reportsService from './reports.service.js';

export async function getFinanceReport(req, res, next) {
  try {
    const { startDate, endDate } = req.query;

    const data = await reportsService.getFinanceAnalytics({
      startDate,
      endDate,
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
}

