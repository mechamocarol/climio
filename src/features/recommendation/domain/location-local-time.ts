/**
 * Wall-clock time in a specific IANA timezone (location-local).
 * Not a UTC instant — comparable to Open-Meteo local timestamps.
 */
export type LocalWallClockTime = Readonly<{
  /** Calendar day `YYYY-MM-DD` in the location timezone. */
  date: string;
  /** Hour of day 0–23. */
  hour: number;
  /** Minute 0–59. */
  minute: number;
}>;

/**
 * Resolves `now` into a location-local wall clock using the IANA timezone.
 * Pure with respect to `now` — callers inject the instant (no `new Date()` here).
 * Returns null when `timeZone` is empty or Intl cannot resolve it.
 */
export function resolveLocationLocalWallClock(
  now: Date,
  timeZone: string,
): LocalWallClockTime | null {
  const trimmed = timeZone.trim();
  if (trimmed.length === 0) {
    return null;
  }

  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: trimmed,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);

    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;
    const hourText = parts.find((part) => part.type === 'hour')?.value;
    const minuteText = parts.find((part) => part.type === 'minute')?.value;

    if (
      year === undefined ||
      month === undefined ||
      day === undefined ||
      hourText === undefined ||
      minuteText === undefined
    ) {
      return null;
    }

    const hour = Number(hourText);
    const minute = Number(minuteText);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
      return null;
    }

    return {
      date: `${year}-${month}-${day}`,
      hour,
      minute,
    };
  } catch {
    return null;
  }
}

/**
 * Parses an Open-Meteo-style local timestamp into a wall clock.
 * Does not convert timezones — reads the written date/time components.
 */
export function parseLocalWallClockTimestamp(
  timestamp: string,
): LocalWallClockTime | null {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/.exec(timestamp);
  if (match === null) {
    return null;
  }

  const hour = Number(match[2]);
  const minute = Number(match[3]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }

  return {
    date: match[1]!,
    hour,
    minute,
  };
}

export function compareLocalWallClock(
  a: LocalWallClockTime,
  b: LocalWallClockTime,
): number {
  if (a.date !== b.date) {
    return a.date < b.date ? -1 : 1;
  }
  if (a.hour !== b.hour) {
    return a.hour - b.hour;
  }
  return a.minute - b.minute;
}

/**
 * True when the selected plan date is "today" in the location timezone.
 */
export function isSelectedDateLocationToday(
  selectedDate: string,
  locationLocalNow: LocalWallClockTime,
): boolean {
  return selectedDate === locationLocalNow.date;
}

/**
 * True when the period/window start is strictly before `locationLocalNow`.
 * At exactly the start minute the period has not "passed" yet (still eligible).
 */
export function hasPeriodStartPassed(
  periodTimestamp: string,
  locationLocalNow: LocalWallClockTime,
): boolean {
  const start = parseLocalWallClockTimestamp(periodTimestamp);
  if (start === null) {
    return false;
  }
  return compareLocalWallClock(locationLocalNow, start) > 0;
}

/**
 * Whether a period may enter C4 window formation for recommendations.
 *
 * - Future selected dates: always eligible (no clock filter).
 * - Today in the location timezone: eligible only if start has not passed.
 * - Missing `locationLocalNow`: no clock filter (timezone unavailable).
 */
export function isPeriodEligibleAtLocationNow(
  periodTimestamp: string,
  selectedDate: string,
  locationLocalNow: LocalWallClockTime | null,
): boolean {
  if (locationLocalNow === null) {
    return true;
  }
  if (!isSelectedDateLocationToday(selectedDate, locationLocalNow)) {
    return true;
  }
  return !hasPeriodStartPassed(periodTimestamp, locationLocalNow);
}
