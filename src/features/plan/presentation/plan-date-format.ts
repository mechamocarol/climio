import { getDefaultPlanDate, isCalendarDate } from '@/features/plan/domain/plan';

const WEEKDAY_SHORT = [
  'Dom',
  'Seg',
  'Ter',
  'Qua',
  'Qui',
  'Sex',
  'Sáb',
] as const;

const MONTH_SHORT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const;

/**
 * Parses `YYYY-MM-DD` as a local calendar day (noon avoids DST edge cases).
 * Returns null when the string is not a calendar date.
 */
export function parsePlanDateLocal(date: string): Date | null {
  if (!isCalendarDate(date)) {
    return null;
  }

  const [yearText, monthText, dayText] = date.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return null;
  }

  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/** True when `date` is strictly before today's local calendar day. */
export function isPastPlanDate(
  date: string,
  now: Date = new Date(),
): boolean {
  const parsed = parsePlanDateLocal(date);
  if (parsed === null) {
    return true;
  }

  return date < getDefaultPlanDate(now);
}

/** Today and future calendar days only. */
export function isSelectablePlanDate(
  date: string,
  now: Date = new Date(),
): boolean {
  return isCalendarDate(date) && !isPastPlanDate(date, now);
}

/**
 * Builds the next `count` selectable plan dates starting at today (local).
 */
export function listSelectablePlanDates(
  count: number,
  now: Date = new Date(),
): readonly string[] {
  const safeCount = Math.max(0, Math.floor(count));
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dates: string[] = [];

  for (let offset = 0; offset < safeCount; offset += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + offset);
    dates.push(getDefaultPlanDate(day));
  }

  return dates;
}

export type PlanDateParts = Readonly<{
  date: string;
  dayNumber: string;
  weekdayLabel: string;
  monthLabel: string;
  relativeLabel: 'Hoje' | 'Amanhã' | null;
}>;

export function getPlanDateParts(
  date: string,
  now: Date = new Date(),
): PlanDateParts | null {
  const parsed = parsePlanDateLocal(date);
  if (parsed === null) {
    return null;
  }

  const today = getDefaultPlanDate(now);
  const tomorrowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = getDefaultPlanDate(tomorrowDate);

  let relativeLabel: PlanDateParts['relativeLabel'] = null;
  if (date === today) {
    relativeLabel = 'Hoje';
  } else if (date === tomorrow) {
    relativeLabel = 'Amanhã';
  }

  return {
    date,
    dayNumber: String(parsed.getDate()),
    weekdayLabel: WEEKDAY_SHORT[parsed.getDay()] ?? 'Dia',
    monthLabel: MONTH_SHORT[parsed.getMonth()] ?? 'mês',
    relativeLabel,
  };
}

/** Human label for summary/result, e.g. "Hoje, 7 de out" or "Sex, 10 de out". */
export function formatPlanDateLabel(
  date: string,
  now: Date = new Date(),
): string {
  const parts = getPlanDateParts(date, now);
  if (parts === null) {
    return date;
  }

  const head = parts.relativeLabel ?? parts.weekdayLabel;
  return `${head}, ${parts.dayNumber} de ${parts.monthLabel}`;
}

/** Compact date for result subtitle, e.g. "Hoje" or "Sex". */
export function formatPlanDateShortLabel(
  date: string,
  now: Date = new Date(),
): string {
  const parts = getPlanDateParts(date, now);
  if (parts === null) {
    return date;
  }
  return parts.relativeLabel ?? parts.weekdayLabel;
}
