import type {
  RecommendationExplanation,
  RecommendationWindow,
  ScoreFactor,
} from '@/features/recommendation/domain/types';

/**
 * Extracts local clock time (`HH:mm`) from an Open-Meteo local timestamp.
 * Does not convert timezones — timestamps stay as returned by the API.
 */
export function formatLocalClockTime(timestamp: string): string {
  const match = timestamp.match(/T(\d{2}:\d{2})/);
  return match?.[1] ?? timestamp;
}

export function formatWindowRangeLabel(window: RecommendationWindow): string {
  return `${formatLocalClockTime(window.startTimestamp)} – ${formatLocalClockTime(window.endTimestamp)}`;
}

export function formatWindowDurationLabel(window: RecommendationWindow): string {
  const hours = window.durationHours;
  if (hours === 1) {
    return '1 hora';
  }
  return `${hours} horas`;
}

export function formatWindowScorePercent(window: RecommendationWindow): string {
  return `${Math.round(window.averagePercentage)}%`;
}

export type WindowQualityLabel = 'Excelente' | 'Bom' | 'Menos favorável';

export function getWindowQualityLabel(
  averagePercentage: number,
): WindowQualityLabel {
  if (averagePercentage >= 75) {
    return 'Excelente';
  }
  if (averagePercentage >= 55) {
    return 'Bom';
  }
  return 'Menos favorável';
}

export type WindowWeatherSummary = Readonly<{
  temperatureC: number | null;
  precipitationPercent: number | null;
  windKmh: number | null;
  temperatureLabel: string | null;
  precipitationLabel: string | null;
  windLabel: string | null;
}>;

/**
 * Averages available weather fields inside a recommendation window.
 * Returns null labels when no values exist — never invents data.
 */
export function summarizeWindowWeather(
  window: RecommendationWindow,
): WindowWeatherSummary {
  const periods = window?.periods ?? [];
  const temperatures = periods
    .map((period) => period.weather?.temperature ?? null)
    .filter((value): value is number => value !== null);
  const precipitations = periods
    .map((period) => period.weather?.precipitationProbability ?? null)
    .filter((value): value is number => value !== null);
  const winds = periods
    .map((period) => period.weather?.windSpeed ?? null)
    .filter((value): value is number => value !== null);

  const temperatureC =
    temperatures.length > 0 ? Math.round(average(temperatures)) : null;
  const precipitationPercent =
    precipitations.length > 0 ? Math.round(average(precipitations)) : null;
  const windKmh = winds.length > 0 ? Math.round(average(winds)) : null;

  return {
    temperatureC,
    precipitationPercent,
    windKmh,
    temperatureLabel: temperatureC !== null ? `${temperatureC}°` : null,
    precipitationLabel:
      precipitationPercent !== null ? `${precipitationPercent}%` : null,
    windLabel: windKmh !== null ? `${windKmh} km/h` : null,
  };
}

export type DayPeriodLabel =
  | 'Manhã'
  | 'Meio-dia'
  | 'Tarde'
  | 'Fim de tarde'
  | 'Noite';

/** Day-period label from a local Open-Meteo timestamp. */
export function getDayPeriodLabel(timestamp: string): DayPeriodLabel {
  const hour = parseLocalHour(timestamp);
  if (hour === null) {
    return 'Tarde';
  }
  if (hour < 11) {
    return 'Manhã';
  }
  if (hour < 14) {
    return 'Meio-dia';
  }
  if (hour < 17) {
    return 'Tarde';
  }
  if (hour < 19) {
    return 'Fim de tarde';
  }
  return 'Noite';
}

/** Icon hint for alternative window cards. */
export function getWindowPeriodIcon(
  window: RecommendationWindow,
): 'sun' | 'moon' | 'cloud' {
  const hour = parseLocalHour(window.startTimestamp);
  if (hour !== null && (hour >= 19 || hour < 6)) {
    return 'moon';
  }
  const weather = summarizeWindowWeather(window);
  if (
    weather.precipitationPercent !== null &&
    weather.precipitationPercent > 30
  ) {
    return 'cloud';
  }
  return 'sun';
}

/** Short headline under the recommended clock time. */
export function buildWindowHeadline(window: RecommendationWindow): string {
  const weather = summarizeWindowWeather(window);
  const parts: string[] = [];

  if (weather.temperatureC !== null) {
    if (weather.temperatureC <= 21) {
      parts.push('fresco');
    } else if (weather.temperatureC <= 26) {
      parts.push('ameno');
    } else {
      parts.push('quente');
    }
  }

  if (weather.precipitationPercent !== null) {
    parts.push(weather.precipitationPercent <= 20 ? 'seco' : 'com alguma chuva');
  }

  if (weather.windKmh !== null) {
    parts.push(weather.windKmh <= 15 ? 'com vento leve' : 'com vento');
  }

  if (parts.length === 0) {
    return 'Boas condições para a sua atividade.';
  }

  const joined =
    parts.length === 1
      ? parts[0]!
      : `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]!}`;

  // "Tempo" keeps masculine agreement with fresco/ameno/quente/seco.
  return `Tempo ${joined}.`;
}

/**
 * Narrative "Por que esse horário?" from C7 explanation + real window weather.
 * Never invents values — clauses omit metrics when the forecast field is null.
 */
