import React, { useEffect, useMemo, useState } from 'react';
import {
  Btn, Card, CardHead, Pill, Progress, Table, Tr, Tabs, Icon, AreaChart,
} from '../ui.jsx';
import {
  useApi, useData, useDebounced, number, money, compactMoney, date,
  INVOICE_STATUS, PAYMENT_STATUS, PAYMENT_METHODS,
} from '../data.jsx';
import { useActions } from '../actions.jsx';
import { errorMessage } from '../api.js';
import {
  exportFinanceInvoicesWorkbook, exportFinancePaymentsWorkbook, exportFinanceSummaryWorkbook,
  fetchAllInvoices, fetchAllPayments,
} from '../exports.js';
import {
  ActionMenu, ListState, Pager, SearchInput, SelectFilter,
} from '../forms.jsx';
import { PageHead, StudentCell, InvoicePill, PaymentPill } from './common.jsx';

const balanceOf = (invoice) => Math.max(0, Number(invoice.amount || 0) - Number(invoice.paid_amount || 0));

function MoneyBars({ items = [], currency }) {
  const max = Math.max(...items.map((item) => Number(item.total || 0)), 1);
  return (
    <div className="money-bars">
      {items.map((item) => (
        <div className="money-bar" key={item.label}>
          <span className="money-bar-top">
            <b>{item.label}</b>
            <em>{money(item.total, currency)}</em>
          </span>
          <span className="money-bar-track">
            <i style={{ width: `${Math.max(3, (Number(item.total || 0) / max) * 100)}%` }} />
          </span>
          {item.hint && <span className="money-bar-hint">{item.hint}</span>}
        </div>
      ))}
    </div>
  );
}

