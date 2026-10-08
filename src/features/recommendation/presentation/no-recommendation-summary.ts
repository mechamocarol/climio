import { extractWallClockHour } from '@/features/recommendation/domain/activity-hours';
import type {
  AnalyzedPeriod,
  BlockingReason,
} from '@/features/recommendation/domain/types';

export type NoRecommendationReasonIcon = 'cloud-rain' | 'wind' | 'sun';

export type NoRecommendationReasonCard = Readonly<{
  id: string;
  icon: NoRecommendationReasonIcon;
  title: string;
  detail: string | null;
}>;

export type NoRecommendationSummary = Readonly<{
  eyebrow: string;
  title: string;
  body: string;
  reasons: readonly NoRecommendationReasonCard[];
}>;

const WEATHER_BLOCKING_REASONS = new Set<BlockingReason>([
  'significant_rain',
  'storm',
  'gust_above',
  'temperature_above',
  'apparent_temperature_above',
]);

/**
 * Builds presentation copy for the empty recommendation state from analyzed
 * periods. Does not invent a recommendation — only summarizes why none fitted.
 * @see docs/product/mvp/business-rules.md §21 / §27
 */
export function buildNoRecommendationSummary(
  periods: readonly AnalyzedPeriod[],
): NoRecommendationSummary {
  const weatherPeriods = periods.filter(
    (period) => !period.blockingReasons.includes('outside_activity_hours'),
  );

  const reasons = collectReasonCards(weatherPeriods);

  return {
    eyebrow: 'Melhor não arriscar',
    title: 'Nenhum horário adequado',
    body: buildBody(reasons),
    reasons,
  };
}

function collectReasonCards(
  periods: readonly AnalyzedPeriod[],
): readonly NoRecommendationReasonCard[] {
  if (periods.length === 0) {
    return [];
  }

  const reasonCounts = countWeatherBlocks(periods);
  const cards: NoRecommendationReasonCard[] = [];

  const rainCount =
    (reasonCounts.get('significant_rain') ?? 0) +
    (reasonCounts.get('storm') ?? 0);
  if (rainCount > 0) {
    cards.push(buildRainCard(periods));
  }

  if ((reasonCounts.get('gust_above') ?? 0) > 0) {
    cards.push(buildGustCard(periods));
  }

  const heatCount =
    (reasonCounts.get('temperature_above') ?? 0) +
    (reasonCounts.get('apparent_temperature_above') ?? 0);
  if (heatCount > 0 && cards.length < 2) {
    cards.push(buildHeatCard(periods));
  }

  if (cards.length > 0) {
    return cards.slice(0, 2);
  }

  return buildFactorFallbackCards(periods).slice(0, 2);
}

function countWeatherBlocks(
  periods: readonly AnalyzedPeriod[],
): Map<BlockingReason, number> {
  const counts = new Map<BlockingReason, number>();

  for (const period of periods) {
    for (const reason of period.blockingReasons) {
      if (!WEATHER_BLOCKING_REASONS.has(reason)) {
        continue;
      }
      counts.set(reason, (counts.get(reason) ?? 0) + 1);
    }
  }

  return counts;
}

function buildRainCard(
  periods: readonly AnalyzedPeriod[],
): NoRecommendationReasonCard {
  const rainy = periods.filter(
    (period) =>
      period.blockingReasons.includes('significant_rain') ||
      period.blockingReasons.includes('storm') ||
      (period.weather.precipitationProbability !== null &&
        period.weather.precipitationProbability >= 60),
  );

  const probabilities = rainy
    .map((period) => period.weather.precipitationProbability)
    .filter((value): value is number => value !== null);
  const peak =
    probabilities.length > 0 ? Math.round(Math.max(...probabilities)) : null;
  const range = formatHourRange(rainy);

  let detail: string | null = null;
  if (peak !== null && range !== null) {
    detail = `${peak}% entre ${range}`;
  } else if (peak !== null) {
    detail = `Até ${peak}%`;
  } else if (range !== null) {
    detail = `Entre ${range}`;
  }

  return {
    id: 'rain',
    icon: 'cloud-rain',
    title: 'Chuva forte',
    detail,
  };
}

function buildGustCard(
  periods: readonly AnalyzedPeriod[],
): NoRecommendationReasonCard {
  const gusts = periods
    .map((period) => period.weather.windGust)
    .filter((value): value is number => value !== null);
  const peak = gusts.length > 0 ? Math.round(Math.max(...gusts)) : null;

  return {
    id: 'gust',
    icon: 'wind',
    title: 'Rajadas',
    detail: peak !== null ? `Até ${peak} km/h` : null,
  };
}

function buildHeatCard(
  periods: readonly AnalyzedPeriod[],
): NoRecommendationReasonCard {
  const temps = periods
    .map(
      (period) =>
        period.weather.apparentTemperature ?? period.weather.temperature,
    )
    .filter((value): value is number => value !== null);
  const peak = temps.length > 0 ? Math.round(Math.max(...temps)) : null;

  return {
    id: 'heat',
    icon: 'sun',
    title: 'Calor excessivo',
    detail: peak !== null ? `Até ${peak}°C` : null,
  };
}

