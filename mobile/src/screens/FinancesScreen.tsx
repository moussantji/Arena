/** Cockpit financier (direction et comptabilité) : encaissé, en attente, encaissements mensuels. */
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { theme } from '../theme';
import { Card, Empty, ErrorState, Loading, SectionHeader, Pill } from '../ui';
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

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={summary.reload} tintColor={theme.accent} />}
    >
      <SectionHeader title={`Exercice ${year}`} />

      <View style={styles.grid}>
        <Kpi label="Facturé" value={money(data.invoiced)} tone="plain" />
        <Kpi label="Encaissé" value={money(data.collected)} tone="ok" />
        <Kpi label="En attente" value={money(data.outstanding)} tone="copper" />
        <Kpi label="En retard" value={money(data.overdue)} tone="danger" />
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
                  <View style={[styles.barFill, { height: `${Math.max(6, Math.round((month.total / maxMonth) * 100))}%` }]} />
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
                <View style={[styles.methodFill, { width: `${Math.round((method.total / maxMethod) * 100)}%` }]} />
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

      <SectionHeader title="État des factures" />
      <Card>
        <View style={styles.breakdownRow}>
          {data.statusBreakdown.map((row) => (
            <View key={row.status} style={styles.breakdownItem}>
              <Text style={styles.breakdownCount}>{row.count}</Text>
              <Text style={styles.breakdownLabel}>{STATUS_LABEL[row.status] ?? row.status}</Text>
              <Text style={styles.breakdownTotal}>{money(Number(row.total))}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.footerSpace} />
    </ScrollView>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone: 'plain' | 'ok' | 'copper' | 'danger' }) {
  const color = tone === 'ok' ? theme.ok : tone === 'copper' ? theme.copper : tone === 'danger' ? theme.danger : theme.ink;

  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label.toUpperCase()}</Text>
      <Text style={[styles.kpiValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  fill: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 44 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpi: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: theme.radius,
    padding: 14,
    gap: 6,
  },
  kpiLabel: { color: theme.faint, fontSize: 8.5, letterSpacing: 1.2, fontWeight: '700' },
  kpiValue: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
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
    backgroundColor: theme.surfaceAlt,
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: { backgroundColor: theme.accentStrong, width: '100%', borderRadius: 6 },
  barLabel: { color: theme.faint, fontSize: 8.5, fontWeight: '600' },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  methodName: { width: 110, color: theme.ink, fontSize: 11.5, fontWeight: '600' },
  methodTrack: {
    flex: 1, height: 8, borderRadius: 4, backgroundColor: theme.surfaceAlt, overflow: 'hidden',
  },
  methodFill: { height: 8, borderRadius: 4, backgroundColor: theme.copper },
  methodValue: { width: 96, textAlign: 'right', color: theme.ink, fontSize: 10.5, fontVariant: ['tabular-nums'] },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
  },
  feeName: { flex: 1, color: theme.ink, fontSize: 12.5 },
  feeValue: { color: theme.ink, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  breakdownRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  breakdownItem: {
    flexBasis: '30%',
    flexGrow: 1,
    backgroundColor: theme.surfaceSoft,
    borderRadius: theme.radiusSm,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: theme.line,
  },
  breakdownCount: { color: theme.ink, fontSize: 18, fontWeight: '800' },
  breakdownLabel: { color: theme.faint, fontSize: 8, letterSpacing: 0.6, fontWeight: '700', textTransform: 'uppercase' },
  breakdownTotal: { color: theme.faint, fontSize: 9, fontVariant: ['tabular-nums'] },
  footerSpace: { height: 24 },
});
