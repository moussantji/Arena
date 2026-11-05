import React, { useEffect, useState } from 'react';
import {
  Card, Pill, Table, Tr,
} from '../ui.jsx';
import {
  useApi, useDebounced, dateTime, number,
} from '../data.jsx';
import {
  ListState, Pager, SearchInput, SelectFilter,
} from '../forms.jsx';
import { PageHead } from './common.jsx';

/* ============================================================
   Kalanso — Journal d’audit
   Traçabilité des actions sensibles (réservé à la Direction) :
   notes, absences, paiements, factures, comptes, périodes…
   ============================================================ */

const TYPE_OPTIONS = [
  { value: '', label: 'Tous les objets' },
  { value: 'Grade', label: 'Notes' },
  { value: 'Absence', label: 'Absences' },
  { value: 'Payment', label: 'Paiements' },
  { value: 'Invoice', label: 'Factures' },
  { value: 'User', label: 'Comptes' },
  { value: 'School', label: 'Établissement' },
  { value: 'Term', label: 'Périodes' },
  { value: 'AcademicYear', label: 'Années scolaires' },
  { value: 'Department', label: 'Départements' },
  { value: 'FeeType', label: 'Types de frais' },
];

const ACTION_OPTIONS = [
  { value: '', label: 'Tous les événements' },
  { value: 'grade', label: 'Notes' },
  { value: 'absence', label: 'Absences' },
  { value: 'payment', label: 'Paiements' },
  { value: 'invoice', label: 'Factures' },
  { value: 'user', label: 'Comptes' },
  { value: 'school', label: 'Établissement' },
  { value: 'term', label: 'Périodes' },
  { value: 'year', label: 'Années' },
  { value: 'department', label: 'Départements' },
  { value: 'fee_type', label: 'Types de frais' },
  { value: 'setup', label: 'Installation' },
];

const ACTION_LABELS = {
  'grade.created': 'Note saisie',
  'grade.updated': 'Note modifiée',
  'grade.deleted': 'Note supprimée',
  'absence.created': 'Absence enregistrée',
  'absence.updated': 'Absence modifiée',
  'absence.justified': 'Absence justifiée',
  'absence.deleted': 'Absence supprimée',
  'payment.created': 'Paiement encaissé',
  'payment.updated': 'Paiement modifié',
  'payment.deleted': 'Paiement supprimé',
  'invoice.created': 'Facture émise',
  'invoice.updated': 'Facture modifiée',
  'invoice.deleted': 'Facture supprimée',
  'user.created': 'Compte créé',
  'user.updated': 'Compte modifié',
  'user.deleted': 'Compte supprimé',
  'school.updated': 'Établissement modifié',
  'year.created': 'Année créée',
  'year.updated': 'Année modifiée',
  'year.deleted': 'Année supprimée',
  'term.created': 'Période créée',
  'term.updated': 'Période modifiée',
  'term.deleted': 'Période supprimée',
  'term.locked': 'Période délibérée',
  'term.unlocked': 'Période rouverte',
  'department.created': 'Département créé',
  'department.updated': 'Département modifié',
  'department.deleted': 'Département supprimé',
  'fee_type.created': 'Type de frais créé',
  'fee_type.updated': 'Type de frais modifié',
  'fee_type.deleted': 'Type de frais supprimé',
  'setup.completed': 'Installation initiale',
};

const toneFor = (action) => {
  if (/\.deleted$/.test(action)) return 'danger';
  if (/\.(locked|unlocked)$/.test(action)) return 'copper';
  if (/\.(created|completed)$/.test(action)) return 'accent';
  return 'glass';
};

export function Journal() {
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const search = useDebounced(q);

  useEffect(() => { setPage(1); }, [search, type, action, from, to]);

  const { data, loading, error, reload } = useApi('/audit-logs', {
    page,
    per_page: 15,
    subject_type: type || undefined,
    action: action || undefined,
    q: search || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  const rows = data?.data || [];

  return (
    <>
      <PageHead
        id="journal"
        sub="Qui a fait quoi, quand — notes, absences, paiements, comptes et périodes."
        secondary={null}
      />

      <Card className="rise">
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <div className="toolbar-group">
            <SearchInput value={q} onChange={setQ} placeholder="Détail, utilisateur…" />
            <SelectFilter label="Objet" value={type} onChange={setType} options={TYPE_OPTIONS} />
            <SelectFilter label="Événement" value={action} onChange={setAction} options={ACTION_OPTIONS} />
            <input className="input" type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="Du" />
            <input className="input" type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="Au" />
            {(q || type || action || from || to) && (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setQ(''); setType(''); setAction(''); setFrom(''); setTo('');
                }}
              >
                Effacer
              </button>
            )}
          </div>
        </div>
      </Card>

      <Card className="rise" style={{ animationDelay: '60ms', marginTop: 14 }}>
        <ListState
          loading={loading && !data}
          error={error}
          empty={!loading && !error && !rows.length}
          emptyTitle="Aucune écriture"
          emptySub="Les actions sensibles (notes, paiements, comptes, verrouillage des périodes…) apparaîtront ici."
          onRetry={reload}
        >
          <Table
            columns={['Date et heure', 'Utilisateur', 'Événement', 'Détail']}
            template="1fr 1.1fr 1.15fr 3fr"
            foot={(
              <>
                <span className="tf-l">
                  {data?.from || 0}–{data?.to || 0} sur {number(data?.total || 0)} écritures
                  <em className="tf-sub">Direction uniquement · les consultations ne sont pas journalisées</em>
                </span>
                <Pager meta={data} onPage={setPage} />
              </>
            )}
          >
            {rows.map((entry) => (
              <Tr key={entry.id} template="1fr 1.1fr 1.15fr 3fr">
                <span className="cell mono">{dateTime(entry.created_at)}</span>
                <span className="cell">{entry.user_name || 'Système'}</span>
                <span className="cell"><Pill tone={toneFor(entry.action)}>{ACTION_LABELS[entry.action] || entry.action}</Pill></span>
                <span className="cell">{entry.description}</span>
              </Tr>
            ))}
          </Table>
        </ListState>
      </Card>
    </>
  );
}