function buildFactorFallbackCards(
  periods: readonly AnalyzedPeriod[],
): readonly NoRecommendationReasonCard[] {
  const averages = averageFactorScores(periods);
  const ranked = Object.entries(averages)
    .filter((entry): entry is [string, number] => entry[1] !== undefined)
    .sort((a, b) => a[1] - b[1]);

  const cards: NoRecommendationReasonCard[] = [];

  for (const [factor] of ranked) {
    if (cards.length >= 2) {
      break;
    }
    if (factor === 'precipitation') {
      cards.push(buildRainCard(periods));
    } else if (factor === 'gust' || factor === 'wind') {
      cards.push({
        id: factor,
        icon: 'wind',
        title: factor === 'gust' ? 'Rajadas' : 'Vento forte',
        detail: peakWindDetail(periods, factor === 'gust'),
      });
    } else if (factor === 'temperature') {
      cards.push(buildHeatCard(periods));
    } else if (factor === 'uv') {
      cards.push({
        id: 'uv',
        icon: 'sun',
        title: 'UV alto',
        detail: peakUvDetail(periods),
      });
    }
  }

  return cards;
}

function averageFactorScores(
  periods: readonly AnalyzedPeriod[],
): Partial<Record<'temperature' | 'precipitation' | 'wind' | 'gust' | 'uv', number>> {
  const sums: Partial<
    Record<'temperature' | 'precipitation' | 'wind' | 'gust' | 'uv', number>
  > = {};
  const counts: Partial<
    Record<'temperature' | 'precipitation' | 'wind' | 'gust' | 'uv', number>
  > = {};

  for (const period of periods) {
    for (const [factor, score] of Object.entries(period.factors) as [
      'temperature' | 'precipitation' | 'wind' | 'gust' | 'uv',
      number,
    ][]) {
      sums[factor] = (sums[factor] ?? 0) + score;
      counts[factor] = (counts[factor] ?? 0) + 1;
    }
  }

  const averages: Partial<
    Record<'temperature' | 'precipitation' | 'wind' | 'gust' | 'uv', number>
  > = {};
  for (const factor of Object.keys(sums) as (
    | 'temperature'
    | 'precipitation'
    | 'wind'
    | 'gust'
    | 'uv'
  )[]) {
    const count = counts[factor];
    const sum = sums[factor];
    if (count !== undefined && sum !== undefined && count > 0) {
      averages[factor] = sum / count;
    }
  }
  return averages;
}

function peakWindDetail(
  periods: readonly AnalyzedPeriod[],
  useGust: boolean,
): string | null {
  const values = periods
    .map((period) =>
      useGust ? period.weather.windGust : period.weather.windSpeed,
    )
    .filter((value): value is number => value !== null);
  if (values.length === 0) {
    return null;
  }
  return `Até ${Math.round(Math.max(...values))} km/h`;
}

function peakUvDetail(periods: readonly AnalyzedPeriod[]): string | null {
  const values = periods
    .map((period) => period.weather.uvIndex)
    .filter((value): value is number => value !== null);
  if (values.length === 0) {
    return null;
  }
  return `Índice até ${Math.round(Math.max(...values))}`;
}

function formatHourRange(periods: readonly AnalyzedPeriod[]): string | null {
  if (periods.length === 0) {
    return null;
  }

  const hours = periods
    .map((period) => extractWallClockHour(period.weather.timestamp))
    .sort((a, b) => a - b);

  const first = hours[0];
  const last = hours[hours.length - 1];
  if (first === undefined || last === undefined) {
    return null;
  }

  if (first === last) {
    return `${first}h`;
  }

  // Inclusive end of the last hourly slot → show next clock hour (14–20 style).
  return `${first}h e ${last + 1}h`;
}

function buildBody(reasons: readonly NoRecommendationReasonCard[]): string {
  const ids = new Set(reasons.map((reason) => reason.id));
  const hasRain = ids.has('rain') || ids.has('precipitation');
  const hasGust = ids.has('gust');
  const hasWind = ids.has('wind');
  const hasHeat = ids.has('heat') || ids.has('temperature');

  if (hasRain && (hasGust || hasWind)) {
    return 'A chuva forte e as rajadas de vento deixam o dia pouco seguro para esta atividade.';
  }
  if (hasRain) {
    return 'A chuva forte deixa o dia pouco seguro para esta atividade.';
  }
  if (hasGust || hasWind) {
    return 'As rajadas de vento deixam o dia pouco seguro para esta atividade.';
  }
  if (hasHeat) {
    return 'O calor excessivo deixa o dia pouco adequado para esta atividade.';
  }
  if (reasons.length > 0) {
    return 'As condições do dia não fecharam bem para esta atividade.';
  }
  return 'Para essa atividade e data, as condições não fecharam bem. Tente outra data ou atividade.';
}
