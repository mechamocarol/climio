import { getDefaultPlanDate } from '@/features/plan/domain/plan';
import {
  formatPlanDateLabel,
  isPastPlanDate,
  isSelectablePlanDate,
  listSelectablePlanDates,
  parsePlanDateLocal,
} from '@/features/plan/presentation/plan-date-format';

describe('plan date presentation', () => {
  const now = new Date(2026, 9, 7, 15, 30, 0); // 7 Oct 2026 local

  it('lists today and future dates only', () => {
    const dates = listSelectablePlanDates(3, now);

    expect(dates).toEqual(['2026-10-07', '2026-10-08', '2026-10-09']);
    expect(dates.every((date) => isSelectablePlanDate(date, now))).toBe(true);
  });

  it('rejects past calendar dates', () => {
    expect(isPastPlanDate('2026-10-06', now)).toBe(true);
    expect(isSelectablePlanDate('2026-10-06', now)).toBe(false);
    expect(isSelectablePlanDate('2026-10-07', now)).toBe(true);
  });

  it('formats relative labels for today and tomorrow', () => {
    expect(formatPlanDateLabel('2026-10-07', now)).toBe('Hoje, 7 de out');
    expect(formatPlanDateLabel('2026-10-08', now)).toBe('Amanhã, 8 de out');
  });

  it('parses calendar dates as local days', () => {
    const parsed = parsePlanDateLocal('2026-10-07');
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(9);
    expect(parsed?.getDate()).toBe(7);
  });

  it('default plan date matches first selectable day', () => {
    expect(listSelectablePlanDates(1, now)[0]).toBe(getDefaultPlanDate(now));
  });
});