export function buildWhyThisWindowBody(
  window: RecommendationWindow,
  explanation: RecommendationExplanation,
  activityName: string | null = null,
): string {
  const weather = summarizeWindowWeather(window);
  const positiveFactors = explanation?.positiveFactors ?? [];
  const negativeFactors = explanation?.negativeFactors ?? [];

  const positiveClauses = positiveFactors
    .map((factor) => buildPositiveFactorClause(factor, window, weather))
    .filter((clause): clause is string => clause !== null);

  const negativeClauses = negativeFactors
    .map((factor) => buildNegativeFactorClause(factor, weather))
    .filter((clause): clause is string => clause !== null);

  if (positiveClauses.length === 0 && negativeClauses.length === 0) {
    return buildFallbackWhyBody(weather, activityName);
  }

  const activitySuffix = formatActivitySuffix(activityName);

  let body =
    positiveClauses.length > 0
      ? joinPortugueseClauses(positiveClauses)
      : `condições aceitáveis no horário`;

  if (activitySuffix.length > 0) {
    body = `${body}${activitySuffix}`;
  }

  body = capitalizeSentence(body);

  if (negativeClauses.length > 0) {
    const attention = joinPortugueseClauses(negativeClauses);
    body = `${body}. Atenção: ${attention}.`;
  } else if (!body.endsWith('.')) {
    body = `${body}.`;
  }

  return body;
}

function buildPositiveFactorClause(
  factor: ScoreFactor,
  window: RecommendationWindow,
  weather: WindowWeatherSummary,
): string | null {
  switch (factor) {
    case 'temperature': {
      const trend = getTemperatureTrend(window);
      if (trend === 'falling' && weather.temperatureC !== null) {
        return `a temperatura cai ao longo do período (cerca de ${weather.temperatureC}°)`;
      }
      if (
        getDayPeriodLabel(window.startTimestamp) === 'Fim de tarde' &&
        weather.temperatureC !== null &&
        weather.temperatureC <= 24
      ) {
        return `a temperatura fica mais amena depois do pico da tarde (cerca de ${weather.temperatureC}°)`;
      }
      if (weather.temperatureC !== null) {
        return `temperatura confortável perto de ${weather.temperatureC}°`;
      }
      return 'temperatura confortável';
    }
    case 'precipitation': {
      if (weather.precipitationPercent === null) {
        return 'baixa chance de chuva';
      }
      if (weather.precipitationPercent <= 10) {
        return 'sem previsão relevante de chuva';
      }
      return `baixa chance de chuva (cerca de ${weather.precipitationPercent}%)`;
    }
    case 'wind': {
      if (weather.windKmh !== null) {
        return weather.windKmh <= 15
          ? `vento leve perto de ${weather.windKmh} km/h`
          : `vento confortável perto de ${weather.windKmh} km/h`;
      }
      return 'vento confortável';
    }
    case 'gust':
      return 'rajadas amenas';
    case 'uv':
      return 'UV confortável';
    default:
      return null;
  }
}

function formatActivitySuffix(activityName: string | null): string {
  if (!activityName || activityName.trim().length === 0) {
    return '';
  }
  return ` para ${activityName.trim().toLowerCase()}`;
}

function buildNegativeFactorClause(
  factor: ScoreFactor,
  weather: WindowWeatherSummary,
): string | null {
  switch (factor) {
    case 'temperature':
      return weather.temperatureC !== null
        ? `temperatura menos ideal perto de ${weather.temperatureC}°`
        : 'temperatura menos ideal';
    case 'precipitation':
      return weather.precipitationPercent !== null
        ? `risco de chuva em torno de ${weather.precipitationPercent}%`
        : 'risco de chuva';
    case 'wind':
      return weather.windKmh !== null
        ? `vento mais forte perto de ${weather.windKmh} km/h`
        : 'vento mais forte';
    case 'gust':
      return 'rajadas mais intensas';
    case 'uv':
      return 'UV mais alto';
    default:
      return null;
  }
}

function buildFallbackWhyBody(
  weather: WindowWeatherSummary,
  activityName: string | null,
): string {
  const bits: string[] = [];
  if (weather.temperatureC !== null) {
    bits.push(`sensação perto de ${weather.temperatureC}°`);
  }
  if (weather.precipitationPercent !== null) {
    bits.push(
      weather.precipitationPercent <= 10
        ? 'pouca chuva no radar'
        : `chance de chuva em torno de ${weather.precipitationPercent}%`,
    );
  }
  if (weather.windKmh !== null) {
    bits.push(`vento perto de ${weather.windKmh} km/h`);
  }

  const activitySuffix =
    formatActivitySuffix(activityName) || ' para a sua atividade';

  if (bits.length === 0) {
    return `Analisamos temperatura, chuva e vento${activitySuffix}.`;
  }

  return `${capitalizeSentence(joinPortugueseClauses(bits))}${activitySuffix}.`;
}

function getTemperatureTrend(
  window: RecommendationWindow,
): 'falling' | 'rising' | 'stable' | null {
  const temperatures = (window?.periods ?? [])
    .map((period) => period.weather?.temperature ?? null)
    .filter((value): value is number => value !== null);

  if (temperatures.length < 2) {
    return null;
  }

  const first = temperatures[0]!;
  const last = temperatures[temperatures.length - 1]!;
  const delta = last - first;

  if (delta <= -1) {
    return 'falling';
  }
  if (delta >= 1) {
    return 'rising';
  }
  return 'stable';
}

function joinPortugueseClauses(items: readonly string[]): string {
  if (items.length === 0) {
    return '';
  }
  if (items.length === 1) {
    return items[0]!;
  }
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]!}`;
}

function capitalizeSentence(value: string): string {
  if (value.length === 0) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function parseLocalHour(timestamp: string): number | null {
  const match = timestamp.match(/T(\d{2}):/);
  if (!match) {
    return null;
  }
  const hour = Number(match[1]);
  return Number.isFinite(hour) ? hour : null;
}

function average(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
