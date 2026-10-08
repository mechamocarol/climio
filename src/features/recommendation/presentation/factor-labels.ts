import type { ScoreFactor } from '@/features/recommendation/domain/types';

const POSITIVE_FACTOR_LABELS: Readonly<Record<ScoreFactor, string>> = {
  temperature: 'Temperatura confortável',
  precipitation: 'Baixa chance de chuva',
  wind: 'Vento leve',
  gust: 'Rajadas amenas',
  uv: 'UV confortável',
};

const NEUTRAL_FACTOR_LABELS: Readonly<Record<ScoreFactor, string>> = {
  temperature: 'Temperatura aceitável',
  precipitation: 'Chuva moderada',
  wind: 'Vento moderado',
  gust: 'Rajadas moderadas',
  uv: 'UV moderado',
};

const NEGATIVE_FACTOR_LABELS: Readonly<Record<ScoreFactor, string>> = {
  temperature: 'Temperatura desfavorável',
  precipitation: 'Risco de chuva',
  wind: 'Vento forte',
  gust: 'Rajadas fortes',
  uv: 'UV alto',
};

export function formatPositiveFactorLabel(factor: ScoreFactor): string {
  return POSITIVE_FACTOR_LABELS[factor];
}

export function formatNeutralFactorLabel(factor: ScoreFactor): string {
  return NEUTRAL_FACTOR_LABELS[factor];
}

export function formatNegativeFactorLabel(factor: ScoreFactor): string {
  return NEGATIVE_FACTOR_LABELS[factor];
}
