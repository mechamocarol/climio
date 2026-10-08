import type {
  ActivityRules,
  FactorScore,
  ScoreBand,
  ScoreBands,
} from '@/features/recommendation/domain/types';

function matchesMin(value: number, band: ScoreBand): boolean {
  if (band.min === null) {
    return true;
  }
  return band.minInclusive ? value >= band.min : value > band.min;
}

function matchesMax(value: number, band: ScoreBand): boolean {
  if (band.max === null) {
    return true;
  }
  return band.maxInclusive ? value <= band.max : value < band.max;
}

/**
 * Evaluates a numeric value against declarative score bands.
 * Returns null when the value is missing or no band matches.
 * Does not round — continuous values are compared as provided.
 */
export function scoreNumericValue(
  value: number | null,
  bands: ScoreBands,
): FactorScore | null {
  if (value === null || Number.isNaN(value)) {
    return null;
  }

  for (const band of bands) {
    if (matchesMin(value, band) && matchesMax(value, band)) {
      return band.score;
    }
  }

  return null;
}

export function scoreTemperature(
  rules: ActivityRules,
  temperatureCelsius: number | null,
): FactorScore | null {
  return scoreNumericValue(temperatureCelsius, rules.temperatureBands);
}

/** Precipitation score from probability (%) bands — not amount (mm/h). */
export function scorePrecipitation(
  rules: ActivityRules,
  precipitationProbabilityPercent: number | null,
): FactorScore | null {
  return scoreNumericValue(precipitationProbabilityPercent, rules.precipitationBands);
}

export function scoreWind(
  rules: ActivityRules,
  windSpeedKmH: number | null,
): FactorScore | null {
  return scoreNumericValue(windSpeedKmH, rules.windBands);
}

/** Gust score; null when the activity has no gust bands or the value is missing. */
export function scoreGust(
  rules: ActivityRules,
  windGustKmH: number | null,
): FactorScore | null {
  if (rules.gustBands === null) {
    return null;
  }
  return scoreNumericValue(windGustKmH, rules.gustBands);
}

/** UV score; null when the activity has no UV bands or the value is missing. */
export function scoreUv(
  rules: ActivityRules,
  uvIndex: number | null,
): FactorScore | null {
  if (rules.uvBands === null) {
    return null;
  }
  return scoreNumericValue(uvIndex, rules.uvBands);
}
