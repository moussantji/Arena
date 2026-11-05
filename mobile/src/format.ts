/** Utilitaires de formatage (dates, montants, noms) en français. */

const dtf = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const dtfTime = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
const nfMoney0 = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XOF',
  currencyDisplay: 'code',
  maximumFractionDigits: 0,
});

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return dtf.format(date);
}

export function formatTime(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 5);

  return dtfTime.format(date);
}

/** Heure courte type "08:00". */
export function formatHour(value?: string | null): string {
  if (!value) return '';

  return String(value).slice(0, 5);
}

export function money(amount?: number | null): string {
  const value = Number(amount ?? 0);

  return nfMoney0.format(Number.isFinite(value) ? value : 0);
}

export function fullName(person?: { first_name?: string | null; last_name?: string | null; name?: string | null } | null): string {
  if (!person) return '—';
  if (person.name) return person.name;

  return [person.first_name, person.last_name].filter(Boolean).join(' ').trim() || '—';
}

export function initials(name?: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function evaluationLabel(evaluation?: string | null): string {
  switch (evaluation) {
    case 'devoir_1':
      return 'Devoir 1';
    case 'devoir_2':
      return 'Devoir 2';
    case 'composition':
      return 'Composition';
    default:
      return evaluation ?? '—';
  }
}

export function invoiceStatusLabel(status?: string | null): string {
  switch (status) {
    case 'paid':
      return 'Payée';
    case 'partial':
      return 'Partielle';
    case 'pending':
      return 'En attente';
    case 'overdue':
      return 'En retard';
    case 'cancelled':
      return 'Annulée';
    default:
      return status ?? '—';
  }
}

export function paymentMethodLabel(method?: string | null): string {
  switch (method) {
    case 'cash':
      return 'Espèces';
    case 'bank_transfer':
      return 'Virement bancaire';
    case 'mobile_money':
      return 'Mobile money';
    case 'check':
      return 'Chèque';
    default:
      return method ?? '—';
  }
}

/** Date ISO (YYYY-MM-DD) du jour local. */
export function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Tronque proprement un libellé. */
export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;

  return `${value.slice(0, Math.max(0, max - 1))}…`;
}
