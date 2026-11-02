import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar, Btn, Card, CardHead, Icon, Pill, Progress, Table, Tr, Tabs,
} from '../ui.jsx';
import {
  useApi, useData, number, money, date, time, fullName, initials, STUDENT_STATUS,
  INVOICE_STATUS, PAYMENT_STATUS, PAYMENT_METHODS, EVALUATIONS,
} from '../data.jsx';
import { useActions } from '../actions.jsx';
import { errorMessage } from '../api.js';
import { exportStudentReportWorkbook } from '../exports.js';
import {
  ActionMenu, ListState, SelectFilter,
} from '../forms.jsx';
import {
  PageHead, StudentCell, StatusPill, InvoicePill, PaymentPill, average,
} from './common.jsx';

const fileSize = (bytes) => {
  const value = Number(bytes || 0);
  if (value >= 1_000_000) return `${number(value / 1_000_000, 1)} Mo`;
  if (value >= 1_000) return `${number(value / 1_000, 0)} Ko`;
  return `${value} o`;
};

const scoreTone = (score) => {
  const value = Number(score || 0);
  if (value >= 15) return 'accent';
  if (value >= 10) return 'glass';
  return 'copper';
};

const evaluationScore = (subject, key) => {
  const grade = (subject.grades || []).find((entry) => entry.evaluation === key);
  return grade ? Number(grade.score) : null;
};

