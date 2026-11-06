/**
 * Composants partagés premium « Indigo Minuit réhaussée ».
 * Coquille aurore, cartes de verre, dégradés signature, or champagne en touche.
 */
import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { gradients, theme } from './theme';
import { initials } from './format';

/* ------------------------------------------------------------------ */
/* Fond aurore : halos indigo & champagne sur marine profond           */
/* ------------------------------------------------------------------ */

function Glow({ size, color, style }: { size: number; color: string; style: StyleProp<ViewStyle> }) {
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2 }, style]}>
      <View style={[styles.glowRing, { backgroundColor: color, borderRadius: size / 2 }]} />
      <View style={[styles.glowRing, { backgroundColor: color, borderRadius: size / 2, inset: size * 0.18 }]} />
      <View style={[styles.glowRing, { backgroundColor: color, borderRadius: size / 2, inset: size * 0.32 }]} />
    </View>
  );
}

export function Aurora({ dense = false }: { dense?: boolean }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={gradients.night} style={StyleSheet.absoluteFill} />
      <Glow size={380} color="rgba(91, 124, 250, 0.16)" style={{ top: -140, left: -110 }} />
      <Glow size={340} color="rgba(224, 168, 111, 0.12)" style={{ top: -120, right: -120 }} />
      {dense ? (
        <Glow size={300} color="rgba(91, 124, 250, 0.10)" style={{ bottom: -140, right: -90 }} />
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Coquille d'écran                                                    */
/* ------------------------------------------------------------------ */

export function Screen({ children, scroll = false, style }: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <SafeAreaView style={styles.screen}>
      <Aurora dense={scroll} />
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, style]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.screenContent, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

/** Grand titre d'écran premium : titre affirmé, sous-titre atone, slot droite. */
export function ScreenHeader({ title, sub, right }: {
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.screenHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.screenTitle} numberOfLines={1}>{title}</Text>
        {sub ? <Text style={styles.screenSub} numberOfLines={1}>{sub}</Text> : null}
      </View>
      {right ? <View style={styles.screenHeaderRight}>{right}</View> : null}
    </View>
  );
}

/** Carte d'en-tête « aurore » pour les accueils (personnel et parents). */
export function HomeHero({ overline, title, icon = 'school-outline' }: {
  overline: string;
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <LinearGradient
      colors={['#182050', '#0D1334']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.homeHero}
    >
      <View style={styles.homeHeroGlowIndigo} pointerEvents="none" />
      <View style={styles.homeHeroGlowCopper} pointerEvents="none" />
      <View style={styles.homeHeroRow}>
        <View style={styles.homeHeroText}>
          <Text style={styles.homeHeroOverline} numberOfLines={1}>{overline.toUpperCase()}</Text>
          <Text style={styles.homeHeroTitle} numberOfLines={2}>{title}</Text>
        </View>
        <View style={styles.homeHeroMark}>
          <Ionicons name={icon} size={28} color={theme.copper} />
        </View>
      </View>
    </LinearGradient>
  );
}

/* ------------------------------------------------------------------ */
/* Cartes                                                              */
/* ------------------------------------------------------------------ */

export function Card({ children, style, onPress }: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && styles.cardPressed]}>
        {children}
      </Pressable>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
}

/** Carte héros en dégradé signature (montants clés, encaissement…). */
export function HeroCard({ children, style }: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <LinearGradient
      colors={gradients.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.heroCard, style]}
    >
      {children}
    </LinearGradient>
  );
}

