/**
 * Thème « Indigo Minuit » de Kalanso — même esprit que la version PC :
 * fond marine profond, accents indigo, typographie soignée.
 */
export const theme = {
  bg: '#0b1030',
  surface: '#121737',
  surfaceAlt: '#181e42',
  surfaceSoft: 'rgba(167, 182, 255, 0.05)',
  line: 'rgba(167, 182, 255, 0.14)',
  lineStrong: 'rgba(167, 182, 255, 0.28)',
  ink: '#eef0ff',
  faint: '#9098cc',
  accent: '#6d8bff',
  accentStrong: '#5b7cfa',
  accentSoft: 'rgba(109, 139, 255, 0.16)',
  copper: '#d9b06f',
  danger: '#f08a8a',
  ok: '#6fe3b0',
  radius: 14,
  radiusSm: 10,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 32,
} as const;
