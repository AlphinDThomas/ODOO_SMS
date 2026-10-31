const MS_DAY = 24 * 60 * 60 * 1000;

export function toUtcDate(value) {
  const d = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function addDays(date, days) {
  const d = toUtcDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function addInterval(date, interval) {
  const d = toUtcDate(date);
  if (interval === 'DAILY') return addDays(d, 1);
  if (interval === 'WEEKLY') return addDays(d, 7);
  if (interval === 'YEARLY') {
    const day = d.getUTCDate();
    const month = d.getUTCMonth();
    d.setUTCDate(1);
    d.setUTCFullYear(d.getUTCFullYear() + 1);
    d.setUTCMonth(month);
    const lastDay = new Date(Date.UTC(d.getUTCFullYear(), month + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(day, lastDay));
    return d;
  }
  if (interval === 'MONTHLY') {
    const day = d.getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + 1);
    const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(day, lastDay));
    return d;
  }
  throw new Error(`Unsupported interval: ${interval}`);
}

/**
 * A period is eligible when its start is on/after the subscription start
 * and strictly before expiry. The last eligible period is the latest
 * periodStart < expiryDate. Auto-close runs only after that period is billed.
 */
export function isEligibleBillingPeriod(periodStart, startDate, expiryDate) {
  const start = toUtcDate(periodStart).getTime();
  return start >= toUtcDate(startDate).getTime() && start < toUtcDate(expiryDate).getTime();
}

export function lastEligiblePeriodStart(startDate, expiryDate, interval) {
  let cursor = toUtcDate(startDate);
  let last = null;
  while (isEligibleBillingPeriod(cursor, startDate, expiryDate)) {
    last = cursor;
    cursor = addInterval(cursor, interval);
  }
  return last;
}

export function shouldAutoCloseAfterPeriod(periodEnd, expiryDate, autoCloseOnEnd) {
  if (!autoCloseOnEnd) return false;
  return toUtcDate(periodEnd).getTime() >= toUtcDate(expiryDate).getTime();
}

export function isQuotationExpired(quotationExpiresAt, now = new Date()) {
  if (!quotationExpiresAt) return false;
  return new Date(quotationExpiresAt).getTime() <= now.getTime();
}

export function quotationExpiryFrom(submittedAt, validityDays) {
  return new Date(new Date(submittedAt).getTime() + validityDays * MS_DAY);
}

export function resumeBillingDate(pausedAt, originalNextBillingDate, today = new Date()) {
  const next = toUtcDate(originalNextBillingDate);
  const t = toUtcDate(today);
  if (!pausedAt) return next;
  return next.getTime() < t.getTime() ? t : next;
}