export function CardTitle({ title, sub, right }: {
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.cardTitleRow}>
      <View style={styles.cardTitleText}>
        <Text style={styles.cardTitle}>{title}</Text>
        {sub ? <Text style={styles.cardSub}>{sub}</Text> : null}
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

export function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      {right}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Boutons                                                             */
/* ------------------------------------------------------------------ */

export function Button({ label, onPress, variant = 'solid', loading = false, disabled = false, style, accessibilityLabel }: {
  label: string;
  onPress?: () => void;
  variant?: 'solid' | 'gold' | 'outline' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const dimmed = disabled || loading;
  const gradient = variant === 'solid' || variant === 'gold';
  const content = loading
    ? <ActivityIndicator color={gradient ? '#fff' : theme.accent} />
    : (
      <Text style={[
        styles.buttonLabel,
        gradient && styles.buttonLabelSolid,
        variant === 'outline' && styles.buttonLabelOutline,
        variant === 'danger' && styles.buttonLabelDanger,
        variant === 'ghost' && styles.buttonLabelGhost,
      ]}>{label}</Text>
    );

  return (
    <Pressable
      onPress={onPress}
      disabled={dimmed}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.button,
        variant === 'outline' && styles.buttonOutline,
        variant === 'danger' && styles.buttonDanger,
        variant === 'ghost' && styles.buttonGhost,
        gradient && styles.buttonGradientHost,
        dimmed && !gradient && styles.buttonDisabled,
        pressed && !gradient && styles.buttonPressed,
        style,
      ]}
    >
      {({ pressed }) => (
        <>
          {gradient ? (
            <LinearGradient
              colors={variant === 'gold' ? gradients.gold : gradients.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFill, styles.buttonGradient, (pressed || dimmed) && styles.buttonPressed, dimmed && styles.buttonDisabled]}
            />
          ) : null}
          {content}
        </>
      )}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Champs                                                              */
/* ------------------------------------------------------------------ */

export function Field({ label, ...inputProps }: {
  label: string;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text>
      <TextInput
        placeholderTextColor={theme.ghost}
        selectionColor={theme.accent}
        style={styles.fieldInput}
        {...inputProps}
      />
    </View>
  );
}

export function SearchBar({ value, onChangeText, placeholder = 'Rechercher…', accessibilityLabel }: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
}) {
  return (
    <View style={styles.searchBar}>
      <Ionicons name="search" size={17} color={theme.faint} />
      <TextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.ghost}
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel={accessibilityLabel ?? placeholder}
        returnKeyType="search"
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={10} accessibilityLabel="Effacer la recherche">
          <Ionicons name="close-circle" size={17} color={theme.faint} />
        </Pressable>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Jetons, pastilles, chips                                            */
/* ------------------------------------------------------------------ */

export function Avatar({ name, size = 44, ring = false, uri }: {
  name?: string | null;
  size?: number;
  ring?: boolean;
  uri?: string | null;
}) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        accessibilityLabel={name ? `Photo de ${name}` : 'Photo'}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2 },
          ring && styles.avatarRing,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
        ring && styles.avatarRing,
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{initials(name)}</Text>
    </View>
  );
}

const PILL_TONES = {
  accent: { bg: theme.accentSoft, fg: '#b9c8ff' },
  ok: { bg: theme.okSoft, fg: theme.ok },
  copper: { bg: theme.copperSoft, fg: theme.copper },
  danger: { bg: theme.dangerSoft, fg: theme.danger },
  muted: { bg: 'rgba(167, 182, 255, 0.08)', fg: theme.faint },
} as const;

export type PillTone = keyof typeof PILL_TONES;

export function Pill({ label, tone = 'muted' }: { label: string; tone?: PillTone }) {
  const colors = PILL_TONES[tone];

  return (
    <View style={[styles.pill, { backgroundColor: colors.bg, borderColor: colors.fg + '33' }]}>
      <Text style={[styles.pillText, { color: colors.fg }]}>{label}</Text>
    </View>
  );
}

/** Chip de filtre pastille (actif = halo indigo). */
export function Chip({ label, active, onPress, small = false }: {
  label: string;
  active: boolean;
  onPress: () => void;
  small?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, small && styles.chipSmall, active && styles.chipActive]}
    >
      {active ? (
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, styles.chipGradient]}
        />
      ) : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chipRow, style]}>
      {children}
    </ScrollView>
  );
}

/* ------------------------------------------------------------------ */
/* Statistiques, barres, onglets                                       */
/* ------------------------------------------------------------------ */

