/** Finances de l'enfant lié : factures, paiements, solde à payer. */
import React, { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, View } from 'react-native';
import { useChildren, ChildSelector } from '../children';
import { api } from '../api';
import { theme } from '../theme';
import { Card, Empty, ErrorState, Loading, SectionHeader, Pill } from '../ui';
import {
  formatDate,
  fullName,
  invoiceStatusLabel,
  money,
  paymentMethodLabel,
} from '../format';
import type { ParentFinancesResponse, ParentInvoice } from '../types';
import { useApiQuery } from '../useApiQuery';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ParentFinancesScreen() {
  const { selectedChild, loading: childrenLoading, error: childrenError, reload: reloadChildren } = useChildren();
  const finances = useApiQuery<ParentFinancesResponse | null>(
    () => (selectedChild
      ? api.get<ParentFinancesResponse>(`/parent/children/${selectedChild.id}/finances`)
      : Promise.resolve(null)),
    [selectedChild?.id],
  );
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (childrenLoading && !selectedChild) return <Loading />;
  if (!selectedChild) {
    return (
      <View style={styles.fill}>
        <ErrorState message={childrenError ?? 'Aucun enfant lié à votre compte.'} onRetry={reloadChildren} />
      </View>
    );
  }

  const data = finances.data;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ChildSelector />
      <Text style={styles.childName}>{fullName(selectedChild)}</Text>
      <Text style={styles.childMeta}>Factures et paiements</Text>

      {finances.loading && !data ? (
        <Loading />
      ) : !data ? (
        <ErrorState message={finances.error ?? undefined} onRetry={finances.reload} />
      ) : (
        <>
          <Card style={[styles.summaryCard, data.summary.outstanding > 0 && styles.summaryCardDue]}>
            <Text style={styles.summaryLabel}>SOLDE À PAYER</Text>
            <Text style={[
              styles.summaryValue,
              { color: data.summary.outstanding > 0 ? theme.copper : theme.ok },
            ]}>
              {money(data.summary.outstanding)}
            </Text>
            <View style={styles.summaryGrid}>
              <SummaryCell label="Facturé" value={money(data.summary.total_due)} />
              <SummaryCell label="Encaissé" value={money(data.summary.total_paid)} />
              <SummaryCell label="En attente" value={String(data.summary.pending_count)} />
            </View>
            {data.summary.outstanding > 0 ? (
              <Text style={styles.summaryHint}>
                Réglez le solde au bureau de l’établissement (caisse). Un reçu vous sera remis.
              </Text>
            ) : (
              <Text style={styles.summaryHintOk}>Toutes les factures sont réglées. Merci !</Text>
            )}
          </Card>

          {data.invoices.length === 0 ? (
            <Empty icon="receipt-outline" title="Aucune facture" sub="Aucune facture n'a encore été émise pour cet enfant." />
          ) : (
            <>
              <SectionHeader title="Factures" />
              {data.invoices.map((invoice) => (
                <InvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  expanded={expandedId === invoice.id}
                  onToggle={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setExpandedId((current) => (current === invoice.id ? null : invoice.id));
                  }}
                />
              ))}
            </>
          )}
        </>
      )}

      <View style={styles.footerSpace} />
    </ScrollView>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryCell}>
      <Text style={styles.summaryCellValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.summaryCellLabel}>{label.toUpperCase()}</Text>
    </View>
  );
}

