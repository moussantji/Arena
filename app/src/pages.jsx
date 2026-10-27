import React from 'react';
import {
  Icon, Avatar, Pill, Btn, IconBtn, Card, CardHead, SectionTitle, Progress, Field,
  Toggle, Tabs, Stat, Kpi, Sparkline, AreaChart, BarChart, Donut, HBarList, Table, Tr,
} from './ui.jsx';
import * as M from './mock.js';
import { useModals } from './modal.jsx';
import { Modales } from './modals-page.jsx';

/* ============================================================
   Pages — affichage pur (données statiques de mock.js)
   ============================================================ */

export const META = {
  dashboard: { label: 'Tableau de bord', group: 'Pilotage', crumb: ['Tableau de bord', 'Semestre 1'], title: 'Tableau de bord', sub: 'Lundi 27 octobre · 42 classes actives', primary: 'Nouvel élève', secondary: 'Exporter' },
  eleves: { label: 'Élèves', group: 'Pilotage', crumb: ['Élèves', 'Tous les élèves'], title: 'Élèves', sub: '1 284 élèves · 42 classes', primary: 'Nouvel élève', secondary: 'Importer' },
  classes: { label: 'Classes', group: 'Pilotage', crumb: ['Classes', 'Année 2025–2026'], title: 'Classes', sub: '42 classes · 1 284 élèves', primary: 'Créer une classe', secondary: 'Archiver' },
  'emploi-du-temps': { label: 'Emploi du temps', group: 'Pilotage', crumb: ['Emploi du temps', 'Semaine 44'], title: 'Emploi du temps', sub: 'Semaine du 27 octobre au 1er novembre', primary: 'Ajouter un cours', secondary: 'Exporter l’ICS' },
  finances: { label: 'Finances', group: 'Gestion', crumb: ['Finances', 'Octobre 2026'], title: 'Finances', sub: 'Recouvrement · Exercice 2026', primary: 'Enregistrer un paiement', secondary: 'Exporter' },
  personnel: { label: 'Personnel', group: 'Gestion', crumb: ['Personnel', 'Enseignants'], title: 'Personnel', sub: '68 membres · 42 enseignants', primary: 'Ajouter un membre', secondary: 'Annuaire' },
  messagerie: { label: 'Messagerie', group: 'Gestion', crumb: ['Messagerie', 'Boîte de réception'], title: 'Messagerie', sub: '4 conversations · 2 non lus', primary: 'Nouveau message', secondary: 'Tout marquer lu' },
  notes: { label: 'Notes', group: 'Pédagogie', crumb: ['Élèves', 'Notes · Trimestre 1'], title: 'Notes', sub: 'Terminale S · Trimestre 1 · 32 élèves', primary: 'Saisir les notes', secondary: 'Bulletins' },
  absences: { label: 'Absences', group: 'Pédagogie', crumb: ['Élèves', 'Absences · Octobre'], title: 'Absences', sub: 'Octobre 2026 · 96,8 % de présence', primary: 'Justifier une absence', secondary: 'Exporter' },
  fiche: { label: 'Fiche élève', group: 'Pédagogie', crumb: ['Élèves', 'Fiche élève'], title: 'Aminata Traoré', sub: 'Terminale S · Matricule 2026-0142', secondary: 'Message' },
  admissions: { label: 'Admissions', group: 'Pédagogie', crumb: ['Admissions', 'Rentrée 2026'], title: 'Admissions', sub: 'Rentrée 2026 · 128 dossiers en cours', primary: 'Nouveau dossier', secondary: 'Exporter' },
  modales: { label: 'Modales', group: 'Système', crumb: ['Système', 'Modales'], title: 'Modales', sub: 'Formulaires, confirmations, panneaux latéraux' },
  parametres: { label: 'Paramètres', group: 'Système', crumb: ['Paramètres', 'Établissement'], title: 'Paramètres', sub: 'Établissement · Compte · Notifications', primary: 'Enregistrer', secondary: 'Réinitialiser' },
};

/* ---------- helpers de présentation ---------- */
const statusTone = (s) =>
  s === 'À jour' || s === 'Payé' || s === 'Justifié' ? 'accent'
  : s === 'Boursier' ? 'copper'
  : 'muted';

