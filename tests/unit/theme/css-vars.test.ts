import {
  getThemeCssVars,
  hexToRgbChannels,
} from '@/shared/theme/css-vars';

jest.mock('nativewind', () => ({
  vars: (value: Record<string, string>) => value,
}));

describe('hexToRgbChannels', () => {
  it('converts Climio canvas tokens to CSS channel form', () => {
    expect(hexToRgbChannels('#F5F8F4')).toBe('245 248 244');
    expect(hexToRgbChannels('#10201D')).toBe('16 32 29');
  });
});

describe('getThemeCssVars', () => {
  it('maps light and dark tokens onto NativeWind CSS variables', () => {
    const light = getThemeCssVars('light') as Record<string, string>;
    const dark = getThemeCssVars('dark') as Record<string, string>;

    expect(light['--color-canvas']).toBe('245 248 244');
    expect(light['--color-ink']).toBe('24 48 44');
    expect(light['--color-green']).toBe('100 135 103');
    expect(light['--color-blue']).toBe('126 178 221');

    expect(dark['--color-canvas']).toBe('16 32 29');
    expect(dark['--color-ink']).toBe('237 246 239');
    expect(dark['--color-green']).toBe('141 182 145');
    expect(dark['--color-blue']).toBe('143 197 237');
    expect(dark['--color-surface']).toBe('23 42 38');
  });
});