function InvoiceRow({ invoice, expanded, onToggle }: {
  invoice: ParentInvoice;
  expanded: boolean;
  onToggle: () => void;
}) {
  const statusTone = invoice.status === 'paid' ? 'ok'
    : invoice.status === 'cancelled' ? 'muted'
    : invoice.status === 'partial' ? 'copper' : 'danger';

  return (
    <Card style={styles.invoiceCard}>
      <Pressable onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded }}>
        <View style={styles.invoiceTop}>
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceTitle} numberOfLines={1}>
              {invoice.fee_type ?? 'Facture'}{invoice.reference ? ` · ${invoice.reference}` : ''}
            </Text>
            <Text style={styles.invoiceMeta} numberOfLines={1}>
              {invoice.term ? `${invoice.term} · ` : ''}Émise le {formatDate(invoice.issued_on)}
              {invoice.due_on ? ` · Échéance ${formatDate(invoice.due_on)}` : ''}
            </Text>
          </View>
          <View style={styles.invoiceRight}>
            <Text style={styles.invoiceAmount}>{money(invoice.amount)}</Text>
            <Pill label={invoiceStatusLabel(invoice.status)} tone={statusTone} />
          </View>
        </View>
        <View style={styles.invoiceFooter}>
          <Text style={styles.invoiceFooterText}>Payé : {money(invoice.paid_total)}</Text>
          <Text style={[styles.invoiceFooterText, invoice.remaining > 0 && styles.invoiceRemaining]}>
            Reste : {money(invoice.remaining)}
          </Text>
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.paymentsBlock}>
          {invoice.payments.length === 0 ? (
            <Text style={styles.noPayment}>Aucun paiement enregistré.</Text>
          ) : (
            invoice.payments.map((payment) => (
              <View key={payment.id} style={styles.paymentRow}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentMethod}>{paymentMethodLabel(payment.method)}</Text>
                  <Text style={styles.paymentDate}>
                    {formatDate(payment.paid_on)}{payment.status !== 'completed' ? ` · ${payment.status}` : ''}
                  </Text>
                </View>
                <Text style={[
                  styles.paymentAmount,
                  payment.status === 'completed' ? styles.paymentDone : styles.paymentPending,
                ]}>
                  {money(payment.amount)}
                </Text>
              </View>
            ))
          )}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  fill: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 40 },
  childName: { color: theme.ink, fontSize: 19, fontWeight: '800', marginTop: 6 },
  childMeta: { color: theme.faint, fontSize: 11.5, marginTop: 2, marginBottom: 10 },
  summaryCard: { gap: 6, marginBottom: 4 },
  summaryCardDue: { borderColor: 'rgba(217, 176, 111, 0.45)' },
  summaryLabel: { color: theme.faint, fontSize: 9, letterSpacing: 1.4, fontWeight: '700' },
  summaryValue: { fontSize: 34, fontWeight: '800', fontVariant: ['tabular-nums'] },
  summaryGrid: { flexDirection: 'row', gap: 12, marginTop: 8 },
  summaryCell: { flex: 1, gap: 2 },
  summaryCellValue: { color: theme.ink, fontSize: 13, fontWeight: '800' },
  summaryCellLabel: { color: theme.faint, fontSize: 8, letterSpacing: 1, fontWeight: '700' },
  summaryHint: { color: theme.copper, fontSize: 10.5, lineHeight: 15, marginTop: 8 },
  summaryHintOk: { color: theme.ok, fontSize: 10.5, marginTop: 8 },
  invoiceCard: { marginBottom: 10, gap: 10 },
  invoiceTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  invoiceInfo: { flex: 1, gap: 2 },
  invoiceTitle: { color: theme.ink, fontSize: 13.5, fontWeight: '700' },
  invoiceMeta: { color: theme.faint, fontSize: 10, lineHeight: 14 },
  invoiceRight: { alignItems: 'flex-end', gap: 5 },
  invoiceAmount: { color: theme.ink, fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  invoiceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.line,
  },
  invoiceFooterText: { color: theme.faint, fontSize: 10.5 },
  invoiceRemaining: { color: theme.copper, fontWeight: '700' },
  chevron: { marginLeft: 'auto', color: theme.faint, fontSize: 10 },
  paymentsBlock: {
    borderTopWidth: 1,
    borderTopColor: theme.line,
    paddingTop: 10,
    gap: 8,
  },
  noPayment: { color: theme.faint, fontSize: 11.5 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  paymentInfo: { flex: 1 },
  paymentMethod: { color: theme.ink, fontSize: 12, fontWeight: '600' },
  paymentDate: { color: theme.faint, fontSize: 9.5, marginTop: 1 },
  paymentAmount: { fontSize: 12.5, fontWeight: '800', fontVariant: ['tabular-nums'] },
  paymentDone: { color: theme.ok },
  paymentPending: { color: theme.copper },
  footerSpace: { height: 24 },
});
