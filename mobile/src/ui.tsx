/** Composants partagés : coquille, cartes, boutons, champs, états vides et chargement. */
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { theme } from './theme';
import { initials } from './format';

export function Screen({ children, scroll = false, style }: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const inner = <View style={[styles.screenContent, style]}>{children}</View>;

  return (
    <SafeAreaView style={styles.screen}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, style]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : inner}
    </SafeAreaView>
  );
}

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

export function Button({ label, onPress, variant = 'solid', loading = false, disabled = false, style, accessibilityLabel }: {
  label: string;
  onPress?: () => void;
  variant?: 'solid' | 'outline' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const content = loading
    ? <ActivityIndicator color={variant === 'solid' ? '#fff' : theme.accent} />
    : <Text style={[
        styles.buttonLabel,
        variant === 'solid' && styles.buttonLabelSolid,
        variant !== 'solid' && styles.buttonLabelOutline,
        variant === 'danger' && styles.buttonLabelDanger,
      ]}>{label}</Text>;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.button,
        variant === 'solid' && styles.buttonSolid,
        variant === 'outline' && styles.buttonOutline,
        variant === 'danger' && styles.buttonDanger,
        variant === 'ghost' && styles.buttonGhost,
        (disabled || loading) && styles.buttonDisabled,
        pressed && !(disabled || loading) && styles.buttonPressed,
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

export function Field({ label, ...inputProps }: {
  label: string;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text>
      <TextInput
        placeholderTextColor={theme.faint}
        selectionColor={theme.accent}
        style={styles.fieldInput}
        {...inputProps}
      />
    </View>
  );
}

export function Avatar({ name, size = 44 }: { name?: string | null; size?: number }) {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{initials(name)}</Text>
    </View>
  );
}

const PILL_TONES = {
  accent: { bg: theme.accentSoft, fg: '#b9c8ff' },
  ok: { bg: 'rgba(111, 227, 176, 0.14)', fg: theme.ok },
  copper: { bg: 'rgba(217, 176, 111, 0.14)', fg: theme.copper },
  danger: { bg: 'rgba(240, 138, 138, 0.14)', fg: theme.danger },
  muted: { bg: 'rgba(167, 182, 255, 0.08)', fg: theme.faint },
} as const;

export type PillTone = keyof typeof PILL_TONES;

export function Pill({ label, tone = 'muted' }: { label: string; tone?: PillTone }) {
  const colors = PILL_TONES[tone];

  return (
    <View style={[styles.pill, { backgroundColor: colors.bg }]}>
      <Text style={[styles.pillText, { color: colors.fg }]}>{label}</Text>
    </View>
  );
}

export function Loading({ label = 'Chargement…' }: { label?: string }) {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={theme.accent} />
      <Text style={styles.loadingLabel}>{label}</Text>
    </View>
  );
}

export function Empty({ title, sub, action }: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {sub ? <Text style={styles.emptySub}>{sub}</Text> : null}
      {action ? <View style={styles.emptyAction}>{action}</View> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View style={styles.emptyBox}>
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

export function StatCard({ label, value, tone = 'accent' }: {
  label: string;
  value: string;
  tone?: 'accent' | 'ok' | 'copper' | 'muted';
}) {
  const accent = tone === 'accent' ? theme.accent
    : tone === 'ok' ? theme.ok
    : tone === 'copper' ? theme.copper
    : theme.faint;

  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
      <Text style={[styles.statValue, { color: accent }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  screenContent: { flex: 1, paddingHorizontal: 16 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  card: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 16,
  },
  cardPressed: { backgroundColor: theme.surfaceAlt },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  cardTitleText: { flex: 1 },
  cardTitle: { color: theme.ink, fontSize: 15, fontWeight: '700' },
  cardSub: { color: theme.faint, fontSize: 11.5, marginTop: 2, lineHeight: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 8,
  },
  sectionTitle: {
    color: theme.faint,
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: '700',
  },
  button: {
    minHeight: 48,
    borderRadius: theme.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  buttonSolid: { backgroundColor: theme.accentStrong },
  buttonOutline: { borderWidth: 1, borderColor: theme.lineStrong, backgroundColor: 'transparent' },
  buttonDanger: { borderWidth: 1, borderColor: 'rgba(240, 138, 138, 0.45)', backgroundColor: 'rgba(240, 138, 138, 0.12)' },
  buttonGhost: { backgroundColor: 'transparent' },
  buttonDisabled: { opacity: 0.55 },
  buttonPressed: { opacity: 0.85 },
  buttonLabel: { fontSize: 15, fontWeight: '700' },
  buttonLabelSolid: { color: '#ffffff' },
  buttonLabelOutline: { color: theme.ink },
  buttonLabelDanger: { color: theme.danger },
  field: { marginBottom: 14 },
  fieldLabel: {
    color: theme.faint,
    fontSize: 10,
    letterSpacing: 1.1,
    fontWeight: '700',
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: theme.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: theme.radiusSm,
    color: theme.ink,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  avatar: {
    backgroundColor: theme.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(109, 139, 255, 0.35)',
  },
  avatarText: { color: '#c9d4ff', fontWeight: '700' },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.2 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingLabel: { color: theme.faint, marginTop: 12, fontSize: 13 },
  emptyBox: { alignItems: 'center', padding: 26, gap: 6 },
  emptyTitle: { color: theme.ink, fontSize: 14.5, fontWeight: '700', textAlign: 'center' },
  emptySub: { color: theme.faint, fontSize: 12, textAlign: 'center', lineHeight: 17 },
  emptyAction: { marginTop: 10 },
  divider: { height: 1, backgroundColor: theme.line, marginVertical: 14 },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: theme.radius,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
  },
  statLabel: { color: theme.faint, fontSize: 9.5, letterSpacing: 1.2, fontWeight: '700' },
  statValue: { fontSize: 19, fontWeight: '800' },
});
