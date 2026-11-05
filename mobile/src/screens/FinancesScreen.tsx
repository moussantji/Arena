/**
 * Cockpit financier premium (direction et comptabilité) : carte héros
 * encaissement, états des factures, répartitions mensuelles et modes de paiement.
 */
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../api';
import { gradients, theme } from '../theme';
import {
  Aurora,
  Card,
  Empty,
  ErrorState,
  HeroCard,
  Loading,
  Pill,
  ScreenHeader,
  SectionHeader,
} from '../ui';
import { money, paymentMethodLabel } from '../format';
import type { FinanceSummary } from '../types';
import { useApiQuery } from '../useApiQuery';

const STATUS_LABEL: Record<string, string> = {
  paid: 'Payées',
  partial: 'Partielles',
  pending: 'En attente',
  overdue: 'En retard',
  cancelled: 'Annulées',
};

const STATUS_TONE: Record<string, 'ok' | 'accent' | 'copper' | 'danger' | 'muted'> = {
  paid: 'ok',
  partial: 'accent',
  pending: 'copper',
  overdue: 'danger',
  cancelled: 'muted',
};

export default function FinancesScreen() {
  const year = new Date().getFullYear();
  const summary = useApiQuery<FinanceSummary>(
    () => api.get<FinanceSummary>(`/finance/summary?year=${year}`),
    [year],
  );

  if (summary.loading && !summary.data) return <Loading />;
  if (!summary.data) {
    return (
      <View style={styles.fill}>
        <ErrorState message={summary.error ?? undefined} onRetry={summary.reload} />
      </View>
    );
  }

  const data = summary.data;
  const maxMonth = Math.max(1, ...data.monthly.map((month) => month.total));
  const maxMethod = Math.max(1, ...data.byMethod.map((method) => method.total));
  const currentMonth = data.monthly[data.monthly.length - 1];
  const previousMonth = data.monthly[data.monthly.length - 2];
  const trend = currentMonth && previousMonth && previousMonth.total > 0
    ? Math.round(((currentMonth.total - previousMonth.total) / previousMonth.total) * 100)
    : null;

  return (
    <View style={styles.screen}>
      <Aurora />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={summary.reload} tintColor={theme.accent} />}
      >
        <ScreenHeader title="Finances" sub={`Année scolaire ${year}`} />

        <HeroCard style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroLabel}>ENCAISSÉ · ANNÉE</Text>
              <Text style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>{money(data.collected)}</Text>
              {trend != null ? (
                <View style={styles.heroTrend}>
                  <Text style={styles.heroTrendText}>
                    {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)} % ce mois
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={styles.heroChart}>
              {data.monthly.slice(-6).map((month) => (
                <View key={month.month} style={styles.heroBarColumn}>
                  <View
                    style={[
                      styles.heroBar,
                      { height: `${Math.max(10, Math.round((month.total / maxMonth) * 100))}%` },
                    ]}
                  />
                </View>
              ))}
            </View>
          </View>
          <View style={styles.heroFooter}>
            <Text style={styles.heroFootText}>Facturé {money(data.invoiced)}</Text>
            <Text style={styles.heroFootText}>Encaissé {money(data.collected)}</Text>
          </View>
        </HeroCard>

        <View style={styles.statusRow}>
          {data.statusBreakdown.map((row) => (
            <View key={row.status} style={styles.statusChip}>
              <Pill
                label={`${STATUS_LABEL[row.status] ?? row.status} · ${row.count}`}
                tone={STATUS_TONE[row.status] ?? 'muted'}
              />
              <Text style={styles.statusAmount}>{money(Number(row.total))}</Text>
            </View>
          ))}
        </View>

        <SectionHeader title="Encaissements par mois" />
        <Card>
          {data.monthly.length === 0 ? (
            <Text style={styles.muted}>Aucun encaissement enregistré cette année.</Text>
          ) : (
            <View style={styles.chart}>
              {data.monthly.map((month) => (
                <View key={month.month} style={styles.barColumn}>
                  <Text style={styles.barAmount} numberOfLines={1}>
                    {month.total >= 1000 ? `${Math.round(month.total / 1000)} k` : String(Math.round(month.total))}
                  </Text>
                  <View style={styles.barTrack}>
                    <LinearGradient
                      colors={gradients.progress}
                      start={{ x: 0, y: 1 }}
                      end={{ x: 0, y: 0 }}
                      style={[styles.barFill, { height: `${Math.max(6, Math.round((month.total / maxMonth) * 100))}%` }]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{month.label}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        <SectionHeader title="Par mode de paiement" />
        <Card>
          {data.byMethod.length === 0 ? (
            <Text style={styles.muted}>Aucun paiement encaissé.</Text>
          ) : (
            data.byMethod.map((method) => (
              <View key={method.method} style={styles.methodRow}>
                <Text style={styles.methodName} numberOfLines={1}>{paymentMethodLabel(method.method)}</Text>
                <View style={styles.methodTrack}>
                  <LinearGradient
                    colors={gradients.progress}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.methodFill, { width: `${Math.round((method.total / maxMethod) * 100)}%` }]}
                  />
                </View>
                <Text style={styles.methodValue} numberOfLines={1}>{money(method.total)}</Text>
              </View>
            ))
          )}
        </Card>

        <SectionHeader title="Par type de frais" />
        <Card>
          {data.byFeeType.length === 0 ? (
            <Text style={styles.muted}>Aucune facture émise.</Text>
          ) : (
            data.byFeeType.map((row) => (
              <View key={row.code ?? row.fee} style={styles.feeRow}>
                <Text style={styles.feeName} numberOfLines={1}>{row.fee}</Text>
                <Text style={styles.feeValue} numberOfLines={1}>{money(row.invoiced)}</Text>
              </View>
            ))
          )}
        </Card>

        <View style={styles.footerSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  fill: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: 16, paddingBottom: 44 },
  hero: { marginTop: 12 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  heroLabel: { color: 'rgba(240, 242, 255, 0.75)', fontSize: 9.5, letterSpacing: 1.6, fontWeight: '700' },
  heroValue: { color: '#FFFFFF', fontSize: 27, fontWeight: '800', fontVariant: ['tabular-nums'], marginTop: 5 },
  heroTrend: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(7, 11, 31, 0.28)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  heroTrendText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  heroChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    height: 62,
    marginTop: 6,
  },
  heroBarColumn: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  heroBar: {
    width: '100%',
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.18)',
  },
  heroFootText: { color: 'rgba(240, 242, 255, 0.85)', fontSize: 11, fontWeight: '600', fontVariant: ['tabular-nums'] },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  statusChip: { alignItems: 'center', gap: 5 },
  statusAmount: { color: theme.faint, fontSize: 10, fontVariant: ['tabular-nums'] },
  muted: { color: theme.faint, fontSize: 12 },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 150,
    paddingTop: 8,
  },
  barColumn: { flex: 1, alignItems: 'center', gap: 4, height: '100%' },
  barAmount: { color: theme.faint, fontSize: 8, fontVariant: ['tabular-nums'] },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(7, 11, 31, 0.55)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 6 },
  barLabel: { color: theme.faint, fontSize: 8.5, fontWeight: '600' },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  methodName: { width: 110, color: theme.inkSoft, fontSize: 11.5, fontWeight: '600' },
  methodTrack: {
    flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(7, 11, 31, 0.55)', overflow: 'hidden',
  },
  methodFill: { height: 8, borderRadius: 4 },
  methodValue: { width: 96, textAlign: 'right', color: theme.ink, fontSize: 10.5, fontVariant: ['tabular-nums'] },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
  },
  feeName: { flex: 1, color: theme.inkSoft, fontSize: 12.5 },
  feeValue: { color: theme.ink, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  footerSpace: { height: 24 },
});
