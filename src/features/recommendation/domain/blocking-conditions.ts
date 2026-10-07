import {
  SIGNIFICANT_RAIN,
  STORM_WEATHER_CODES,
} from '@/features/recommendation/domain/recommendation-config';
import type {
  ActivityRules,
  BlockingCondition,
  BlockingConditionType,
} from '@/features/recommendation/domain/types';
import type { HourlyWeather } from '@/features/weather/domain/hourly-weather';

export type BlockingEvaluation = Readonly<{
  blocked: boolean;
  reasons: readonly BlockingConditionType[];
}>;

function isStormWeatherCode(weatherCode: number): boolean {
  return (STORM_WEATHER_CODES as readonly number[]).includes(weatherCode);
}

/**
 * Significant rain when probability >= 60% OR amount >= 2 mm/h.
 * Returns null only when both inputs are missing (cannot evaluate).
 * A present value that does not meet its threshold does not invent a block;
 * if at least one field is present and neither clause is true → false.
 */
function evaluateSignificantRain(weather: HourlyWeather): boolean | null {
  const probability = weather.precipitationProbability;
  const amount = weather.precipitation;

  if (probability === null && amount === null) {
    return null;
  }

  if (
    probability !== null &&
    probability >= SIGNIFICANT_RAIN.precipitationProbabilityMin
  ) {
    return true;
  }

  if (amount !== null && amount >= SIGNIFICANT_RAIN.precipitationMmPerHourMin) {
    return true;
  }

  return false;
}

/**
 * Evaluates a single blocking condition against hourly weather.
 * Returns null when required data is missing — never invents values.
 */
export function evaluateBlockingCondition(
  condition: BlockingCondition,
  weather: HourlyWeather,
): boolean | null {
  switch (condition.type) {
    case 'significant_rain':
      return evaluateSignificantRain(weather);

    case 'storm': {
      if (weather.weatherCode === null) {
        return null;
      }
      return isStormWeatherCode(weather.weatherCode);
    }

    case 'gust_above': {
      if (weather.windGust === null) {
        return null;
      }
      return weather.windGust > condition.thresholdKmH;
    }

    case 'apparent_temperature_above': {
      if (weather.apparentTemperature === null) {
        return null;
      }
      return weather.apparentTemperature > condition.thresholdCelsius;
    }

    case 'temperature_above': {
      if (weather.temperature === null) {
        return null;
      }
      return weather.temperature > condition.thresholdCelsius;
    }
  }
}

/**
 * Evaluates all blocking conditions declared on the activity.
 * blocked is true iff at least one condition evaluates to true.
 * reasons lists only conditions that blocked, in declaration order, without duplicates.
 */
export function evaluateBlockingConditions(
  rules: ActivityRules,
  weather: HourlyWeather,
): BlockingEvaluation {
  const reasons: BlockingConditionType[] = [];
  const seen = new Set<BlockingConditionType>();

  for (const condition of rules.blockingConditions) {
    if (evaluateBlockingCondition(condition, weather) !== true) {
      continue;
    }
    if (seen.has(condition.type)) {
      continue;
    }
    seen.add(condition.type);
    reasons.push(condition.type);
  }

  return {
    blocked: reasons.length > 0,
    reasons,
  };
}