export function Finances() {
  const { meta, notify } = useData();
  const actions = useActions();
  const [tab, setTab] = useState(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const stored = Number(window.sessionStorage.getItem('kalanso.finance.tab'));
      if (Number.isInteger(stored) && stored >= 0 && stored <= 2) return stored;
    } catch {
      /* stockage indisponible : on reste sur la synthèse */
    }
    return 0;
  });
  const [invoicePage, setInvoicePage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const [invoiceQ, setInvoiceQ] = useState('');
  const [paymentQ, setPaymentQ] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('');
  const [invoiceClass, setInvoiceClass] = useState('');
  const [overdue, setOverdue] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [exporting, setExporting] = useState(false);
  const invoiceSearch = useDebounced(invoiceQ);
  const paymentSearch = useDebounced(paymentQ);
  const currency = meta?.school?.currency || 'FCFA';
  const classes = meta?.classes || [];

  useEffect(() => {
    try {
      window.sessionStorage.removeItem('kalanso.finance.tab');
    } catch {
      /* stockage indisponible */
    }
    const onFinanceTab = (event) => {
      const next = Number(event.detail?.tab);
      if (Number.isInteger(next) && next >= 0 && next <= 2) {
        setTab(next);
        setInvoicePage(1);
      }
    };
    window.addEventListener('kalanso:finance-tab', onFinanceTab);
    return () => window.removeEventListener('kalanso:finance-tab', onFinanceTab);
  }, []);

  useEffect(() => { setInvoicePage(1); }, [invoiceSearch, invoiceStatus, invoiceClass, overdue]);
  useEffect(() => { setPaymentPage(1); }, [paymentSearch, paymentStatus, paymentMethod]);

  const summary = useApi('/finance/summary');
  const invoices = useApi('/invoices', {
    page: invoicePage,
    per_page: 12,
    q: invoiceSearch || undefined,
    status: invoiceStatus || undefined,
    class_id: invoiceClass || undefined,
    overdue: overdue ? 1 : undefined,
  }, { enabled: tab === 1 });
  const payments = useApi('/payments', {
    page: paymentPage,
    per_page: 12,
    q: paymentSearch || undefined,
    status: paymentStatus || undefined,
    method: paymentMethod || undefined,
  }, { enabled: tab === 2 });

  const kpis = summary.data?.kpis || {};
  const monthly = summary.data?.monthly || [];
  const byMethod = summary.data?.by_method || [];
  const byFeeType = summary.data?.by_fee_type || [];
  const byStatus = summary.data?.by_status || [];
  const topDebtors = summary.data?.top_debtors || [];

  const series = useMemo(
    () => monthly.map((row) => ({ m: row.label, v: Number(row.total || 0) / 1_000_000 })),
    [monthly],
  );

  const kpiItems = [
    {
      key: 'invoiced',
      label: 'Montant facturé',
      value: compactMoney(kpis.invoiced || 0, currency),
      hint: `${number(kpis.collection_rate || 0, 1)} % recouvré`,
      dot: true,
    },
    {
      key: 'collected',
      label: 'Encaissé',
      value: compactMoney(kpis.collected || 0, currency),
      hint: 'paiements validés',
      progress: kpis.collection_rate || 0,
    },
    {
      key: 'outstanding',
      label: 'Reste à recouvrer',
      value: compactMoney(kpis.outstanding || 0, currency),
      hint: 'solde des factures ouvertes',
      delta: kpis.overdue ? 'retard' : null,
    },
    {
      key: 'overdue',
      label: 'Échéances dépassées',
      value: compactMoney(kpis.overdue || 0, currency),
      hint: 'à relancer en priorité',
    },
  ];

  const invoiceRows = invoices.data?.data || [];
  const paymentRows = payments.data?.data || [];
  const pageInvoiced = invoiceRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const pageCollected = invoiceRows.reduce((sum, row) => sum + Number(row.paid_amount || 0), 0);
  const pageBalance = invoiceRows.reduce((sum, row) => sum + balanceOf(row), 0);

  const exportBase = {
    schoolName: meta?.school?.name,
    termName: meta?.term?.name,
    currency,
  };

  const exportSummary = async () => {
    if (!summary.data || exporting) return;
    setExporting(true);
    try {
      await exportFinanceSummaryWorkbook(summary.data, {
        ...exportBase,
        yearName: meta?.academic_year?.label,
      });
      notify('Synthèse financière exportée.', { tone: 'success' });
    } catch (error) {
      notify(errorMessage(error, 'Export impossible.'), { tone: 'danger' });
    } finally {
      setExporting(false);
    }
  };

  const exportInvoices = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const all = await fetchAllInvoices({
        q: invoiceSearch || undefined,
        status: invoiceStatus || undefined,
        class_id: invoiceClass || undefined,
        overdue: overdue ? 1 : undefined,
      });
      if (!all.length) {
        notify('Aucune facture à exporter.');
        return;
      }
      const className = classes.find((item) => String(item.id) === String(invoiceClass))?.name;
      const filterLabel = [
        invoiceSearch ? `recherche « ${invoiceSearch} »` : '',
        invoiceStatus ? INVOICE_STATUS[invoiceStatus]?.label : '',
        className ? `classe ${className}` : '',
        overdue ? 'en retard' : '',
      ].filter(Boolean).join(' · ');
      await exportFinanceInvoicesWorkbook(all, { ...exportBase, filterLabel });
      notify(`${all.length} facture${all.length > 1 ? 's' : ''} exportée${all.length > 1 ? 's' : ''}.`, { tone: 'success' });
    } catch (error) {
      notify(errorMessage(error, 'Export impossible.'), { tone: 'danger' });
    } finally {
      setExporting(false);
    }
  };

  const exportPayments = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const all = await fetchAllPayments({
        q: paymentSearch || undefined,
        status: paymentStatus || undefined,
        method: paymentMethod || undefined,
      });
      if (!all.length) {
        notify('Aucun paiement à exporter.');
        return;
      }
      const filterLabel = [
        paymentSearch ? `recherche « ${paymentSearch} »` : '',
        paymentStatus ? PAYMENT_STATUS[paymentStatus]?.label : '',
        paymentMethod ? PAYMENT_METHODS[paymentMethod] : '',
      ].filter(Boolean).join(' · ');
      await exportFinancePaymentsWorkbook(all, { ...exportBase, filterLabel });
      notify(`${all.length} paiement${all.length > 1 ? 's' : ''} exporté${all.length > 1 ? 's' : ''}.`, { tone: 'success' });
    } catch (error) {
      notify(errorMessage(error, 'Export impossible.'), { tone: 'danger' });
    } finally {
      setExporting(false);
    }
  };

  const openInvoice = () => actions.invoice();
  const openPayment = () => actions.payment();

  return (
    <>
      <PageHead
        id="finances"
        sub={`${money(kpis.collected || 0, currency)} encaissés · ${money(kpis.outstanding || 0, currency)} en attente · exercice ${meta?.academic_year?.label || ''}`}
        primary="Créer une facture"
        onPrimary={openInvoice}
        secondary="Exporter"
        onSecondary={() => {
          if (tab === 2) exportPayments();
          else if (tab === 1) exportInvoices();
          else exportSummary();
        }}
      />

      <div className="toolbar rise">
        <Tabs items={['Synthèse', 'Factures', 'Paiements']} active={tab} onChange={setTab} />
        <div className="toolbar-right">
          {tab === 0 && <Btn icon="download" onClick={exportSummary}>Exporter la synthèse</Btn>}
          <Btn icon="finance" solid onClick={openPayment}>Encaisser un paiement</Btn>
        </div>
      </div>

      <ListState
        loading={summary.loading && !summary.data}
        error={summary.error}
        empty={false}
        onRetry={summary.reload}
      >
        {tab === 0 && (
          <>
            <div className="kpis">
              {kpiItems.map((item, index) => (
                <Card key={item.key} className="kpi rise" style={{ animationDelay: `${index * 60}ms` }}>
                  <div className="kpi-top">
                    <span className="kpi-label">{item.label}</span>
                    {item.dot && <i className="kpi-dot" />}
                    {item.delta && <Pill tone="copper">{item.delta}</Pill>}
                  </div>
                  <div className="kpi-value"><b>{item.value}</b></div>
                  {item.progress != null && <Progress value={item.progress} height={3} />}
                  <div className="kpi-foot"><span>{item.hint}</span></div>
                </Card>
              ))}
            </div>

            <div className="grid-main">
              <Card className="rise" style={{ animationDelay: '90ms' }}>
                <CardHead
                  title="Encaissements mensuels"
                  sub={`Exercice ${meta?.academic_year?.label || ''} · en millions de ${currency}`}
                  right={<Pill tone="accent" dot>API live</Pill>}
                />
                {series.length ? <AreaChart data={series} height={210} /> : <div className="state-inline">Aucun encaissement enregistré.</div>}
              </Card>

              <Card className="rise" style={{ animationDelay: '140ms' }}>
                <CardHead title="Moyens de paiement" sub="Répartition des encaissements" />
                <MoneyBars
                  currency={currency}
                  items={byMethod.map((row) => ({
                    label: PAYMENT_METHODS[row.method] || row.method,
                    total: row.total,
                    hint: `${number(row.payments)} paiements`,
                  }))}
                />
                <div className="finance-note">
                  <Icon name="finance" size={14} />
                  <span>Les paiements validés mettent à jour le statut des factures automatiquement.</span>
                </div>
              </Card>
            </div>

            <div className="finance-grid">
              <Card className="rise" style={{ animationDelay: '180ms' }}>
                <CardHead title="Statut des factures" sub="Volume et montants" />
                {byStatus.length ? byStatus.map((row) => {
                  const entry = INVOICE_STATUS[row.status] || { label: row.status, tone: 'muted' };
                  return (
                    <div className="status-line" key={row.status}>
                      <span className={`status-dot tone-${entry.tone}`} />
                      <span className="status-line-main">
                        <b>{entry.label}</b>
                        <em>{number(row.count)} factures</em>
                      </span>
                      <span className="status-line-value mono">{money(row.total, currency)}</span>
                      <Progress value={kpis.invoiced ? (Number(row.total) / Number(kpis.invoiced)) * 100 : 0} height={3} />
                    </div>
                  );
                }) : <div className="state-inline">Aucune facture.</div>}
              </Card>

              <Card className="rise" style={{ animationDelay: '220ms' }}>
                <CardHead title="Par nature de frais" sub="Montants facturés" />
                <MoneyBars currency={currency} items={byFeeType.map((row) => ({ label: row.fee, total: row.invoiced, hint: row.code }))} />
              </Card>
            </div>

            <Card className="rise" style={{ animationDelay: '260ms' }}>
              <CardHead
                title="Principaux impayés"
                sub="Factures en retard à relancer"
                right={<Btn icon="external" onClick={() => setTab(1)}>Voir toutes les factures</Btn>}
              />
              <Table
                columns={['Élève', 'Facture', 'Montant', 'Solde', 'Échéance', '']}
                template="1.6fr 1fr .9fr .9fr .8fr 34px"
                foot={<><span className="tf-l">{topDebtors.length} dossiers prioritaires</span><span className="tf-r">{money(kpis.overdue || 0, currency)}</span></>}
              >
                {topDebtors.map((row) => (
                  <Tr key={row.invoice_id} template="1.6fr 1fr .9fr .9fr .8fr 34px">
                    <StudentCell student={row.student} sub={row.student?.school_class?.name} />
                    <span className="cell mono">{row.reference}</span>
                    <span className="cell mono">{money(row.amount, currency)}</span>
                    <span className="cell mono is-debt">{money(row.balance, currency)}</span>
                    <span className="cell mono">{date(row.due_on)}</span>
                    <span className="cell right cell-actions">
                      <ActionMenu actions={[
                        {
                          label: 'Encaisser',
                          icon: 'finance',
                          onClick: () => actions.payment(null, {
                            student_id: row.student?.id,
                            invoice_id: row.invoice_id,
                            amount: row.balance,
                          }),
                        },
                        { label: 'Voir la facture', icon: 'eye', onClick: () => actions.invoiceView({ id: row.invoice_id }) },
                        { label: 'Télécharger PDF', icon: 'download', onClick: () => actions.invoicePdf({ id: row.invoice_id }) },
                      ]} />
                    </span>
                  </Tr>
                ))}
              </Table>
            </Card>
          </>
        )}

        {tab === 1 && (
          <>
            <div className="toolbar rise">
              <div className="toolbar-group">
                <SearchInput value={invoiceQ} onChange={setInvoiceQ} placeholder="Référence, élève…" />
                <SelectFilter
                  label="Statut"
                  value={invoiceStatus}
                  onChange={setInvoiceStatus}
                  options={[{ value: '', label: 'Tous' }, ...Object.entries(INVOICE_STATUS).map(([value, item]) => ({ value, label: item.label }))]}
                />
                <SelectFilter
                  label="Classe"
                  value={invoiceClass}
                  onChange={setInvoiceClass}
                  options={[{ value: '', label: 'Toutes' }, ...classes.map((item) => ({ value: item.id, label: item.name }))]}
                />
                <button type="button" className={`filter-chip ${overdue ? 'on' : ''}`} onClick={() => setOverdue((value) => !value)}>
                  <Icon name="clock" size={12} />
                  En retard
                </button>
              </div>
              <div className="toolbar-right">
                <Btn icon="plus" solid onClick={openInvoice}>Créer une facture</Btn>
                <Btn icon="download" onClick={exportInvoices}>Exporter</Btn>
              </div>
            </div>

            <Card className="rise" style={{ animationDelay: '80ms' }}>
              <ListState
                loading={invoices.loading && !invoices.data}
                error={invoices.error}
                empty={!invoices.loading && !invoices.error && !invoiceRows.length}
                emptyTitle="Aucune facture trouvée"
                emptySub="Ajustez les filtres ou créez une nouvelle facture."
                onRetry={invoices.reload}
              >
                <Table
                  columns={['Référence', 'Élève', 'Montant', 'Payé', 'Solde', 'Statut', 'Échéance', '']}
                  template="1.1fr 1.6fr .9fr .8fr .9fr .8fr .8fr 34px"
                  foot={(
                    <>
                      <span className="tf-l">
                        {invoices.data?.from || 0}–{invoices.data?.to || 0} sur {number(invoices.data?.total || 0)}
                        <em className="tf-sub">Page : {money(pageInvoiced, currency)} facturé · {money(pageCollected, currency)} payé</em>
                      </span>
                      <Pager meta={invoices.data} onPage={setInvoicePage} />
                    </>
                  )}
                >
                  {invoiceRows.map((invoice) => (
                    <Tr key={invoice.id} template="1.1fr 1.6fr .9fr .8fr .9fr .8fr .8fr 34px">
                      <span className="cell mono">{invoice.reference}</span>
                      <StudentCell student={invoice.student} sub={`${invoice.student?.school_class?.name || '—'} · ${invoice.fee_type?.name || 'Frais'}`} />
                      <span className="cell mono">{money(invoice.amount, currency)}</span>
                      <span className="cell mono">{money(invoice.paid_amount || 0, currency)}</span>
                      <span className={`cell mono ${balanceOf(invoice) > 0 ? 'is-debt' : ''}`}>{money(balanceOf(invoice), currency)}</span>
                      <span className="cell"><InvoicePill status={invoice.status} /></span>
                      <span className="cell mono">{date(invoice.due_on)}</span>
                      <span className="cell right cell-actions">
                        <ActionMenu actions={[
                          {
                            label: balanceOf(invoice) > 0 ? 'Encaisser le solde' : 'Encaisser',
                            icon: 'finance',
                            onClick: () => actions.payment(null, {
                              student_id: invoice.student_id,
                              invoice_id: invoice.id,
                              amount: balanceOf(invoice) || invoice.amount,
                            }),
                          },
                          { label: 'Voir la facture', icon: 'eye', onClick: () => actions.invoiceView(invoice) },
                          { label: 'Télécharger PDF', icon: 'download', onClick: () => actions.invoicePdf(invoice) },
                          { label: 'Modifier', icon: 'edit', onClick: () => actions.invoice(invoice) },
                          { label: 'Supprimer', icon: 'trash', tone: 'danger', onClick: () => actions.deleteInvoice(invoice) },
                        ]} />
                      </span>
                    </Tr>
                  ))}
                </Table>
              </ListState>
              {invoices.loading && invoices.data && <div className="table-loading"><span className="spinner" /> Actualisation…</div>}
            </Card>
          </>
        )}

        {tab === 2 && (
          <>
            <div className="toolbar rise">
              <div className="toolbar-group">
                <SearchInput value={paymentQ} onChange={setPaymentQ} placeholder="Référence, élève…" />
                <SelectFilter
                  label="Statut"
                  value={paymentStatus}
                  onChange={setPaymentStatus}
                  options={[{ value: '', label: 'Tous' }, ...Object.entries(PAYMENT_STATUS).map(([value, item]) => ({ value, label: item.label }))]}
                />
                <SelectFilter
                  label="Moyen"
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  options={[{ value: '', label: 'Tous' }, ...Object.entries(PAYMENT_METHODS).map(([value, label]) => ({ value, label }))]}
                />
              </div>
              <div className="toolbar-right">
                <Btn icon="plus" solid onClick={openPayment}>Encaisser un paiement</Btn>
                <Btn icon="download" onClick={exportPayments}>Exporter</Btn>
              </div>
            </div>

            <Card className="rise" style={{ animationDelay: '80ms' }}>
              <ListState
                loading={payments.loading && !payments.data}
                error={payments.error}
                empty={!payments.loading && !payments.error && !paymentRows.length}
                emptyTitle="Aucun paiement trouvé"
                emptySub="Modifiez les filtres ou enregistrez un encaissement."
                onRetry={payments.reload}
              >
                <Table
                  columns={['Référence', 'Élève', 'Facture', 'Moyen', 'Montant', 'Date', 'Statut', '']}
                  template="1.1fr 1.6fr 1.2fr .9fr .9fr .8fr .8fr 34px"
                  foot={(
                    <>
                      <span className="tf-l">
                        {payments.data?.from || 0}–{payments.data?.to || 0} sur {number(payments.data?.total || 0)}
                        <em className="tf-sub">{money(pageBalance, currency)} de solde sur les factures liées</em>
                      </span>
                      <Pager meta={payments.data} onPage={setPaymentPage} />
                    </>
                  )}
                >
                  {paymentRows.map((payment) => (
                    <Tr key={payment.id} template="1.1fr 1.6fr 1.2fr .9fr .9fr .8fr .8fr 34px">
                      <span className="cell mono">{payment.reference || `PAY-${payment.id}`}</span>
                      <StudentCell student={payment.student} sub={payment.student?.school_class?.name} />
                      <span className="cell mono">{payment.invoice?.reference || 'Paiement libre'}</span>
                      <span className="cell">{PAYMENT_METHODS[payment.method] || payment.method || '—'}</span>
                      <span className="cell mono">{money(payment.amount, currency)}</span>
                      <span className="cell mono">{date(payment.paid_on)}</span>
                      <span className="cell"><PaymentPill status={payment.status} /></span>
                      <span className="cell right cell-actions">
                        <ActionMenu actions={[
                          { label: 'Modifier', icon: 'edit', onClick: () => actions.payment(payment) },
                          { label: 'Supprimer', icon: 'trash', tone: 'danger', onClick: () => actions.deletePayment(payment) },
                        ]} />
                      </span>
                    </Tr>
                  ))}
                </Table>
              </ListState>
              {payments.loading && payments.data && <div className="table-loading"><span className="spinner" /> Actualisation…</div>}
            </Card>
          </>
        )}
      </ListState>
    </>
  );
}