/** Tuile KPI premium (grande valeur, libellé, tendance optionnelle). */
export function StatTile({ value, label, tone = 'accent', trend }: {
  value: string;
  label: string;
  tone?: 'accent' | 'ok' | 'copper' | 'muted' | 'danger';
  trend?: string;
}) {
  const accent = tone === 'ok' ? theme.ok
    : tone === 'copper' ? theme.copper
    : tone === 'danger' ? theme.danger
    : tone === 'muted' ? theme.ink
    : theme.ink;

  return (
    <View style={styles.statTile}>
      <View style={styles.statTileTop}>
        <Text style={[styles.statTileValue, { color: accent }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        {trend ? (
          <View style={styles.statTileTrend}>
            <Text style={styles.statTileTrendText}>{trend}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.statTileLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

/** Compat : petite carte de statistique (utilisée par les écrans parents). */
export function StatCard({ label, value, tone = 'accent' }: {
  label: string;
  value: string;
  tone?: 'accent' | 'ok' | 'copper' | 'muted';
}) {
  return <StatTile value={value} label={label} tone={tone} />;
}

/** Barre de progression dégradée (notes par matière, paiements…). */
export function ProgressBar({ value, max = 20, height = 6 }: {
  value: number;
  max?: number;
  height?: number;
}) {
  const ratio = Math.max(0, Math.min(1, max > 0 ? value / max : 0));

  return (
    <View style={[styles.progressTrack, { height, borderRadius: height / 2 }]}>
      <LinearGradient
        colors={gradients.progress}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: `${Math.max(4, ratio * 100)}%`, height, borderRadius: height / 2 }}
      />
    </View>
  );
}

/** Onglets segmentés à soulignement (fiche élève). */
export function SegmentedTabs({ tabs, active, onChange }: {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}) {
  return (
    <View style={styles.segmented}>
      {tabs.map((tab) => {
        const isActive = tab === active;
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(tab)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={styles.segmentedItem}
          >
            <Text style={[styles.segmentedText, isActive && styles.segmentedTextActive]}>{tab}</Text>
            {isActive ? (
              <LinearGradient
                colors={gradients.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.segmentedBar}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* États                                                               */
/* ------------------------------------------------------------------ */

export function Loading({ label = 'Chargement…' }: { label?: string }) {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={theme.accent} />
      <Text style={styles.loadingLabel}>{label}</Text>
    </View>
  );
}

export function Empty({ title, sub, action, icon = 'sparkles-outline' }: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.emptyBox}>
      <View style={styles.emptyGlyph}>
        <Ionicons name={icon} size={22} color={theme.copper} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {sub ? <Text style={styles.emptySub}>{sub}</Text> : null}
      {action ? <View style={styles.emptyAction}>{action}</View> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View style={styles.emptyBox}>
      <View style={[styles.emptyGlyph, { borderColor: 'rgba(240, 138, 138, 0.45)' }]}>
        <Ionicons name="alert-circle-outline" size={22} color={theme.danger} />
      </View>
      <Text style={styles.emptyTitle}>Une erreur est survenue</Text>
      <Text style={styles.emptySub}>{message ?? 'Réessayez dans un instant.'}</Text>
      {onRetry ? (
        <View style={styles.emptyAction}>
          <Button label="Réessayer" variant="outline" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  /* Fond */
  screen: { flex: 1, backgroundColor: theme.bg },
  screenContent: { flex: 1, paddingHorizontal: 16 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  glowRing: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  /* En-tête d'écran */
  screenHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 10, paddingBottom: 6 },
  screenTitle: { color: theme.ink, fontSize: 27, fontWeight: '800', letterSpacing: -0.4 },
  screenSub: { color: theme.faint, fontSize: 13, marginTop: 3 },
  screenHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  /* Carte d'en-tête « aurore » */
  homeHero: {
    borderRadius: theme.radiusLg,
    borderWidth: 1,
    borderColor: theme.lineStrong,
    padding: 18,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 14,
  },
  homeHeroGlowIndigo: {
    position: 'absolute',
    top: -70,
    right: -50,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(91, 124, 250, 0.22)',
  },
  homeHeroGlowCopper: {
    position: 'absolute',
    bottom: -80,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(224, 168, 111, 0.12)',
  },
  homeHeroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  homeHeroText: { flex: 1, gap: 6 },
  homeHeroOverline: { color: theme.copper, fontSize: 9.5, letterSpacing: 2, fontWeight: '800' },
  homeHeroTitle: { color: theme.ink, fontSize: 24, lineHeight: 30, fontWeight: '800', letterSpacing: -0.3 },
  homeHeroMark: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.glass,
    borderWidth: 1,
    borderColor: 'rgba(224, 168, 111, 0.45)',
  },

  /* Cartes */
  card: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 16,
  },
  cardPressed: { backgroundColor: theme.surfaceAlt },
  heroCard: {
    borderRadius: theme.radiusLg,
    padding: 18,
    overflow: 'hidden',
    shadowColor: '#000814',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  cardTitleText: { flex: 1 },
  cardTitle: { color: theme.ink, fontSize: 15, fontWeight: '700' },
  cardSub: { color: theme.faint, fontSize: 11.5, marginTop: 2, lineHeight: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    color: theme.copper,
    fontSize: 10.5,
    letterSpacing: 1.8,
    fontWeight: '700',
  },

  /* Boutons */
  button: {
    minHeight: 50,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  buttonGradientHost: {
    shadowColor: theme.accent,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  buttonGradient: { borderRadius: 999 },
  buttonOutline: { borderWidth: 1, borderColor: theme.lineStrong, backgroundColor: 'transparent' },
  buttonDanger: { borderWidth: 1, borderColor: 'rgba(240, 138, 138, 0.45)', backgroundColor: theme.dangerSoft },
  buttonGhost: { backgroundColor: 'transparent' },
  buttonDisabled: { opacity: 0.55 },
  buttonPressed: { opacity: 0.85 },
  buttonLabel: { fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  buttonLabelSolid: { color: '#ffffff' },
  buttonLabelOutline: { color: theme.ink },
  buttonLabelDanger: { color: theme.danger },
  buttonLabelGhost: { color: theme.faint },

  /* Champs */
  field: { marginBottom: 14 },
  fieldLabel: {
    color: theme.copper,
    fontSize: 9.5,
    letterSpacing: 1.4,
    fontWeight: '700',
    marginBottom: 7,
  },
  fieldInput: {
    backgroundColor: 'rgba(7, 11, 31, 0.55)',
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: theme.radiusSm,
    color: theme.ink,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: theme.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.line,
  },
  searchInput: { flex: 1, color: theme.ink, fontSize: 14, paddingVertical: 0 },

  /* Avatars & pastilles */
  avatar: {
    backgroundColor: theme.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(109, 139, 255, 0.35)',
  },
  avatarRing: {
    borderWidth: 2,
    borderColor: theme.copper,
    backgroundColor: 'rgba(224, 168, 111, 0.12)',
  },
  avatarText: { color: '#c9d4ff', fontWeight: '700' },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  pillText: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.2 },

  /* Chips */
  chipRow: { gap: 8, paddingVertical: 4, paddingRight: 16 },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.line,
    overflow: 'hidden',
    maxWidth: 220,
  },
  chipSmall: { paddingHorizontal: 12, paddingVertical: 7 },
  chipActive: { borderColor: 'rgba(143, 165, 255, 0.85)' },
  chipGradient: { borderRadius: 999 },
  chipText: { color: theme.faint, fontSize: 12.5, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF', fontWeight: '700' },

  /* Statistiques */
  statTile: {
    flexBasis: '31%',
    flexGrow: 1,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: theme.radius,
    paddingVertical: 13,
    paddingHorizontal: 13,
    gap: 3,
  },
  statTileTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statTileValue: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'], flexShrink: 1 },
  statTileTrend: {
    backgroundColor: theme.copperSoft,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(224, 168, 111, 0.35)',
  },
  statTileTrendText: { color: theme.copper, fontSize: 9, fontWeight: '800', fontVariant: ['tabular-nums'] },
  statTileLabel: { color: theme.faint, fontSize: 10, letterSpacing: 0.6, fontWeight: '600' },

  /* Barre de progression */
  progressTrack: {
    flex: 1,
    backgroundColor: 'rgba(7, 11, 31, 0.6)',
    overflow: 'hidden',
  },

  /* Onglets segmentés */
  segmented: {
    flexDirection: 'row',
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
  },
  segmentedItem: { flex: 1, alignItems: 'center', paddingTop: 10 },
  segmentedText: {
    color: theme.ghost,
    fontSize: 12.5,
    fontWeight: '700',
    paddingBottom: 10,
  },
  segmentedTextActive: { color: theme.ink },
  segmentedBar: {
    position: 'absolute',
    bottom: -1,
    height: 2.5,
    width: '62%',
    borderRadius: 2,
  },

  /* États */
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingLabel: { color: theme.faint, marginTop: 12, fontSize: 13 },
  emptyBox: { alignItems: 'center', padding: 30, gap: 6 },
  emptyGlyph: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(224, 168, 111, 0.4)',
    backgroundColor: theme.copperSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: { color: theme.ink, fontSize: 14.5, fontWeight: '700', textAlign: 'center' },
  emptySub: { color: theme.faint, fontSize: 12, textAlign: 'center', lineHeight: 17 },
  emptyAction: { marginTop: 10 },
  divider: { height: 1, backgroundColor: theme.line, marginVertical: 14 },
});
