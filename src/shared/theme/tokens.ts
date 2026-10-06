/**
 * Climio design tokens.
 * Source: Figma Make visual reference (docs/design — local only).
 * Light and dark values are defined so a manual theme toggle can be wired later.
 * Do not change theme at runtime from this file.
 */

export const lightColors = {
  blue: '#7EB2DD',
  blueDeep: '#4E86B5',
  blueSoft: '#CEE7E6',
  green: '#648767',
  greenBright: '#7DC95E',
  gray: '#BFC0C0',
  ink: '#18302C',
  inkSoft: '#5F716D',
  canvas: '#F5F8F4',
  surface: '#FFFFFF',
  surfaceSoft: '#EDF3EE',
  surfaceBlue: '#E9F4F6',
  line: '#DFE8E1',
  danger: '#C75C54',
  dangerSoft: '#F8E7E3',
  warning: '#C58B38',
  warningSoft: '#F7EDDA',
} as const;

export const darkColors = {
  blue: '#8FC5ED',
  blueDeep: '#4E86B5',
  blueSoft: '#26505A',
  green: '#8DB691',
  greenBright: '#7DC95E',
  gray: '#84938F',
  ink: '#EDF6EF',
  inkSoft: '#A8BBB4',
  canvas: '#10201D',
  surface: '#172A26',
  surfaceSoft: '#1D332E',
  surfaceBlue: '#19343A',
  line: '#29443D',
  danger: '#C75C54',
  dangerSoft: '#402925',
  warning: '#C58B38',
  warningSoft: '#423720',
} as const;

export const radii = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
} as const;

export const fonts = {
  sans: 'Manrope',
} as const;

export type ColorToken = keyof typeof lightColors;
export type ThemeName = 'light' | 'dark';

export const colorsByTheme = {
  light: lightColors,
  dark: darkColors,
} as const;