const tagTone = (t) =>
  t === 'Excellent' ? 'accent' : t === 'Insuffisant' ? 'danger' : 'muted';

/* ============================================================
   1 · Tableau de bord
   ============================================================ */
export function Dashboard() {
  const modals = useModals();
  return (
    <>
      <div className="kpis">
        {M.kpis.map((k, i) => <Kpi key={k.key} item={k} index={i} />)}
      </div>

      <div className="grid-main">
        <Card className="rise" style={{ animationDelay: '120ms' }}>
          <CardHead
            title="Recouvrement mensuel"
            sub="Exercice 2026 · en millions de FCFA"
            right={<Tabs items={['12 mois', '6 mois', '3 mois']} active={0} />}
          />
          <AreaChart data={M.recoverySeries} />
        </Card>

        <Card className="rise" style={{ animationDelay: '180ms' }}>
          <CardHead title="Aujourd’hui" sub="3 cours · Terminale S" right={<Pill tone="accent" dot>En cours</Pill>} />
          <ul className="today">
            {M.today.map((t) => (
              <li key={t.time}>
                <Avatar initials={t.who} tone={t.tone} size={30} />
                <span className="today-main">
                  <b>{t.subject}</b>
                  <em>{t.room}</em>
                </span>
                <span className="today-time">{t.time}</span>
              </li>
            ))}
          </ul>
          <div className="today-foot">
            <Progress value={62} height={3} />
            <span>62 % de la journée</span>
          </div>
        </Card>
      </div>

      <Card className="rise" style={{ animationDelay: '240ms' }}>
        <CardHead
          title="Élèves récents"
          sub="1 284 élèves inscrits"
          right={<Btn icon="external" onClick={() => modals.exportData()}>Tout voir</Btn>}
        />
        <Table
          columns={['Élève', 'Classe', 'Statut', 'Moyenne', 'Solde', '']}
          template="1.7fr .9fr .9fr .7fr 1fr 34px"
          foot={<><span className="tf-l">1–6 sur 1 284</span><span className="tf-r">Page 1 / 214</span></>}
        >
          {M.students.map((s) => (
            <Tr key={s.ref} template="1.7fr .9fr .9fr .7fr 1fr 34px">
              <span className="cell-who">
                <Avatar initials={s.who} size={28} />
                <span><b>{s.name}</b><em>{s.ref}</em></span>
              </span>
              <span className="cell">{s.cls}</span>
              <span className="cell"><Pill tone={statusTone(s.status)}>{s.status}</Pill></span>
              <span className="cell mono">{s.avg}</span>
              <span className="cell mono right">{s.balance}</span>
              <span className="cell right">
                <IconBtn icon="dots" title="Actions" onClick={() => modals.drawer(s)} />
              </span>
            </Tr>
          ))}
        </Table>
      </Card>
    </>
  );
}

/* ============================================================
   2 · Élèves
   ============================================================ */
export function Eleves() {
  const modals = useModals();
  return (
    <>
      <div className="toolbar rise">
        <Tabs items={['Tous', 'Terminale', 'Première', 'Seconde', 'Boursiers']} active={0} />
        <div className="toolbar-right">
          <span className="toolbar-count">1 284 résultats</span>
          <Btn icon="filter">Filtres</Btn>
        </div>
      </div>

      <Card className="rise" style={{ animationDelay: '80ms' }}>
        <Table
          columns={['Élève', 'Classe', 'Statut', 'Moyenne', 'Solde', '']}
          template="1.8fr .9fr .9fr .7fr 1fr 34px"
          foot={<><span className="tf-l">1–6 sur 1 284</span><span className="tf-r">Page 1 / 214</span></>}
        >
          {M.students.map((s) => (
            <Tr key={s.ref} template="1.8fr .9fr .9fr .7fr 1fr 34px">
              <span className="cell-who">
                <Avatar initials={s.who} size={30} />
                <span><b>{s.name}</b><em>{s.cls} · {s.ref}</em></span>
              </span>
              <span className="cell">{s.cls}</span>
              <span className="cell"><Pill tone={statusTone(s.status)}>{s.status}</Pill></span>
              <span className="cell mono">{s.avg}</span>
              <span className="cell mono right">{s.balance}</span>
              <span className="cell right">
                <IconBtn icon="dots" title="Actions" onClick={() => modals.drawer(s)} />
              </span>
            </Tr>
          ))}
        </Table>
      </Card>
    </>
  );
}