export function Fiche() {
  const {
    meta, studentId, setStudentId, version, notify,
  } = useData();
  const actions = useActions();
  const [tab, setTab] = useState(0);
  const [exportingReport, setExportingReport] = useState(false);
  const students = meta?.students || [];
  const currency = meta?.school?.currency || 'FCFA';

  useEffect(() => {
    if (!studentId && students.length) setStudentId(students[0].id);
  }, [studentId, students.length, setStudentId]);

  const profile = useApi(studentId ? `/students/${studentId}` : null, undefined, { enabled: Boolean(studentId) });
  const report = useApi(studentId ? `/students/${studentId}/report-card` : null, undefined, { enabled: Boolean(studentId) });
  const grades = useApi('/grades', { student_id: studentId || undefined, per_page: 100 }, { enabled: Boolean(studentId) });
  const absences = useApi('/absences', { student_id: studentId || undefined, per_page: 100 }, { enabled: Boolean(studentId) });
  const invoices = useApi('/invoices', { student_id: studentId || undefined, per_page: 100 }, { enabled: Boolean(studentId) });
  const payments = useApi('/payments', { student_id: studentId || undefined, per_page: 100 }, { enabled: Boolean(studentId) });
  const documents = useApi('/documents', { student_id: studentId || undefined, per_page: 100 }, { enabled: Boolean(studentId) });

  const student = profile.data?.student;
  const summary = profile.data?.summary || {};
  const reportData = report.data || {};
  const subjectRows = reportData.subjects || [];
  const gradeRows = grades.data?.data || [];
  const absenceRows = absences.data?.data || [];
  const invoiceRows = invoices.data?.data || [];
  const paymentRows = payments.data?.data || [];
  const documentRows = documents.data?.data || [];
  const status = STUDENT_STATUS[student?.status] || STUDENT_STATUS.a_jour;
  const classOptions = meta?.classes || [];

  const pendingAbsences = absenceRows.filter((absence) => !absence.is_justified);
  const invoiceBalance = invoiceRows.reduce((sum, invoice) => (
    sum + Math.max(0, Number(invoice.amount || 0) - Number(invoice.paid_amount || 0))
  ), 0);

  const movementRows = useMemo(() => {
    const paymentsList = paymentRows.slice(0, 4).map((payment) => ({
      id: `p-${payment.id}`,
      type: 'payment',
      label: `Paiement ${PAYMENT_METHODS[payment.method] || payment.method}`,
      sub: payment.invoice?.reference || 'Paiement libre',
      amount: Number(payment.amount || 0),
      date: payment.paid_on,
    }));
    const invoicesList = invoiceRows.slice(0, 4).map((invoice) => ({
      id: `i-${invoice.id}`,
      type: 'invoice',
      label: invoice.fee_type?.name || 'Facture',
      sub: invoice.reference,
      amount: -Number(invoice.amount || 0),
      date: invoice.issued_on,
    }));
    return [...paymentsList, ...invoicesList]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [paymentRows, invoiceRows]);

  const exportReport = async () => {
    if (!student || exportingReport) return;
    setExportingReport(true);
    try {
      const stats = absences.data?.stats || {};
      await exportStudentReportWorkbook(student, reportData, {
        schoolName: meta?.school?.name,
        yearName: meta?.academic_year?.label,
        termName: meta?.term?.name,
        absences: {
          total: Number(stats.total ?? absenceRows.length),
          unjustified: Number(stats.unjustified ?? pendingAbsences.length),
        },
      });
      notify(`Bulletin de ${fullName(student)} exporté.`, { tone: 'success' });
    } catch (error) {
      notify(errorMessage(error, 'Export du bulletin impossible.'), { tone: 'danger' });
    } finally {
      setExportingReport(false);
    }
  };

  const studentOptions = students.map((item) => ({
    value: item.id,
    label: `${fullName(item)} · ${item.matricule}`,
  }));

  if (!studentId) {
    return (
      <>
        <PageHead id="fiche" sub="Sélectionnez un élève pour ouvrir son dossier" secondary={null} />
        <div className="state-box state-empty">
          <span className="state-ic"><Icon name="profile" size={18} /></span>
          <b>Aucun élève sélectionné</b>
          <span>Choisissez un élève dans la liste ou ouvrez la page Élèves.</span>
          <div className="state-actions">
            <Btn icon="students" onClick={() => { window.location.hash = 'eleves'; }}>Parcourir les élèves</Btn>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead
        id="fiche"
        sub={student ? `${student.school_class?.name || 'Sans classe'} · ${student.matricule} · dossier ${meta?.academic_year?.label || ''}` : 'Chargement du dossier…'}
        primary="Modifier le dossier"
        secondary="Nouveau message"
        onPrimary={() => student && actions.student(student)}
        onSecondary={() => actions.thread()}
      />

      <div className="toolbar rise">
        <SelectFilter
          label="Élève"
          value={studentId || ''}
          onChange={(value) => { setStudentId(Number(value) || null); setTab(0); }}
          options={studentOptions}
        />
        <div className="toolbar-right">
          <Btn icon="finance" onClick={() => actions.invoice(null, { student_id: studentId })}>Créer une facture</Btn>
          <Btn icon="absences" onClick={() => actions.absence(null, { student_id: studentId, school_class_id: student?.school_class_id })}>Signaler une absence</Btn>
          <Btn icon="grades" solid onClick={() => actions.grade(null, { student_id: studentId, school_class_id: student?.school_class_id })}>Saisir une note</Btn>
        </div>
      </div>

      <ListState
        loading={profile.loading && !profile.data}
        error={profile.error}
        empty={!profile.loading && !profile.error && !student}
        emptyTitle="Dossier introuvable"
        emptySub="Cet élève n’existe plus ou a été retiré."
        onRetry={profile.reload}
      >
        {student && (
          <>
            <Card className="profile-head rise" pad={false}>
              <Avatar initials={student.initials || initials(fullName(student))} size={64} src={student.photo_url} />
              <div className="ph-main">
                <h2>{fullName(student)}</h2>
                <span>{student.matricule} · {student.school_class?.name || 'Sans classe'} · {student.email || 'sans e-mail'}</span>
                <div className="ph-chips">
                  <Pill tone={status.tone}>{status.label}</Pill>
                  <Pill tone="muted">{student.is_active ? 'Élève actif' : 'Dossier clôturé'}</Pill>
                  <Pill tone="copper">Moyenne {average(summary.average ?? reportData.general_average)}</Pill>
                  {summary.unjustified_absences > 0 && <Pill tone="danger">{summary.unjustified_absences} absences à justifier</Pill>}
                </div>
              </div>
              <div className="ph-actions">
                <Btn icon="download" onClick={exportReport}>Bulletin</Btn>
                <Btn icon="upload" onClick={() => actions.photo(student)}>Photo</Btn>
                <Btn icon="upload" onClick={() => actions.document(student)}>Document</Btn>
                <ActionMenu actions={[
                  { label: 'Modifier le dossier', icon: 'edit', onClick: () => actions.student(student) },
                  { label: 'Changer la photo', icon: 'upload', onClick: () => actions.photo(student) },
                  { label: 'Ajouter un document', icon: 'upload', onClick: () => actions.document(student) },
                  { label: 'Créer une facture', icon: 'finance', onClick: () => actions.invoice(null, { student_id: student.id }) },
                  { label: 'Retirer l’élève', icon: 'trash', tone: 'danger', onClick: () => actions.deleteStudent(student) },
                ]} />
              </div>
            </Card>

            <div className="kpis">
              <Card className="kpi rise" style={{ animationDelay: '50ms' }}>
                <div className="kpi-top"><span className="kpi-label">Moyenne générale</span><Pill tone="accent">{reportData.mention || 'En cours'}</Pill></div>
                <div className="kpi-value"><b>{average(summary.average ?? reportData.general_average)}</b><em>/ 20</em></div>
                <Progress value={((Number(summary.average ?? reportData.general_average) || 0) / 20) * 100} height={3} />
                <div className="kpi-foot"><span>Rang {reportData.rank || '—'} sur {reportData.class_size || '—'}</span></div>
              </Card>

              <Card className="kpi rise" style={{ animationDelay: '100ms' }}>
                <div className="kpi-top"><span className="kpi-label">Solde à régler</span>{invoiceBalance > 0 && <i className="kpi-dot" />}</div>
                <div className="kpi-value"><b>{money(summary.outstanding ?? invoiceBalance, currency)}</b></div>
                <div className="kpi-foot"><span>{invoiceRows.length} factures · {paymentRows.length} paiements</span></div>
              </Card>

              <Card className="kpi rise" style={{ animationDelay: '150ms' }}>
                <div className="kpi-top"><span className="kpi-label">Assiduité</span><Pill tone={pendingAbsences.length ? 'copper' : 'accent'}>{pendingAbsences.length ? 'À suivre' : 'À jour'}</Pill></div>
                <div className="kpi-value"><b>{absenceRows.length}</b><em>absences</em></div>
                <div className="kpi-foot"><span>{pendingAbsences.length} non justifiées · {absenceRows.length - pendingAbsences.length} justifiées</span></div>
              </Card>

              <Card className="kpi rise" style={{ animationDelay: '200ms' }}>
                <div className="kpi-top"><span className="kpi-label">Documents</span></div>
                <div className="kpi-value"><b>{documentRows.length}</b><em>fichiers</em></div>
                <div className="kpi-foot"><span>Bulletins, attestations, justificatifs</span></div>
              </Card>
            </div>

            <div className="toolbar rise">
              <Tabs items={['Synthèse', 'Notes', 'Absences', 'Finances', 'Documents']} active={tab} onChange={setTab} />
              <div className="toolbar-right">
                <span className="toolbar-count">{meta?.term?.name || 'Semestre 1'}</span>
              </div>
            </div>

            {tab === 0 && (
              <>
                <div className="grid-main">
                  <Card className="rise" style={{ animationDelay: '80ms' }}>
                    <CardHead
                      title="Bulletin du trimestre"
                      sub={`${reportData.term?.name || meta?.term?.name || 'Période en cours'} · ${subjectRows.length} matières`}
                      right={<Pill tone="accent">Moyenne {average(reportData.general_average)}</Pill>}
                    />
                    {subjectRows.length ? (
                      <Table
                        columns={['Matière', 'Coef.', 'D1', 'D2', 'Comp.', 'Moyenne']}
                        template="1.7fr .5fr .6fr .6fr .6fr .8fr"
                        foot={<><span className="tf-l">{number(reportData.total_coefficients)} coefficients</span><span className="tf-r">Mention : {reportData.mention || '—'}</span></>}
                      >
                        {subjectRows.map((subject) => (
                          <Tr key={subject.subject_id} template="1.7fr .5fr .6fr .6fr .6fr .8fr">
                            <span className="cell subject-cell">
                              <i className={`subj-dot tone-${scoreTone(subject.average)}`} />
                              <span>
                                <b>{subject.subject}</b>
                                <em className="mono">{subject.code}</em>
                              </span>
                            </span>
                            <span className="cell mono">{subject.coefficient}</span>
                            {['devoir_1', 'devoir_2', 'composition'].map((key) => {
                              const value = evaluationScore(subject, key);
                              return (
                                <span key={key} className={`cell mono ${value != null && value < 10 ? 'is-debt' : ''}`}>
                                  {value == null ? '—' : number(value, 1)}
                                </span>
                              );
                            })}
                            <span className="cell">
                              <span className={`cell-score tone-${scoreTone(subject.average)}`}>{average(subject.average)}</span>
                            </span>
                          </Tr>
                        ))}
                      </Table>
                    ) : <div className="state-inline">Aucune note pour ce trimestre.</div>}
                  </Card>

                  <div className="stack">
                    <Card className="rise" style={{ animationDelay: '130ms' }}>
                      <CardHead title="Identité" sub="Élève et responsable légal" />
                      <dl className="dl">
                        <div><dt>Date de naissance</dt><dd>{date(student.birth_date)}</dd></div>
                        <div><dt>Sexe</dt><dd>{student.gender === 'F' ? 'Féminin' : student.gender === 'M' ? 'Masculin' : '—'}</dd></div>
                        <div><dt>Téléphone</dt><dd className="mono">{student.phone || '—'}</dd></div>
                        <div><dt>Adresse</dt><dd>{student.address || '—'}</dd></div>
                        <div><dt>Tuteur</dt><dd>{student.guardian_name || '—'}</dd></div>
                        <div><dt>Contact tuteur</dt><dd className="mono">{student.guardian_phone || '—'}</dd></div>
                        <div><dt>E-mail tuteur</dt><dd>{student.guardian_email || '—'}</dd></div>
                      </dl>
                    </Card>

                    <Card className="rise" style={{ animationDelay: '180ms' }}>
                      <CardHead title="Derniers mouvements" sub="Factures et paiements" />
                      {movementRows.length ? (
                        <ul className="movement-list">
                          {movementRows.map((movement) => (
                            <li key={movement.id}>
                              <span className={`movement-ic ${movement.type}`}>
                                <Icon name={movement.type === 'payment' ? 'check' : 'finance'} size={13} />
                              </span>
                              <span className="movement-main">
                                <b>{movement.label}</b>
                                <em>{movement.sub} · {date(movement.date)}</em>
                              </span>
                              <span className={`movement-amount mono ${movement.amount >= 0 ? 'positive' : ''}`}>
                                {movement.amount >= 0 ? '+' : ''}{money(movement.amount, currency)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : <div className="state-inline">Aucun mouvement financier.</div>}
                    </Card>
                  </div>
                </div>
              </>
            )}

            {tab === 1 && (
              <Card className="rise" style={{ animationDelay: '80ms' }}>
                <CardHead
                  title="Toutes les évaluations"
                  sub={`${gradeRows.length} notes · ${meta?.academic_year?.label || ''}`}
                  right={<Btn icon="plus" onClick={() => actions.grade(null, { student_id: studentId, school_class_id: student.school_class_id })}>Saisir une note</Btn>}
                />
                <ListState
                  loading={grades.loading && !grades.data}
                  error={grades.error}
                  empty={!grades.loading && !grades.error && !gradeRows.length}
                  emptyTitle="Aucune note"
                  emptySub="Saisissez la première évaluation de cet élève."
                  onRetry={grades.reload}
                >
                  <Table columns={['Matière', 'Évaluation', 'Note', 'Coef.', 'Date', '']} template="1.5fr 1fr .8fr .5fr .9fr 34px">
                    {gradeRows.map((grade) => (
                      <Tr key={grade.id} template="1.5fr 1fr .8fr .5fr .9fr 34px">
                        <span className="cell subject-cell">
                          <i className={`subj-dot tone-${scoreTone(grade.score)}`} />
                          <span><b>{grade.subject?.name}</b><em className="mono">{grade.subject?.code}</em></span>
                        </span>
                        <span className="cell">{EVALUATIONS[grade.evaluation] || grade.evaluation}</span>
                        <span className="cell"><Pill tone={scoreTone(grade.score)}>{Number(grade.score)} / {Number(grade.max_score || 20)}</Pill></span>
                        <span className="cell mono">{Number(grade.coefficient || 0)}</span>
                        <span className="cell mono">{date(grade.evaluated_on)}</span>
                        <span className="cell right cell-actions">
                          <ActionMenu actions={[
                            { label: 'Modifier', icon: 'edit', onClick: () => actions.grade(grade) },
                            { label: 'Supprimer', icon: 'trash', tone: 'danger', onClick: () => actions.deleteGrade(grade) },
                          ]} />
                        </span>
                      </Tr>
                    ))}
                  </Table>
                </ListState>
              </Card>
            )}

            {tab === 2 && (
              <Card className="rise" style={{ animationDelay: '80ms' }}>
                <CardHead
                  title="Absences et retards"
                  sub={`${absenceRows.length} absences · ${pendingAbsences.length} à justifier`}
                  right={<Btn icon="plus" onClick={() => actions.absence(null, { student_id: studentId, school_class_id: student.school_class_id })}>Signaler une absence</Btn>}
                />
                <ListState
                  loading={absences.loading && !absences.data}
                  error={absences.error}
                  empty={!absences.loading && !absences.error && !absenceRows.length}
                  emptyTitle="Aucune absence"
                  emptySub="L’assiduité de cet élève est complète."
                  onRetry={absences.reload}
                >
                  <Table columns={['Date', 'Créneau', 'Motif', 'Justification', 'Statut', '']} template=".9fr .9fr 1.2fr 1.6fr .9fr 34px">
                    {absenceRows.map((absence) => (
                      <Tr key={absence.id} template=".9fr .9fr 1.2fr 1.6fr .9fr 34px">
                        <span className="cell mono">{date(absence.date)}</span>
                        <span className="cell mono">{time(absence.starts_at)}–{time(absence.ends_at)}</span>
                        <span className="cell">{absence.reason || '—'}</span>
                        <span className="cell cell-sub">{absence.justification || '—'}</span>
                        <span className="cell">{absence.is_justified ? <Pill tone="accent">Justifiée</Pill> : <Pill tone="copper">À justifier</Pill>}</span>
                        <span className="cell right cell-actions">
                          <ActionMenu actions={[
                            !absence.is_justified && { label: 'Justifier', icon: 'check', onClick: () => actions.justifyAbsence(absence) },
                            { label: 'Modifier', icon: 'edit', onClick: () => actions.absence(absence) },
                            { label: 'Supprimer', icon: 'trash', tone: 'danger', onClick: () => actions.deleteAbsence(absence) },
                          ]} />
                        </span>
                      </Tr>
                    ))}
                  </Table>
                </ListState>
              </Card>
            )}

            {tab === 3 && (
              <div className="stack">
                <Card className="rise" style={{ animationDelay: '80ms' }}>
                  <CardHead
                    title="Factures"
                    sub={`${invoiceRows.length} factures · solde ${money(invoiceBalance, currency)}`}
                    right={<Btn icon="plus" onClick={() => actions.invoice(null, { student_id: studentId })}>Créer une facture</Btn>}
                  />
                  <ListState
                    loading={invoices.loading && !invoices.data}
                    error={invoices.error}
                    empty={!invoices.loading && !invoices.error && !invoiceRows.length}
                    emptyTitle="Aucune facture"
                    emptySub="Créez une facture pour cet élève."
                    onRetry={invoices.reload}
                  >
                    <Table columns={['Référence', 'Frais', 'Montant', 'Payé', 'Statut', 'Échéance', '']} template="1.2fr 1fr .9fr .8fr .8fr .8fr 34px">
                      {invoiceRows.map((invoice) => (
                        <Tr key={invoice.id} template="1.2fr 1fr .9fr .8fr .8fr .8fr 34px">
                          <span className="cell mono">{invoice.reference}</span>
                          <span className="cell">{invoice.fee_type?.name || '—'}</span>
                          <span className="cell mono">{money(invoice.amount, currency)}</span>
                          <span className="cell mono">{money(invoice.paid_amount || 0, currency)}</span>
                          <span className="cell"><InvoicePill status={invoice.status} /></span>
                          <span className="cell mono">{date(invoice.due_on)}</span>
                          <span className="cell right cell-actions">
                            <ActionMenu actions={[
                              {
                                label: 'Encaisser',
                                icon: 'finance',
                                onClick: () => actions.payment(null, {
                                  student_id: studentId,
                                  invoice_id: invoice.id,
                                  amount: Math.max(0, Number(invoice.amount) - Number(invoice.paid_amount || 0)) || invoice.amount,
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
                </Card>

                <Card className="rise" style={{ animationDelay: '130ms' }}>
                  <CardHead
                    title="Paiements"
                    sub={`${paymentRows.length} encaissements`}
                    right={<Btn icon="plus" onClick={() => actions.payment(null, { student_id: studentId })}>Encaisser</Btn>}
                  />
                  <ListState
                    loading={payments.loading && !payments.data}
                    error={payments.error}
                    empty={!payments.loading && !payments.error && !paymentRows.length}
                    emptyTitle="Aucun paiement"
                    emptySub="Enregistrez le premier encaissement."
                    onRetry={payments.reload}
                  >
                    <Table columns={['Référence', 'Facture', 'Moyen', 'Montant', 'Date', 'Statut', '']} template="1.1fr 1.1fr .9fr .9fr .8fr .8fr 34px">
                      {paymentRows.map((payment) => (
                        <Tr key={payment.id} template="1.1fr 1.1fr .9fr .9fr .8fr .8fr 34px">
                          <span className="cell mono">{payment.reference || `PAY-${payment.id}`}</span>
                          <span className="cell mono">{payment.invoice?.reference || 'Libre'}</span>
                          <span className="cell">{PAYMENT_METHODS[payment.method] || payment.method}</span>
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
                </Card>
              </div>
            )}

            {tab === 4 && (
              <Card className="rise" style={{ animationDelay: '80ms' }}>
                <CardHead
                  title="Documents du dossier"
                  sub={`${documentRows.length} fichiers · stockage sécurisé`}
                  right={<Btn icon="upload" solid onClick={() => actions.document(student)}>Ajouter un document</Btn>}
                />
                <ListState
                  loading={documents.loading && !documents.data}
                  error={documents.error}
                  empty={!documents.loading && !documents.error && !documentRows.length}
                  emptyTitle="Aucun document"
                  emptySub="Téléversez un bulletin, une attestation ou un justificatif."
                  onRetry={documents.reload}
                >
                  <ul className="docs doc-grid">
                    {documentRows.map((document) => (
                      <li key={document.id}>
                        {document.type === 'image' && document.url ? (
                          <a className="doc-thumb" href={document.url} target="_blank" rel="noreferrer" title={document.name}>
                            <img src={document.url} alt={document.name} loading="lazy" />
                          </a>
                        ) : (
                          <span className="doc-ic"><Icon name="download" size={15} /></span>
                        )}
                        <span>
                          <b>{document.name}</b>
                          <em>{String(document.type || 'fichier').toUpperCase()} · {fileSize(document.size_bytes)} · {date(document.issued_on)}</em>
                        </span>
                        <span className="doc-actions">
                          <a className="icon-btn" href={document.url} target="_blank" rel="noreferrer" title="Télécharger">
                            <Icon name="download" size={14} />
                          </a>
                          <ActionMenu actions={[
                            { label: 'Supprimer', icon: 'trash', tone: 'danger', onClick: () => actions.deleteDocument(document) },
                          ]} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </ListState>
              </Card>
            )}
          </>
        )}
      </ListState>
    </>
  );
}
