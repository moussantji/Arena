/* ============================================================
   OCULIS — Thème Saphir & Ambre pour React Native (mobile)
   Ophtalmologie · Gestion de clinique & Réception
   Import : import saphir from './oculis.theme'   (ou { saphir })
   Usage  : const t = saphir;  <View style={{ backgroundColor: t.bg }} />
   ============================================================ */

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

export { saphir };
export default saphir;