/* ============================================================
   3 · Classes
   ============================================================ */
export function Classes() {
  return (
    <>
      <div className="stats-row rise">
        <Stat value="42" label="Classes" />
        <Stat value="31,2" label="Élèves / classe" />
        <Stat value="96,8 %" label="Taux d’occupation" tone="accent" />
        <Stat value="6" label="Terminales" />
      </div>

      <div className="cards-grid">
        {M.classes.map((c, i) => (
          <Card key={c.name} className={`class-card rise ${c.active ? 'active' : ''}`} style={{ animationDelay: `${i * 60}ms` }}>
            <div className="class-head">
              <h3>{c.name}</h3>
              {c.active && <Pill tone="accent">Active</Pill>}
            </div>
            <div className="class-count">
              <span>Effectif</span>
              <b className="mono">{c.effectif} <em>/ {c.cap}</em></b>
            </div>
            <Progress value={(c.effectif / c.cap) * 100} height={3} />
            <div className="class-foot">
              <span className="avatars">
                {['AM', 'IK', 'FD'].map((w) => <Avatar key={w} initials={w} size={22} tone="muted" />)}
              </span>
              <span className="class-teacher">{c.teacher}</span>
              <IconBtn icon="dots" title="Actions" />
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

/* ============================================================
   4 · Emploi du temps
   ============================================================ */
export function EmploiDuTemps() {
  const tone = { a: 'slot-a', b: 'slot-b', c: 'slot-c' };
  return (
    <>
      <div className="toolbar rise">
        <Tabs items={['Terminale S', 'Terminale L', 'Première S', 'Toutes']} active={0} />
        <div className="toolbar-right">
          <div className="week-nav">
            <IconBtn icon="chevronL" title="Semaine précédente" />
            <span className="mono">Semaine 44</span>
            <IconBtn icon="chevronR" title="Semaine suivante" />
          </div>
          <Btn>Semaine</Btn>
        </div>
      </div>

      <Card className="rise timetable-card" pad={false} style={{ animationDelay: '80ms' }}>
        <div className="tt-grid">
          <div className="tt-corner" />
          {M.days.map((d, i) => (
            <div key={d} className={`tt-day ${i === 3 ? 'today' : ''}`}>
              {d}
              {i === 3 && <i className="tt-today-dot" />}
            </div>
          ))}

          {M.hours.map((h, row) => (
            <React.Fragment key={h}>
              <div className="tt-hour mono">{h}</div>
              {M.days.map((_, col) => {
                const slot = M.timetable.find((s) => s.d === col && s.h === row);
                return (
                  <div className="tt-cell" key={`${row}-${col}`}>
                    {slot && (
                      <div className={`tt-slot ${tone[slot.tone]} ${slot.live ? 'live' : ''}`}>
                        <b>{slot.subject}</b>
                        <span className="mono">{slot.room}</span>
                      </div>
                    )}
                    {slot?.live && <span className="tt-now" />}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </Card>

      <div className="legend rise">
        <span><i className="lg-a" />Mathématiques</span>
        <span><i className="lg-b" />Sciences</span>
        <span><i className="lg-c" />Lettres</span>
        <span className="legend-now"><i />Cours en cours</span>
      </div>
    </>
  );
}

/* ============================================================
   5 · Finances
   ============================================================ */
export function Finances() {
  const modals = useModals();
  return (
    <>
      <div className="kpis three">
        <Kpi item={{ label: 'Recouvrement', value: '8,45 M', unit: 'FCFA', spark: [22, 30, 27, 38, 35, 47, 44, 56, 52, 68], hint: 'exercice 2026' }} index={0} />
        <Kpi item={{ label: 'Impayés', value: '420 000', unit: 'FCFA', hint: '24 dossiers', dot: true }} index={1} />
        <Kpi item={{ label: 'Taux de recouvrement', value: '92,4 %', progress: 92.4, hint: '+1,8 pt vs septembre' }} index={2} />
      </div>

      <div className="grid-main">
        <Card className="rise" style={{ animationDelay: '120ms' }}>
          <CardHead title="Recouvrement mensuel" sub="En millions de FCFA" right={<Tabs items={['2026', '2025']} active={0} />} />
          <AreaChart data={M.recoverySeries} height={200} />
        </Card>

        <Card className="rise" style={{ animationDelay: '180ms' }}>
          <CardHead title="Répartition" sub="Par nature de frais" />
          <Donut
            parts={[
              { label: 'Scolarité', v: 58, color: '#5B7CFA' },
              { label: 'Cantine', v: 24, color: '#7E9BFF' },
              { label: 'Transport', v: 12, color: '#E0A86F' },
              { label: 'Autres', v: 6, color: 'rgba(167,182,255,.35)' },
            ]}
          />
        </Card>
      </div>

      <Card className="rise" style={{ animationDelay: '240ms' }}>
        <CardHead title="Derniers paiements" sub="Octobre 2026" right={<Btn icon="plus" solid onClick={() => modals.payment()}>Encaisser</Btn>} />
        <Table
          columns={['Élève', 'Motif', 'Date', 'Montant', 'Statut']}
          template="1.5fr 1.2fr .8fr 1fr .8fr"
          foot={<><span className="tf-l">1–5 sur 316</span><span className="tf-r">Page 1 / 64</span></>}
        >
          {M.payments.map((p, i) => (
            <Tr key={i} template="1.5fr 1.2fr .8fr 1fr .8fr">
              <span className="cell-who">
                <Avatar initials={p.who.split(' ').map((w) => w[0]).join('').slice(0, 2)} size={28} tone="muted" />
                <span><b>{p.who}</b></span>
              </span>
              <span className="cell">{p.ref}</span>
              <span className="cell mono">{p.date}</span>
              <span className="cell mono">{p.amount}</span>
              <span className="cell"><Pill tone={statusTone(p.status)}>{p.status}</Pill></span>
            </Tr>
          ))}
        </Table>
      </Card>
    </>
  );
}

/* ============================================================
   6 · Personnel
   ============================================================ */
export function Personnel() {
  const modals = useModals();
  return (
    <>
      <div className="stats-row rise">
        <Stat value="68" label="Membres" />
        <Stat value="42" label="Enseignants" tone="accent" />
        <Stat value="96 %" label="Présence" />
        <Stat value="12" label="Années d’ancienneté moyenne" />
      </div>

      <div className="toolbar rise">
        <Tabs items={['Tous', 'Enseignants', 'Administration', 'Support']} active={0} />
      </div>

      <div className="cards-grid staff-grid">
        {M.staff.map((s, i) => (
          <Card key={s.name} className="staff-card rise" style={{ animationDelay: `${i * 55}ms` }}>
            <Avatar initials={s.who} size={56} tone={i % 2 ? 'copper' : 'accent'} />
            <h3>{s.name}</h3>
            <p>{s.role}</p>
            <div className="staff-tags">
              {s.tags.map((t) => <Pill key={t} tone="muted">{t}</Pill>)}
            </div>
            <div className="staff-actions">
              <Btn icon="messages" onClick={() => modals.message()}>Message</Btn>
              <Btn icon="profile" onClick={() => open(StudentDrawer({ name: s.name, ref: 'Personnel · 2026', cls: s.role, who: s.who, status: 'Actif', avg: '—', balance: '—' }))}>Profil</Btn>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

/* ============================================================
   7 · Notes
   ============================================================ */
export function Notes() {
  const modals = useModals();
  return (
    <>
      <div className="stats-row rise">
        <Stat value="12,8 / 20" label="Moyenne de classe" tone="accent" />
        <Stat value="18,4" label="Meilleure moyenne" />
        <Stat value="12,1" label="Médiane" />
        <Stat value="6,2 %" label="Sous la moyenne" />
      </div>

      <div className="grid-main">
        <Card className="rise" style={{ animationDelay: '100ms' }}>
          <CardHead title="Évolution de la moyenne" sub="Trimestre 1 · 32 élèves" right={<Tabs items={['Devoirs', 'Composition']} active={0} />} />
          <AreaChart data={M.recoverySeries.slice(1)} height={190} />
        </Card>

        <Card className="rise" style={{ animationDelay: '150ms' }}>
          <CardHead title="Répartition" sub="Tranches de notes" />
          <HBarList
            items={[
              { label: '0–5', v: 8 }, { label: '5–10', v: 22 }, { label: '10–15', v: 46 },
              { label: '15–18', v: 20 }, { label: '18–20', v: 4 },
            ]}
          />
        </Card>
      </div>

      <Card className="rise" style={{ animationDelay: '200ms' }}>
        <CardHead title="Notes · Terminale S" sub="Trimestre 1" right={<Btn icon="download" onClick={() => modals.exportData()}>Exporter</Btn>} />
        <Table
          columns={['Élève', 'Devoir 1', 'Devoir 2', 'Composition', 'Moyenne', 'Appréciation']}
          template="1.6fr .7fr .7fr .9fr .7fr 1fr"
          foot={<><span className="tf-l">32 élèves</span><span className="tf-r">Moyenne 12,80</span></>}
        >
          {M.grades.map((g) => (
            <Tr key={g.who} template="1.6fr .7fr .7fr .9fr .7fr 1fr">
              <span className="cell-who">
                <Avatar initials={g.who.split(' ').map((w) => w[0]).join('').slice(0, 2)} size={28} tone="muted" />
                <span><b>{g.who}</b></span>
              </span>
              <span className="cell mono">{g.d1.toFixed(1)}</span>
              <span className="cell mono">{g.d2.toFixed(1)}</span>
              <span className="cell mono">{g.comp.toFixed(1)}</span>
              <span className="cell mono strong">{g.avg}</span>
              <span className="cell"><Pill tone={tagTone(g.tag)}>{g.tag}</Pill></span>
            </Tr>
          ))}
        </Table>
      </Card>
    </>
  );
}

/* ============================================================
   8 · Absences
   ============================================================ */
export function Absences() {
  const modals = useModals();
  const firstOffset = 2; /* présentation : le mois commence un mardi */
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <>
      <div className="stats-row rise">
        <Stat value="96,8 %" label="Présence" tone="accent" />
        <Stat value="42" label="Absences" />
        <Stat value="12" label="Justificatifs" />
        <Stat value="4" label="Non justifiées" tone="copper" />
      </div>

      <div className="grid-main">
        <Card className="rise" style={{ animationDelay: '100ms' }}>
          <CardHead title="Octobre 2026" sub="Calendrier de présence" right={<IconBtn icon="chevronR" title="Mois suivant" />} />
          <div className="cal">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span className="cal-dow" key={i}>{d}</span>)}
            {Array.from({ length: firstOffset }).map((_, i) => <span key={`e${i}`} />)}
            {days.map((d) => {
              const tone = d === 10 ? 'today' : [3, 7, 18, 26].includes(d) ? 'abs' : [4, 11, 24].includes(d) ? 'late' : 'ok';
              return (
                <span key={d} className={`cal-day ${tone}`}>
                  {d}
                  <i />
                </span>
              );
            })}
          </div>
        </Card>

        <Card className="rise" style={{ animationDelay: '150ms' }}>
          <CardHead title="Motifs" sub="Octobre 2026" />
          <HBarList items={M.motivations} />
        </Card>
      </div>

      <Card className="rise" style={{ animationDelay: '200ms' }}>
        <CardHead title="Dernières absences" sub="5 enregistrements" right={<Btn icon="plus" solid onClick={() => modals.absence()}>Justifier</Btn>} />
        <Table columns={['Élève', 'Classe', 'Date', 'Statut', '']} template="1.6fr 1fr .8fr .9fr 34px">
          {M.absences.map((a) => (
            <Tr key={a.who} template="1.6fr 1fr .8fr .9fr 34px">
              <span className="cell-who">
                <Avatar initials={a.who.split(' ').map((w) => w[0]).join('').slice(0, 2)} size={28} tone="muted" />
                <span><b>{a.who}</b></span>
              </span>
              <span className="cell">{a.cls}</span>
              <span className="cell mono">{a.date}</span>
              <span className="cell">
                <Pill tone={a.justified ? 'accent' : 'copper'}>{a.justified ? 'Justifié' : 'Non justifié'}</Pill>
              </span>
              <span className="cell right">
                <IconBtn icon="dots" title="Actions" onClick={() => modals.absence()} />
              </span>
            </Tr>
          ))}
        </Table>
      </Card>
    </>
  );
}

/* ============================================================
   9 · Fiche élève
   ============================================================ */
export function Fiche() {
  const modals = useModals();
  const p = M.studentProfile;
  return (
    <>
      <Card className="rise profile-head">
        <Avatar initials="AT" size={64} />
        <div className="ph-main">
          <h2>{p.name}</h2>
          <span>{p.ref}</span>
          <div className="ph-chips">
            {p.chips.map((c, i) => <Pill key={c} tone={i === 2 ? 'accent' : 'muted'}>{c}</Pill>)}
          </div>
        </div>
        <div className="ph-actions">
          <Btn icon="messages" onClick={() => modals.message()}>Message</Btn>
          <Btn icon="profile" solid onClick={() => modals.student()}>Modifier</Btn>
        </div>
      </Card>

      <div className="grid-main">
        <div className="stack">
          <Card className="rise" style={{ animationDelay: '80ms' }}>
            <CardHead title="Informations" sub="Dossier scolaire" />
            <dl className="dl">
              {p.info.map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          </Card>

          <Card className="rise" style={{ animationDelay: '140ms' }}>
            <CardHead title="Documents" sub="3 fichiers" />
            <ul className="docs">
              {M.documents.map((d) => (
                <li key={d.name}>
                  <span className="doc-ic"><Icon name="download" size={14} /></span>
                  <span><b>{d.name}</b><em>{d.meta}</em></span>
                  <IconBtn icon="download" title="Télécharger" />
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="stack">
          <Card className="rise" style={{ animationDelay: '100ms' }}>
            <CardHead title="Assiduité" sub="30 derniers jours" right={<Pill tone="accent">{p.attendance} %</Pill>} />
            <Progress value={p.attendance} height={4} />
            <div className="strip">
              {p.strip.map((s, i) => <i key={i} className={s} />)}
            </div>
          </Card>

          <Card className="rise" style={{ animationDelay: '160ms' }}>
            <CardHead title="Notes du trimestre" sub="5 matières" right={<b className="avg-big mono">12,8</b>} />
            <ul className="notes-list">
              {p.notes.map(([label, v]) => (
                <li key={label}>
                  <span>{label}</span>
                  <span className="note-bar"><Progress value={(v / 20) * 100} height={3} /></span>
                  <b className="mono">{v.toFixed(1)}</b>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   10 · Admissions (kanban)
   ============================================================ */
export function Admissions() {
  const modals = useModals();
  return (
    <>
      <div className="stats-row rise">
        <Stat value="128" label="Dossiers ouverts" />
        <Stat value="64" label="Validés" tone="accent" />
        <Stat value="12" label="En attente" tone="copper" />
        <Stat value="41" label="Entretiens planifiés" />
      </div>

      <div className="kanban">
        {M.admissions.map((col, i) => (
          <div className="kb-col rise" key={col.col} style={{ animationDelay: `${i * 70}ms` }}>
            <div className="kb-head">
              <span>{col.col}</span>
              <em className="mono">{col.v}</em>
            </div>
            <div className="kb-body">
              {col.cards.map((c) => (
                <Card
                  key={c.ref}
                  className={`kb-card ${c === col.cards[1] ? 'lifted' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="kb-top">
                    <Avatar initials={c.who.split(' ').map((w) => w[0]).join('').slice(0, 2)} size={26} tone="muted" />
                    <span><b>{c.who}</b><em>{c.cls} · 2026</em></span>
                  </div>
                  <div className="kb-foot">
                    <span className="mono">{c.ref}</span>
                    <IconBtn icon="dots" title="Actions" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ============================================================
   11 · Messagerie
   ============================================================ */
export function Messagerie() {
  const modals = useModals();
  return (
    <Card className="rise messenger" pad={false}>
      <div className="msg-list">
        <div className="msg-list-head">
          <span>Conversations</span>
          <IconBtn icon="filter" title="Filtrer" />
        </div>
        {M.threads.map((t) => (
          <button key={t.who} type="button" className={`msg-thread ${t.active ? 'active' : ''}`}>
            <Avatar initials={t.who.replace('Mme ', '').replace('M. ', '').split(' ').map((w) => w[0]).join('').slice(0, 2)} size={30} tone="muted" />
            <span className="mt-main">
              <b>{t.who}</b>
              <em>{t.preview}</em>
            </span>
            <span className="mt-meta">
              <time className="mono">{t.time}</time>
              {t.unread && <i />}
            </span>
          </button>
        ))}
      </div>

      <div className="msg-pane">
        <div className="msg-head">
          <div>
            <b>Mme Traoré</b>
            <span>Parent de Aminata · Terminale S</span>
          </div>
          <div className="msg-head-actions">
            <Pill tone="accent">Dossier lié</Pill>
            <IconBtn icon="dots" title="Options" />
          </div>
        </div>

        <div className="msg-body">
          {M.messages.map((m, i) => (
            <div key={i} className={`bubble ${m.side}`}>
              <p>{m.text}</p>
              <time className="mono">{m.time}</time>
            </div>
          ))}
        </div>

        <div className="msg-compose">
          <IconBtn icon="plus" title="Joindre" />
          <input className="input" placeholder="Écrire un message…" readOnly />
          <Btn icon="chevronR" solid onClick={() => open(SuccessModal({ title: 'Message envoyé', sub: 'Mme Traoré recevra une notification.', rows: [['Destinataire', 'Mme Traoré'], ['Objet', 'Suivi de l’assiduité'], ['Envoi', 'maintenant']] }))}>Envoyer</Btn>
        </div>
      </div>
    </Card>
  );
}

/* ============================================================
   12 · Paramètres
   ============================================================ */
export function Parametres() {
  const modals = useModals();
  return (
    <div className="settings">
      <nav className="set-nav rise">
        {['Établissement', 'Année scolaire', 'Comptes', 'Notifications', 'Sauvegardes', 'Sécurité'].map((s, i) => (
          <button key={s} type="button" className={`set-item ${i === 0 ? 'active' : ''}`}>
            {s}
          </button>
        ))}
      </nav>

      <div className="stack set-main">
        <Card className="rise" style={{ animationDelay: '60ms' }}>
          <CardHead title="Établissement" sub="Informations publiques" />
          <div className="form-grid">
            <Field label="Nom de l’établissement" value="École Internationale Diallo" />
            <Field label="Adresse" value="Hamdallaye ACI 2000, Bamako" />
            <Field label="Téléphone" value="+223 20 00 00 00" />
            <Field label="E-mail" value="contact@diallo.ml" />
            <Field label="Devise">
              <span className="input select">FCFA</span>
            </Field>
            <Field label="Langue">
              <span className="input select">Français</span>
            </Field>
          </div>
          <div className="form-toggles">
            <Toggle on label="Notifications e-mail" />
            <Toggle label="Rappels de paiement" />
          </div>
        </Card>

        <Card className="rise" style={{ animationDelay: '120ms' }}>
          <CardHead title="Année scolaire" sub="2025 — 2026" right={<Btn icon="download">Exporter les données</Btn>} />
          <div className="form-grid two">
            <Field label="Début" value="01/09/2025" />
            <Field label="Fin" value="30/06/2026" />
          </div>
          <div className="danger-row">
            <span><b>Zone sensible</b><em>Réinitialiser les données de démonstration</em></span>
            <Btn
              icon="close"
              onClick={() => modals.confirm({
                title: 'Réinitialiser les données ?',
                body: <p className="mtext">Toutes les données de démonstration seront remplacées par le jeu initial. Les comptes réels ne sont pas concernés.</p>,
                confirmLabel: 'Réinitialiser',
              })}
            >
              Réinitialiser
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

export const PAGES = {
  dashboard: Dashboard,
  eleves: Eleves,
  classes: Classes,
  'emploi-du-temps': EmploiDuTemps,
  finances: Finances,
  personnel: Personnel,
  messagerie: Messagerie,
  notes: Notes,
  absences: Absences,
  fiche: Fiche,
  admissions: Admissions,
  modales: Modales,
  parametres: Parametres,
};
