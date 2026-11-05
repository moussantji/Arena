/**
 * Thème « Indigo Minuit réhaussée » de Kalanso Mobile.
 * Même ADN que la version PC (fond marine profond, accents indigo, touche
 * champagne), poussé vers le luxe : verre dépoli, aurores, dégradés signature.
 */
export const theme = {
  // Fonds
  bg: '#070B1F',
  bg2: '#0B1030',
  // Surfaces vitreuses (posées sur bg / bg2)
  surface: 'rgba(27, 42, 107, 0.30)',
  surfaceAlt: 'rgba(27, 42, 107, 0.52)',
  surfaceSoft: 'rgba(167, 182, 255, 0.06)',
  glass: 'rgba(167, 182, 255, 0.10)',
  glassStrong: 'rgba(167, 182, 255, 0.16)',
  // Filets
  line: 'rgba(167, 182, 255, 0.14)',
  lineStrong: 'rgba(167, 182, 255, 0.28)',
  // Encres
  ink: '#F0F2FF',
  inkSoft: '#D6DCFF',
  faint: '#A7B6FF',
  ghost: '#6B78A8',
  // Accents
  accent: '#5B7CFA',
  accentStrong: '#5B7CFA',
  accentSoft: 'rgba(91, 124, 250, 0.16)',
  copper: '#E0A86F',
  copperSoft: 'rgba(224, 168, 111, 0.14)',
  danger: '#F08A8A',
  dangerSoft: 'rgba(240, 138, 138, 0.14)',
  ok: '#6FE3B0',
  okSoft: 'rgba(111, 227, 176, 0.14)',
  // Géométrie
  radius: 18,
  radiusSm: 12,
  radiusLg: 24,
} as const;

/** Dégradés signature (tuples readonly pour expo-linear-gradient). */
export const gradients = {
  /** Bouton principal : indigo → champagne. */
  brand: ['#5B7CFA', '#8FA5FF', '#E0A86F'] as const,
  /** Touche champagne (actions fortes, chiffres clés). */
  gold: ['#E8B87E', '#E0A86F', '#C9924F'] as const,
  /** Carte héros finances. */
  hero: ['#2A3A8F', '#5B7CFA', '#E0A86F'] as const,
  /** Fond d'écran : deux marine profonds. */
  night: ['#0B1030', '#070B1F'] as const,
  /** Barres de progression matière. */
  progress: ['#5B7CFA', '#8FA5FF', '#E0A86F'] as const,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 32,
} as const;
