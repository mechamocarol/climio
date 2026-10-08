import {
  formatNegativeFactorLabel,
  formatPositiveFactorLabel,
} from '@/features/recommendation/presentation/factor-labels';

describe('factor labels', () => {
  it('maps score factors to presentation copy', () => {
    expect(formatPositiveFactorLabel('temperature')).toBe(
      'Temperatura confortável',
    );
    expect(formatPositiveFactorLabel('precipitation')).toBe(
      'Baixa chance de chuva',
    );
    expect(formatNegativeFactorLabel('wind')).toBe('Vento forte');
  });
});
