import {
  compareLocalWallClock,
  hasPeriodStartPassed,
  isPeriodEligibleAtLocationNow,
  isSelectedDateLocationToday,
  parseLocalWallClockTimestamp,
  resolveLocationLocalWallClock,
  type LocalWallClockTime,
} from '@/features/recommendation/domain/location-local-time';

describe('location-local-time', () => {
  const nowUtc = new Date('2026-10-07T18:10:00.000Z');

  it('resolves the same UTC instant into different location wall clocks', () => {
    expect(resolveLocationLocalWallClock(nowUtc, 'America/Sao_Paulo')).toEqual({
      date: '2026-10-07',
      hour: 15,
      minute: 10,
    });
    expect(resolveLocationLocalWallClock(nowUtc, 'Europe/Lisbon')).toEqual({
      date: '2026-10-07',
      hour: 19,
      minute: 10,
    });
  });

  it('returns null for empty or invalid timezones', () => {
    expect(resolveLocationLocalWallClock(nowUtc, '')).toBeNull();
    expect(resolveLocationLocalWallClock(nowUtc, '   ')).toBeNull();
    expect(resolveLocationLocalWallClock(nowUtc, 'Not/A_Zone')).toBeNull();
  });

  it('parses Open-Meteo local timestamps without timezone conversion', () => {
    expect(parseLocalWallClockTimestamp('2026-10-07T16:00')).toEqual({
      date: '2026-10-07',
      hour: 16,
      minute: 0,
    });
    expect(parseLocalWallClockTimestamp('2026-10-07T16:00:00')).toEqual({
      date: '2026-10-07',
      hour: 16,
      minute: 0,
    });
  });

  it('treats exact start minute as not yet passed', () => {
    const atStart: LocalWallClockTime = {
      date: '2026-10-07',
      hour: 16,
      minute: 0,
    };
    expect(hasPeriodStartPassed('2026-10-07T16:00', atStart)).toBe(false);
    expect(hasPeriodStartPassed('2026-10-07T15:00', atStart)).toBe(true);
  });

  it('excludes periods that already started when selected date is location today', () => {
    const localNow: LocalWallClockTime = {
      date: '2026-10-07',
      hour: 15,
      minute: 30,
    };

    expect(
      isPeriodEligibleAtLocationNow('2026-10-07T14:00', '2026-10-07', localNow),
    ).toBe(false);
    expect(
      isPeriodEligibleAtLocationNow('2026-10-07T15:00', '2026-10-07', localNow),
    ).toBe(false);
    expect(
      isPeriodEligibleAtLocationNow('2026-10-07T16:00', '2026-10-07', localNow),
    ).toBe(true);
  });

  it('does not apply the clock filter on future selected dates', () => {
    const localNow: LocalWallClockTime = {
      date: '2026-10-07',
      hour: 23,
      minute: 10,
    };

    expect(
      isPeriodEligibleAtLocationNow('2026-10-08T08:00', '2026-10-08', localNow),
    ).toBe(true);
    expect(isSelectedDateLocationToday('2026-10-08', localNow)).toBe(false);
  });

  it('skips the clock filter when locationLocalNow is null', () => {
    expect(
      isPeriodEligibleAtLocationNow('2026-10-07T08:00', '2026-10-07', null),
    ).toBe(true);
  });

  it('compares wall clocks deterministically', () => {
    const earlier: LocalWallClockTime = {
      date: '2026-10-07',
      hour: 15,
      minute: 0,
    };
    const later: LocalWallClockTime = {
      date: '2026-10-07',
      hour: 15,
      minute: 30,
    };
    expect(compareLocalWallClock(earlier, later)).toBeLessThan(0);
    expect(compareLocalWallClock(later, earlier)).toBeGreaterThan(0);
    expect(compareLocalWallClock(earlier, earlier)).toBe(0);
  });
});
