import type { HourlyWeather } from '@/features/weather/domain/hourly-weather';
import type {
  ActivityRules,
  BlockingCondition,
  ScoreFactor,
  WeatherDataField,
  WeatherDataRequirement,
} from '@/features/recommendation/domain/types';

/** Maps score factors to the HourlyWeather fields they consume. */
const SCORE_FACTOR_FIELDS: Readonly<Record<ScoreFactor, WeatherDataField>> = {
  temperature: 'temperature',
  precipitation: 'precipitationProbability',
  wind: 'windSpeed',
  gust: 'windGust',
  uv: 'uvIndex',
};

function fieldsForBlockingCondition(
  condition: BlockingCondition,
): readonly WeatherDataField[] {
  switch (condition.type) {
    case 'significant_rain':
      // Both inputs are required — do not evaluate rain from probability alone.
      return ['precipitationProbability', 'precipitation'];
    case 'storm':
      return ['weatherCode'];
    case 'gust_above':
      return ['windGust'];
    case 'apparent_temperature_above':
      return ['apparentTemperature'];
    case 'temperature_above':
      return ['temperature'];
  }
}

function uniqueFields(fields: readonly WeatherDataField[]): readonly WeatherDataField[] {
  return [...new Set(fields)];
}

/**
 * Derives score / blocking / contextual weather-field needs from activity rules.
 * Source of truth is the declarative ActivityRules configuration (Part A).
 */
export function getWeatherDataRequirements(
  rules: ActivityRules,
): WeatherDataRequirement {
  const score: WeatherDataField[] = [];
  for (const factor of Object.keys(SCORE_FACTOR_FIELDS) as ScoreFactor[]) {
    if (rules.weights[factor] !== undefined) {
      score.push(SCORE_FACTOR_FIELDS[factor]);
    }
  }

  const blocking: WeatherDataField[] = [];
  for (const condition of rules.blockingConditions) {
    blocking.push(...fieldsForBlockingCondition(condition));
  }

  const contextual: WeatherDataField[] = rules.prefersDaylight ? ['isDaylight'] : [];

  return {
    score: uniqueFields(score),
    blocking: uniqueFields(blocking),
    contextual,
  };
}

/** Fields required to score and evaluate blocking — excludes contextual-only data. */
export function listRequiredWeatherFields(
  rules: ActivityRules,
): readonly WeatherDataField[] {
  const { score, blocking } = getWeatherDataRequirements(rules);
  return uniqueFields([...score, ...blocking]);
}

function isWeatherFieldPresent(
  weather: HourlyWeather,
  field: WeatherDataField,
): boolean {
  return weather[field] !== null;
}

/**
 * Whether an hourly observation has enough data to evaluate score factors
 * and blocking conditions for the activity.
 *
 * Missing contextual data (e.g. daylight) does not make the period insufficient.
 * @see docs/product/mvp/business-rules.md §22
 */
export function isWeatherDataSufficient(
  rules: ActivityRules,
  weather: HourlyWeather,
): boolean {
  for (const field of listRequiredWeatherFields(rules)) {
    if (!isWeatherFieldPresent(weather, field)) {
      return false;
    }
  }
  return true;
}

/** Required score/blocking fields that are null on the observation. */
export function listMissingRequiredWeatherFields(
  rules: ActivityRules,
  weather: HourlyWeather,
): readonly WeatherDataField[] {
  return listRequiredWeatherFields(rules).filter(
    (field) => !isWeatherFieldPresent(weather, field),
  );
}
