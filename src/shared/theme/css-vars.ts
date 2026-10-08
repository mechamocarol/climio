import { vars } from 'nativewind';

import { colorsByTheme, type ThemeName } from '@/shared/theme/tokens';

/**
 * Converts #RRGGBB to the "R G B" channel form used by global.css / NativeWind.
 */
export function hexToRgbChannels(hex: string): string {
  const normalized = hex.replace('#', '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : normalized;

  const red = Number.parseInt(full.slice(0, 2), 16);
  const green = Number.parseInt(full.slice(2, 4), 16);
  const blue = Number.parseInt(full.slice(4, 6), 16);

  return `${red} ${green} ${blue}`;
}

/**
 * Runtime CSS variable overrides for Climio tokens.
 * Applied via NativeWind `vars()` so className tokens (bg-canvas, text-ink, …)
 * actually switch when the manual theme toggles — `.dark` alone is unreliable on native.
 */
export function getThemeCssVars(theme: ThemeName) {
  const colors = colorsByTheme[theme];

  return vars({
    '--color-blue': hexToRgbChannels(colors.blue),
    '--color-blue-deep': hexToRgbChannels(colors.blueDeep),
    '--color-blue-soft': hexToRgbChannels(colors.blueSoft),
    '--color-green': hexToRgbChannels(colors.green),
    '--color-green-bright': hexToRgbChannels(colors.greenBright),
    '--color-gray': hexToRgbChannels(colors.gray),
    '--color-ink': hexToRgbChannels(colors.ink),
    '--color-ink-soft': hexToRgbChannels(colors.inkSoft),
    '--color-canvas': hexToRgbChannels(colors.canvas),
    '--color-surface': hexToRgbChannels(colors.surface),
    '--color-surface-soft': hexToRgbChannels(colors.surfaceSoft),
    '--color-surface-blue': hexToRgbChannels(colors.surfaceBlue),
    '--color-line': hexToRgbChannels(colors.line),
    '--color-danger': hexToRgbChannels(colors.danger),
    '--color-danger-soft': hexToRgbChannels(colors.dangerSoft),
    '--color-warning': hexToRgbChannels(colors.warning),
    '--color-warning-soft': hexToRgbChannels(colors.warningSoft),
  });
}
