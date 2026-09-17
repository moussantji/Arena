/* ============================================================
   OCULIS — Thèmes pour React Native (mobile)
   Ophtalmologie · Gestion de clinique & Réception
   Import : import { saphir, emeraude, onyx } from './oculis.theme'
   Usage  : const t = saphir;  <View style={{ backgroundColor: t.surface }} />
   ============================================================ */

/** @typedef {keyof import('./types').OculisTheme} ThemeName */

const saphir = {
  name: 'saphir',
  label: 'Saphir & Ambre',
  dark: false,
  bg: '#F3F6FB',
  surface: '#FFFFFF',
  surface2: '#E9EFF8',
  border: '#D7E0EE',
  text1: '#0C1A30',
  text2: '#43536E',
  text3: '#8492AB',
  primary: '#1E56D6',
  primaryHover: '#1744AC',
  primarySoft: '#E2EAFC',
  accent: '#C08A2D',
  accentSoft: '#F6ECDA',
  success: '#1F8A58',
  successSoft: '#DFF3E8',
  warning: '#A86400',
  warningSoft: '#FAEDD7',
  danger: '#C13B3B',
  dangerSoft: '#FAE4E4',
  navBar: '#FFFFFF',
  gradient: ['#1E56D6', '#4F86FF'],
  radius: 14,
  radiusLg: 18,
  shadow: { shadowColor: '#0C1A30', shadowOpacity: 0.10, shadowRadius: 17, shadowOffset: { width: 0, height: 14 }, elevation: 5 },
};

const emeraude = {
  name: 'emeraude',
  label: 'Émeraude & Sable',
  dark: false,
  bg: '#F5F3EC',
  surface: '#FFFFFF',
  surface2: '#EFECE1',
  border: '#E0DBCB',
  text1: '#13251E',
  text2: '#48584F',
  text3: '#8A948C',
  primary: '#0F6B52',
  primaryHover: '#0B5540',
  primarySoft: '#DFF0E8',
  accent: '#B0702A',
  accentSoft: '#F5E9D6',
  success: '#2F7D4E',
  successSoft: '#E3F1E7',
  warning: '#A26605',
  warningSoft: '#F6EDD8',
  danger: '#B23F2C',
  dangerSoft: '#F7E5E0',
  navBar: '#F5F3EC',
  gradient: ['#0F6B52', '#37A37F'],
  radius: 14,
  radiusLg: 18,
  shadow: { shadowColor: '#13251E', shadowOpacity: 0.10, shadowRadius: 17, shadowOffset: { width: 0, height: 14 }, elevation: 5 },
};

const onyx = {
  name: 'onyx',
  label: 'Onyx & Iris',
  dark: true,
  bg: '#0B0D13',
  surface: '#141824',
  surface2: '#1C2130',
  border: '#272E42',
  text1: '#F1F3FA',
  text2: '#A7AEC6',
  text3: '#6E7592',
  primary: '#7B5CF6',
  primaryHover: '#9377FF',
  primarySoft: '#292349',
  accent: '#FF9E6D',
  accentSoft: '#3B2B21',
  success: '#34D399',
  successSoft: '#123227',
  warning: '#F5B62E',
  warningSoft: '#352B10',
  danger: '#F0716B',
  dangerSoft: '#3A1E1E',
  navBar: '#141824',
  gradient: ['#7B5CF6', '#B18CFF'],
  radius: 12,
  radiusLg: 20,
  shadow: { shadowColor: '#000000', shadowOpacity: 0.50, shadowRadius: 22, shadowOffset: { width: 0, height: 18 }, elevation: 8 },
};

const themes = { saphir, emeraude, onyx };

export { saphir, emeraude, onyx, themes };
export default themes;
