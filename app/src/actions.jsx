import React, { useMemo, useRef, useState } from 'react';
import { api, errorMessage, getToken, setSession } from './api.js';
import { useModal } from './modal.jsx';
import {
  useData, dateInput, date, fullName, money, compactMoney, number, STUDENT_STATUS,
  INVOICE_STATUS, PAYMENT_STATUS, PAYMENT_METHODS, ADMISSION_STATUS, EVALUATIONS,
  DAYS, initials,
} from './data.jsx';
import { openResourceForm, openConfirm } from './forms.jsx';
import { useCan } from './common.jsx';
import { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_PARENT } from './auth.js';
import { exportInvoiceReport } from './reports.js';
import { Avatar, Btn, Icon, Pill } from './ui.jsx';

/* ============================================================
   Kalanso — actions métier partagées
   Chaque fonction ouvre un formulaire relié à l'API, gère les
   erreurs de validation, rafraîchit les listes et notifie.
   ============================================================ */

const pad = (value) => String(value).padStart(2, '0');
const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};
const addDays = (days) => {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
};
const plusHours = (hour, amount) => {
  if (!hour) return '';
  const [h, m] = hour.split(':').map(Number);
  return `${pad(Math.min(23, (h || 0) + amount))}:${pad(m || 0)}`;
};

const ROLE_TONES = {
  direction: 'accent',
  secretariat: 'glass',
  comptable: 'copper',
  enseignant: 'muted',
  parent: 'glass',
};

const focusInvoices = () => {
  if (typeof window === 'undefined') return;
  const current = window.location.hash.replace('#', '');
  if (current === 'finances') {
    window.dispatchEvent(new CustomEvent('kalanso:finance-tab', { detail: { tab: 1 } }));
    return;
  }
  try {
    window.sessionStorage.setItem('kalanso.finance.tab', '1');
  } catch {
    /* stockage indisponible : la navigation reste fonctionnelle */
  }
  window.location.hash = 'finances';
};

/* Fiche du compte : informations, photo et accès rapides. */
function UserProfileBody({
  account, self, canManage, canOpenSettings, onEdit, onOpenSettings,
}) {
  const modal = useModal();
  const { updateUser, notify, refresh } = useData();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const roleLabel = ROLE_LABELS[account.role] || account.role || '—';

  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    try {
      const form = new FormData();
      form.append('avatar', file);
      const result = await api.upload('/me/avatar', form);
      setSession(getToken(), result.user);
      updateUser(result.user);
      notify('Photo de profil mise à jour.');
      refresh();
      modal.close();
    } catch (error) {
      notify(errorMessage(error, 'Téléversement impossible.'), { tone: 'danger' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-view">
      <div className="profile-hero">
        <Avatar
          initials={initials(account.name || '')}
          size={64}
          src={account.photo_url}
          alt={account.name || 'Photo de profil'}
        />
        <div className="profile-id">
          <b>{account.name || '—'}</b>
          <span className="mono">{account.email || '—'}</span>
          <div className="profile-chips">
            <Pill tone={ROLE_TONES[account.role] || 'muted'}>{roleLabel}</Pill>
            {self && <Pill tone="accent" dot>Connecté</Pill>}
          </div>
        </div>
      </div>

      {ROLE_DESCRIPTIONS[account.role] && (
        <p className="profile-desc">{ROLE_DESCRIPTIONS[account.role]}</p>
      )}

      <dl className="dl">
        <div><dt>Rôle</dt><dd>{roleLabel}</dd></div>
        <div><dt>Adresse e-mail</dt><dd className="mono">{account.email || '—'}</dd></div>
        <div><dt>Compte créé le</dt><dd>{account.created_at ? date(account.created_at) : '—'}</dd></div>
        <div>
          <dt>Accès</dt>
          <dd>{self ? (getToken() ? 'Session active' : 'Hors ligne') : (canManage ? 'Gérable par la direction' : 'Lecture seule')}</dd>
        </div>
      </dl>

      <div className="profile-actions">
        {self && (
          <Btn icon="upload" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? 'Envoi…' : 'Changer la photo'}
          </Btn>
        )}
        {self && canOpenSettings && (
          <Btn icon="settings" onClick={onOpenSettings}>Paramètres</Btn>
        )}
        {canManage && (
          <Btn icon="edit" solid onClick={onEdit}>Modifier le compte</Btn>
        )}
      </div>

      {self && (
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={uploadAvatar}
        />
      )}
    </div>
  );
}

export function useActions() {
  const modal = useModal();
  const can = useCan();
  const {
    meta, notify, refresh, studentId, setStudentId, user,
  } = useData();

  const currency = meta?.school?.currency || 'FCFA';
  const classes = meta?.classes || [];
  const students = meta?.students || [];
  const staff = meta?.staff || [];
  const subjects = meta?.subjects || [];
  const departments = meta?.departments || [];
  const terms = meta?.terms || [];
  const feeTypes = meta?.fee_types || [];
  const currentYear = meta?.academic_year || null;

  const nextMatricule = useMemo(() => {
    const year = new Date().getFullYear();
    const suffix = students.reduce((max, student) => {
      const match = String(student.matricule || '').match(/(\d+)$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    return `${year}-${String(suffix + 1).padStart(4, '0')}`;
  }, [students]);

  const classOptions = useMemo(
    () => classes.map((item) => ({ value: item.id, label: `${item.name} · ${item.level}` })),
    [classes],
  );
  const subjectOptions = useMemo(
    () => subjects.map((item) => ({ value: item.id, label: `${item.name} (${item.code})` })),
    [subjects],
  );
  const staffOptions = useMemo(
    () => staff.map((item) => ({ value: item.id, label: `${fullName(item)} · ${item.role}` })),
    [staff],
  );
  const studentOptions = useMemo(
    () => students.map((item) => ({
      value: item.id,
      label: `${fullName(item)} · ${item.matricule}`,
    })),
    [students],
  );
  const departmentOptions = useMemo(
    () => departments.map((item) => ({ value: item.id, label: item.name })),
    [departments],
  );
  const termOptions = useMemo(
    () => terms.map((item) => ({ value: item.id, label: item.name })),
    [terms],
  );
  const feeTypeOptions = useMemo(
    () => feeTypes.map((item) => ({ value: item.id, label: `${item.name} · ${compactMoney(item.default_amount, currency)}` })),
    [feeTypes, currency],
  );

  const statusOptions = Object.entries(STUDENT_STATUS).map(([value, entry]) => ({ value, label: entry.label }));
  const invoiceStatusOptions = Object.entries(INVOICE_STATUS).map(([value, entry]) => ({ value, label: entry.label }));
  const paymentStatusOptions = Object.entries(PAYMENT_STATUS).map(([value, entry]) => ({ value, label: entry.label }));
  const methodOptions = Object.entries(PAYMENT_METHODS).map(([value, label]) => ({ value, label }));
  const admissionStatusOptions = Object.entries(ADMISSION_STATUS).map(([value, entry]) => ({ value, label: entry.label }));
  const evaluationOptions = Object.entries(EVALUATIONS).map(([value, label]) => ({ value, label }));
  const dayOptions = DAYS.map((label, index) => ({ value: index + 1, label }));

  /* ------------------------------------------------ élèves */
  function studentForm(student) {
    if (!can('students.manage')) return;
    const editing = Boolean(student?.id);
    openResourceForm(modal, {
      title: editing ? 'Modifier l’élève' : 'Nouvel élève',
      sub: editing
        ? `${fullName(student)} · ${student.matricule}`
        : 'Inscription · année scolaire en cours',
      eyebrow: editing ? 'Dossier scolaire' : 'Admissions',
      icon: 'students',
      fields: [
        { type: 'section', label: 'Identité' },
        { name: 'first_name', label: 'Prénom', required: true, half: true, placeholder: 'Aminata' },
        { name: 'last_name', label: 'Nom', required: true, half: true, placeholder: 'Traoré' },
        {
          name: 'matricule', label: 'Matricule', required: true, half: true, hint: editing ? 'modifiable' : 'généré',
        },
        {
          name: 'gender', label: 'Sexe', type: 'select', half: true,
          options: [{ value: 'F', label: 'Féminin' }, { value: 'M', label: 'Masculin' }],
          placeholder: '— Non renseigné —',
        },
        { name: 'birth_date', label: 'Date de naissance', type: 'date', half: true },
        { name: 'email', label: 'E-mail', type: 'email', half: true, placeholder: 'eleve@famille.ml' },
        { name: 'phone', label: 'Téléphone', type: 'tel', half: true, placeholder: '+223 76 00 00 00' },
        { type: 'section', label: 'Scolarité' },
        { name: 'school_class_id', label: 'Classe', type: 'select', options: classOptions, half: true, required: true },
        { name: 'status', label: 'Statut', type: 'select', options: statusOptions, half: true },
        { name: 'enrolled_on', label: 'Date d’inscription', type: 'date', half: true },
        { name: 'is_active', label: 'Élève actif', type: 'checkbox', half: true, switchLabel: 'Inscrit cette année' },
        { type: 'section', label: 'Tuteur et adresse' },
        { name: 'guardian_name', label: 'Nom du tuteur', half: true },
        { name: 'guardian_phone', label: 'Téléphone du tuteur', type: 'tel', half: true },
        { name: 'guardian_email', label: 'E-mail du tuteur', type: 'email', half: true },
        { name: 'address', label: 'Adresse', half: true, placeholder: 'Hamdallaye ACI 2000, Bamako' },
        { type: 'section', label: 'Photo et documents', hint: 'facultatif' },
        {
          name: 'photo',
          label: 'Photo de l’élève',
          type: 'file',
          wide: true,
          accept: 'image/jpeg,image/png,image/webp',
          help: 'JPG, PNG ou WebP · 8 Mo maximum',
        },
        {
          name: 'documents',
          label: 'Documents de l’élève',
          type: 'file',
          multiple: true,
          wide: true,
          accept: 'image/jpeg,image/png,image/webp,application/pdf',
          help: 'Plusieurs images ou PDF · 10 Mo par fichier',
        },
      ],
      initial: editing ? {
        ...student,
        birth_date: dateInput(student.birth_date),
        enrolled_on: dateInput(student.enrolled_on),
        guardian_name: student.guardian_name || '',
        guardian_phone: student.guardian_phone || '',
        guardian_email: student.guardian_email || '',
        email: student.email || '',
        phone: student.phone || '',
        address: student.address || '',
        gender: student.gender || '',
        status: student.status || 'a_jour',
        is_active: Boolean(student.is_active),
        photo: null,
        documents: [],
      } : {
        matricule: nextMatricule,
        school_class_id: classes[0]?.id || '',
        status: 'a_jour',
        enrolled_on: today(),
        is_active: true,
        photo: null,
        documents: [],
      },
      submit: async (payload, values) => {
        const result = editing
          ? await api.patch(`/students/${student.id}`, payload)
          : await api.post('/students', payload);
        const studentId = result?.student?.id || student?.id;
        if (!studentId) return result;

        const warnings = [];

        if (values.photo) {
          try {
            const form = new FormData();
            form.append('photo', values.photo);
            await api.upload(`/students/${studentId}/photo`, form);
          } catch (error) {
            warnings.push(`photo : ${errorMessage(error)}`);
          }
        }

        const documentFiles = Array.isArray(values.documents) ? values.documents : [];
        for (const file of documentFiles) {
          try {
            const form = new FormData();
            form.append('student_id', studentId);
            form.append('name', file.name.replace(/\.[^.]+$/, '') || 'Document');
            form.append('type', file.type === 'application/pdf' ? 'pdf' : (file.type.startsWith('image/') ? 'image' : 'doc'));
            form.append('issued_on', today());
            form.append('file', file);
            await api.upload('/documents', form);
          } catch (error) {
            warnings.push(`${file.name} : ${errorMessage(error)}`);
          }
        }

        if (warnings.length) {
          notify('Élève enregistré, mais certains fichiers n’ont pas été ajoutés.', {
            tone: 'danger',
            detail: warnings.join(' · '),
          });
        }

        return result;
      },
      success: editing ? 'Élève mis à jour.' : 'Élève créé et inscrit.',
      submitLabel: editing ? 'Enregistrer les modifications' : 'Créer l’élève',
      onDone: (result) => {
        if (!editing && result?.student?.id) setStudentId(result.student.id);
      },
    });
  }

  function studentDrawer(student) {
    if (!can('students.view')) return;
    if (!student) return;
    const status = STUDENT_STATUS[student.status] || STUDENT_STATUS.a_jour;
    modal.open({
      title: fullName(student),
      sub: `${student.school_class?.name || 'Sans classe'} · Matricule ${student.matricule}`,
      eyebrow: 'Fiche rapide',
      variant: 'drawer',
      icon: 'profile',
      body: (
        <>
          <div className="drawer-id">
            <Avatar initials={student.initials || initials(fullName(student))} size={54} src={student.photo_url} />
            <div>
              <b>{fullName(student)}</b>
              <span>{student.school_class?.name || 'Sans classe'} · {student.matricule}</span>
              <div className="drawer-chips">
                <Pill tone={status.tone}>{status.label}</Pill>
                <Pill tone="muted">{student.is_active ? 'Actif' : 'Inactif'}</Pill>
                <Pill tone="copper">Moyenne {student.average != null ? number(student.average, 2) : '—'}</Pill>
              </div>
            </div>
          </div>

          <dl className="msummary">
            <div><dt>Solde</dt><dd>{money(student.balance ?? 0, currency)}</dd></div>
            <div><dt>Tuteur</dt><dd>{student.guardian_name || '—'}</dd></div>
            <div><dt>Téléphone</dt><dd>{student.guardian_phone || student.phone || '—'}</dd></div>
            <div><dt>E-mail</dt><dd>{student.guardian_email || student.email || '—'}</dd></div>
            <div><dt>Adresse</dt><dd>{student.address || '—'}</dd></div>
          </dl>

          <div className="mcard-head" style={{ marginTop: 18 }}>Actions rapides</div>
          <div className="drawer-actions">
            <Btn
              icon="profile"
              onClick={() => {
                modal.close();
                studentForm(student);
              }}
            >
              Modifier
            </Btn>
            <Btn
              icon="upload"
              onClick={() => {
                modal.close();
                photoForm(student);
              }}
            >
              Photo
            </Btn>
            <Btn
              icon="finance"
              onClick={() => {
                modal.close();
                invoiceForm(null, { student_id: student.id });
              }}
            >
              Facturer
            </Btn>
            <Btn
              icon="download"
              onClick={() => {
                modal.close();
                setStudentId(student.id);
                window.location.hash = 'fiche';
              }}
            >
              Ouvrir la fiche
            </Btn>
            <Btn
              icon="close"
              onClick={() => {
                modal.close();
                deleteStudent(student);
              }}
            >
              Retirer
            </Btn>
          </div>
        </>
      ),
      actions: [
        { label: 'Fermer', onClick: () => modal.close() },
        {
          label: 'Ouvrir la fiche',
          kind: 'primary',
          icon: 'external',
          onClick: () => {
            modal.close();
            setStudentId(student.id);
            window.location.hash = 'fiche';
          },
        },
      ],
    });
  }

  function deleteStudent(student) {
    if (!can('students.manage')) return;
    openConfirm(modal, {
      title: `Retirer ${fullName(student)} ?`,
      message: `Le dossier de ${fullName(student)} sera supprimé, avec ses notes, absences, factures et documents.`,
      confirmLabel: 'Retirer l’élève',
      onConfirm: () => api.del(`/students/${student.id}`),
      success: 'Élève retiré de l’établissement.',
      onDone: () => {
        if (studentId === student.id) setStudentId(null);
      },
    });
  }

  /* ------------------------------------------------ classes */
  function classForm(item) {
    if (!can('classes.manage')) return;
    const editing = Boolean(item?.id);
    openResourceForm(modal, {
      title: editing ? 'Modifier la classe' : 'Créer une classe',
      sub: editing ? `${item.name} · ${item.level}` : 'Année scolaire en cours',
      eyebrow: 'Organisation pédagogique',
      icon: 'classes',
      variant: 'center',
      size: 620,
      fields: [
        { name: 'name', label: 'Nom de la classe', required: true, placeholder: 'Terminale S' },
        { name: 'level', label: 'Niveau', required: true, placeholder: 'Terminale' },
        { name: 'capacity', label: 'Capacité', type: 'number', min: 1, max: 500, half: true },
        { name: 'room', label: 'Salle', half: true, placeholder: 'S204' },
        { name: 'head_teacher_id', label: 'Professeur principal', type: 'select', options: staffOptions, half: true },
        { name: 'is_active', label: 'Classe active', type: 'checkbox', half: true, switchLabel: 'Ouverte aux inscriptions' },
      ],
      initial: editing ? {
        ...item,
        capacity: item.capacity ?? '',
        room: item.room || '',
        head_teacher_id: item.head_teacher_id || '',
        is_active: Boolean(item.is_active),
      } : { capacity: 35, is_active: true },
      submit: (payload) => (editing
        ? api.patch(`/classes/${item.id}`, payload)
        : api.post('/classes', payload)),
      success: editing ? 'Classe mise à jour.' : 'Classe créée.',
      submitLabel: editing ? 'Enregistrer' : 'Créer la classe',
    });
  }

  function deleteClass(item) {
    if (!can('classes.manage')) return;
    openConfirm(modal, {
      title: `Supprimer la classe ${item.name} ?`,
      message: 'Les élèves rattachés à cette classe resteront dans la base mais n’auront plus de classe. Les créneaux et matières liés seront retirés.',
      confirmLabel: 'Supprimer la classe',
      onConfirm: () => api.del(`/classes/${item.id}`),
      success: 'Classe supprimée.',
    });
  }

  /* ------------------------------------------------ matières */
  function subjectForm(item) {
    if (!can('subjects.manage')) return;
    const editing = Boolean(item?.id);
    openResourceForm(modal, {
      title: editing ? 'Modifier la matière' : 'Nouvelle matière',
      sub: editing ? `${item.name} · ${item.code}` : 'Catalogue pédagogique',
      eyebrow: 'Pédagogie',
      icon: 'grades',
      variant: 'center',
      size: 640,
      fields: [
        { name: 'name', label: 'Nom de la matière', required: true, half: true, placeholder: 'Mathématiques' },
        { name: 'code', label: 'Code', required: true, half: true, placeholder: 'MATH' },
        { name: 'department_id', label: 'Département', type: 'select', options: departmentOptions, half: true },
        { name: 'coefficient', label: 'Coefficient', type: 'number', step: '0.5', min: 0.5, max: 10, half: true },
        { name: 'weekly_hours', label: 'Heures / semaine', type: 'number', min: 0, max: 60, half: true },
        { name: 'is_active', label: 'Matière active', type: 'checkbox', half: true, switchLabel: 'Enseignée cette année' },
      ],
      initial: editing ? {
        ...item,
        department_id: item.department_id || '',
        coefficient: item.coefficient ?? '',
        weekly_hours: item.weekly_hours ?? '',
        is_active: Boolean(item.is_active),
      } : { coefficient: 1, weekly_hours: 2, is_active: true },
      submit: (payload) => (editing
        ? api.patch(`/subjects/${item.id}`, payload)
        : api.post('/subjects', payload)),
      success: editing ? 'Matière mise à jour.' : 'Matière créée.',
      submitLabel: editing ? 'Enregistrer' : 'Créer la matière',
    });
  }

  function deleteSubject(item) {
    if (!can('subjects.manage')) return;
    openConfirm(modal, {
      title: `Supprimer ${item.name} ?`,
      message: 'Les notes, créneaux et affectations liés à cette matière seront également supprimés.',
      confirmLabel: 'Supprimer la matière',
      onConfirm: () => api.del(`/subjects/${item.id}`),
      success: 'Matière supprimée.',
    });
  }

  /* ------------------------------------------------ personnel */
  function staffForm(item) {
    if (!can('staff.manage')) return;
    const editing = Boolean(item?.id);
    openResourceForm(modal, {
      title: editing ? 'Modifier le membre' : 'Ajouter un membre',
      sub: editing ? `${fullName(item)} · ${item.role}` : 'Personnel de l’établissement',
      eyebrow: 'Ressources humaines',
      icon: 'staff',
      fields: [
        { type: 'section', label: 'Identité' },
        { name: 'first_name', label: 'Prénom', required: true, half: true },
        { name: 'last_name', label: 'Nom', required: true, half: true },
        { name: 'role', label: 'Fonction', required: true, half: true, placeholder: 'Professeur de mathématiques' },
        { name: 'department_id', label: 'Département', type: 'select', options: departmentOptions, half: true },
        { name: 'email', label: 'E-mail', type: 'email', half: true },
        { name: 'phone', label: 'Téléphone', type: 'tel', half: true },
        { type: 'section', label: 'Contrat' },
        { name: 'years_experience', label: 'Années d’expérience', type: 'number', min: 0, max: 60, half: true },
        { name: 'hired_on', label: 'Date d’embauche', type: 'date', half: true },
        { name: 'is_active', label: 'Membre actif', type: 'checkbox', half: true, switchLabel: 'En poste' },
      ],
      initial: editing ? {
        ...item,
        department_id: item.department_id || '',
        years_experience: item.years_experience ?? '',
        hired_on: dateInput(item.hired_on),
        email: item.email || '',
        phone: item.phone || '',
        is_active: Boolean(item.is_active),
      } : { is_active: true, years_experience: 0, hired_on: today() },
      submit: (payload) => (editing
        ? api.patch(`/staff/${item.id}`, payload)
        : api.post('/staff', payload)),
      success: editing ? 'Membre du personnel mis à jour.' : 'Membre ajouté.',
      submitLabel: editing ? 'Enregistrer' : 'Ajouter le membre',
    });
  }

  function deleteStaff(item) {
    if (!can('staff.manage')) return;
    openConfirm(modal, {
      title: `Supprimer ${fullName(item)} ?`,
      message: 'Le membre sera retiré de l’annuaire. Ses affectations de cours seront détachées.',
      confirmLabel: 'Supprimer le membre',
      onConfirm: () => api.del(`/staff/${item.id}`),
      success: 'Membre supprimé.',
    });
  }

  /* ------------------------------------------------ emploi du temps */
  function slotForm(slot, defaults = {}) {
    if (!can('schedules.manage')) return;
    const editing = Boolean(slot?.id);
    const initial = editing ? {
      ...slot,
      starts_at: String(slot.starts_at || '').slice(0, 5),
      ends_at: String(slot.ends_at || '').slice(0, 5),
      day_of_week: slot.day_of_week || 1,
    } : {
      school_class_id: defaults.school_class_id || classes[0]?.id || '',
      subject_id: defaults.subject_id || '',
      staff_id: '',
      term_id: defaults.term_id || terms.find((term) => term.is_current)?.id || terms[0]?.id || '',
      day_of_week: defaults.day_of_week || 1,
      starts_at: defaults.starts_at || '08:00',
      ends_at: defaults.ends_at || plusHours(defaults.starts_at || '08:00', 2),
      room: '',
    };
    openResourceForm(modal, {
      title: editing ? 'Modifier le cours' : 'Ajouter un cours',
      sub: editing ? `${slot.subject?.name || 'Cours'} · ${slot.school_class?.name || ''}` : 'Emploi du temps de la semaine',
      eyebrow: 'Planning',
      icon: 'calendar',
      variant: 'center',
      size: 680,
      fields: [
        { name: 'school_class_id', label: 'Classe', type: 'select', options: classOptions, required: true, half: true },
        { name: 'subject_id', label: 'Matière', type: 'select', options: subjectOptions, required: true, half: true },
        { name: 'staff_id', label: 'Enseignant', type: 'select', options: staffOptions, half: true },
        { name: 'term_id', label: 'Période', type: 'select', options: termOptions, half: true },
        { name: 'day_of_week', label: 'Jour', type: 'select', options: dayOptions, required: true, half: true },
        { name: 'room', label: 'Salle', half: true, placeholder: 'S204' },
        { name: 'starts_at', label: 'Début', type: 'time', required: true, half: true },
        { name: 'ends_at', label: 'Fin', type: 'time', required: true, half: true },
      ],
      initial,
      submit: (payload) => (editing
        ? api.patch(`/timetable/${slot.id}`, payload)
        : api.post('/timetable', payload)),
      success: editing ? 'Créneau mis à jour.' : 'Cours ajouté à l’emploi du temps.',
      submitLabel: editing ? 'Enregistrer' : 'Ajouter le cours',
    });
  }

  function deleteSlot(slot) {
    if (!can('schedules.manage')) return;
    openConfirm(modal, {
      title: 'Supprimer ce créneau ?',
      message: `${slot.subject?.name || 'Cours'} · ${slot.school_class?.name || 'Classe'} · ${DAYS[(slot.day_of_week || 1) - 1]} ${String(slot.starts_at || '').slice(0, 5)}`,
      confirmLabel: 'Supprimer le créneau',
      onConfirm: () => api.del(`/timetable/${slot.id}`),
      success: 'Créneau supprimé.',
    });
  }

  /* ------------------------------------------------ notes */
  function gradeForm(grade, defaults = {}) {
    if (!can('grades.manage')) return;
    const editing = Boolean(grade?.id);
    openResourceForm(modal, {
      title: editing ? 'Modifier la note' : 'Saisir une note',
      sub: editing
        ? `${grade.student?.full_name || ''} · ${grade.subject?.name || ''}`
        : 'Évaluation du trimestre en cours',
      eyebrow: 'Évaluation',
      icon: 'grades',
      variant: 'center',
      size: 680,
      fields: [
        { name: 'student_id', label: 'Élève', type: 'select', options: studentOptions, required: true, half: true },
        { name: 'subject_id', label: 'Matière', type: 'select', options: subjectOptions, required: true, half: true },
        { name: 'school_class_id', label: 'Classe', type: 'select', options: classOptions, half: true },
        { name: 'term_id', label: 'Période', type: 'select', options: termOptions, required: true, half: true },
        { name: 'evaluation', label: 'Évaluation', type: 'select', options: evaluationOptions, required: true, half: true },
        { name: 'evaluated_on', label: 'Date de l’évaluation', type: 'date', required: true, half: true },
        { name: 'score', label: 'Note obtenue', type: 'number', min: 0, max: 20, step: '0.01', required: true, half: true },
        { name: 'max_score', label: 'Barème', type: 'number', min: 1, max: 100, step: '0.5', half: true },
        { name: 'coefficient', label: 'Coefficient', type: 'number', min: 0.5, max: 10, step: '0.5', half: true },
        { name: 'comment', label: 'Appréciation', wide: true, placeholder: 'Très bon travail…' },
      ],
      initial: editing ? {
        ...grade,
        student_id: grade.student_id,
        subject_id: grade.subject_id,
        school_class_id: grade.school_class_id || '',
        term_id: grade.term_id,
        evaluation: grade.evaluation,
        evaluated_on: dateInput(grade.evaluated_on),
        score: grade.score,
        max_score: grade.max_score ?? 20,
        coefficient: grade.coefficient ?? '',
        comment: grade.comment || '',
      } : {
        student_id: defaults.student_id || '',
        subject_id: defaults.subject_id || '',
        school_class_id: defaults.school_class_id || classes[0]?.id || '',
        term_id: defaults.term_id || terms.find((term) => term.is_current)?.id || terms[0]?.id || '',
        evaluation: 'devoir_1',
        evaluated_on: today(),
        max_score: 20,
        coefficient: 1,
      },
      submit: (payload) => (editing
        ? api.patch(`/grades/${grade.id}`, payload)
        : api.post('/grades', payload)),
      success: editing ? 'Note mise à jour.' : 'Note enregistrée.',
      submitLabel: editing ? 'Enregistrer' : 'Enregistrer la note',
    });
  }

  function deleteGrade(grade) {
    if (!can('grades.manage')) return;
    openConfirm(modal, {
      title: 'Supprimer cette note ?',
      message: `${grade.student?.full_name || 'Élève'} · ${grade.subject?.name || 'Matière'} · ${EVALUATIONS[grade.evaluation] || grade.evaluation}`,
      confirmLabel: 'Supprimer la note',
      onConfirm: () => api.del(`/grades/${grade.id}`),
      success: 'Note supprimée.',
    });
  }

  /* ------------------------------------------------ absences */
  function absenceForm(absence, defaults = {}) {
    if (!can('absences.manage')) return;
    const editing = Boolean(absence?.id);
    openResourceForm(modal, {
      title: editing ? 'Modifier l’absence' : 'Enregistrer une absence',
      sub: editing
        ? `${absence.student?.full_name || ''} · ${dateInput(absence.date)}`
        : 'Vie scolaire · suivi de l’assiduité',
      eyebrow: 'Assiduité',
      icon: 'absences',
      variant: 'center',
      size: 660,
      fields: [
        { name: 'student_id', label: 'Élève', type: 'select', options: studentOptions, required: true, half: true },
        { name: 'school_class_id', label: 'Classe', type: 'select', options: classOptions, half: true },
        { name: 'date', label: 'Date', type: 'date', required: true, half: true },
        { name: 'term_id', label: 'Période', type: 'select', options: termOptions, half: true },
        { name: 'starts_at', label: 'Début', type: 'time', half: true },
        { name: 'ends_at', label: 'Fin', type: 'time', half: true },
        { name: 'reason', label: 'Motif', half: true, placeholder: 'Maladie, transport…' },
        { name: 'recorded_by', label: 'Saisie par', type: 'select', options: staffOptions, half: true },
        { name: 'is_justified', label: 'Absence justifiée', type: 'checkbox', half: true, switchLabel: 'Justificatif reçu' },
        { name: 'justification', label: 'Justification', wide: true, placeholder: 'Certificat médical transmis…' },
      ],
      initial: editing ? {
        ...absence,
        student_id: absence.student_id,
        school_class_id: absence.school_class_id || '',
        date: dateInput(absence.date),
        term_id: absence.term_id || '',
        starts_at: String(absence.starts_at || '').slice(0, 5),
        ends_at: String(absence.ends_at || '').slice(0, 5),
        reason: absence.reason || '',
        recorded_by: absence.recorded_by?.id || '',
        is_justified: Boolean(absence.is_justified),
        justification: absence.justification || '',
      } : {
        student_id: defaults.student_id || '',
        school_class_id: defaults.school_class_id || '',
        date: defaults.date || today(),
        term_id: defaults.term_id || terms.find((term) => term.is_current)?.id || '',
        starts_at: '08:00',
        ends_at: '10:00',
        is_justified: false,
      },
      submit: (payload) => (editing
        ? api.patch(`/absences/${absence.id}`, payload)
        : api.post('/absences', payload)),
      success: editing ? 'Absence mise à jour.' : 'Absence enregistrée.',
      submitLabel: editing ? 'Enregistrer' : 'Enregistrer l’absence',
    });
  }

  function justifyAbsence(absence) {
    if (!can('absences.manage')) return;
    openResourceForm(modal, {
      title: 'Justifier une absence',
      sub: `${absence.student?.full_name || 'Élève'} · ${dateInput(absence.date)}`,
      eyebrow: 'Vie scolaire',
      icon: 'absences',
      variant: 'center',
      size: 560,
      fields: [
        { name: 'reason', label: 'Motif', placeholder: 'Maladie, raison familiale…' },
        {
          name: 'justification', label: 'Justification', type: 'textarea', required: true, rows: 4,
          placeholder: 'Certificat médical transmis par le tuteur le …',
        },
      ],
      initial: { reason: absence.reason || '', justification: absence.justification || '' },
      submit: (payload) => api.post(`/absences/${absence.id}/justify`, payload),
      success: 'Absence justifiée.',
      submitLabel: 'Valider la justification',
    });
  }

  function deleteAbsence(absence) {
    if (!can('absences.manage')) return;
    openConfirm(modal, {
      title: 'Supprimer cette absence ?',
      message: `${absence.student?.full_name || 'Élève'} · ${dateInput(absence.date)} · ${absence.reason || 'sans motif'}`,
      confirmLabel: 'Supprimer l’absence',
      onConfirm: () => api.del(`/absences/${absence.id}`),
      success: 'Absence supprimée.',
    });
  }

  /* ------------------------------------------------ finances */
  function invoiceForm(invoice, defaults = {}) {
    if (!can('finances.manage')) return;
    const editing = Boolean(invoice?.id);
    openResourceForm(modal, {
      title: editing ? 'Modifier la facture' : 'Créer une facture',
      sub: editing ? `${invoice.reference} · ${invoice.student?.full_name || ''}` : 'Facturation et échéances',
      eyebrow: 'Finances',
      icon: 'finance',
      fields: [
        { name: 'student_id', label: 'Élève', type: 'select', options: studentOptions, required: true, half: true },
        { name: 'fee_type_id', label: 'Nature des frais', type: 'select', options: feeTypeOptions, half: true },
        { name: 'issued_on', label: 'Date d’émission', type: 'date', required: true, half: true },
        { name: 'due_on', label: 'Échéance', type: 'date', required: true, half: true },
        { name: 'amount', label: `Montant (${currency})`, type: 'number', min: 0, step: '0.01', required: true, half: true },
        { name: 'status', label: 'Statut', type: 'select', options: invoiceStatusOptions, half: true },
        { name: 'reference', label: 'Référence', half: true, hint: 'auto si vide' },
        { name: 'term_id', label: 'Période', type: 'select', options: termOptions, half: true },
        { name: 'notes', label: 'Notes', type: 'textarea', rows: 3, placeholder: 'Échéancier, remarque…' },
      ],
      initial: editing ? {
        ...invoice,
        student_id: invoice.student_id,
        fee_type_id: invoice.fee_type_id || '',
        issued_on: dateInput(invoice.issued_on),
        due_on: dateInput(invoice.due_on),
        amount: invoice.amount,
        status: invoice.status || 'pending',
        reference: invoice.reference || '',
        term_id: invoice.term_id || '',
        notes: invoice.notes || '',
      } : {
        student_id: defaults.student_id || '',
        fee_type_id: defaults.fee_type_id || feeTypes[0]?.id || '',
        issued_on: today(),
        due_on: addDays(30),
        amount: defaults.amount || '',
        status: 'pending',
        term_id: defaults.term_id || terms.find((term) => term.is_current)?.id || '',
      },
      submit: (payload) => (editing
        ? api.patch(`/invoices/${invoice.id}`, payload)
        : api.post('/invoices', payload)),
      success: editing ? 'Facture mise à jour.' : 'Facture créée.',
      submitLabel: editing ? 'Enregistrer' : 'Créer la facture',
      onDone: (result) => {
        const saved = result?.invoice;
        if (editing || !saved?.id) return;
        focusInvoices();
        window.setTimeout(() => invoiceDetail(saved), 280);
      },
    });
  }

  function deleteInvoice(invoice) {
    if (!can('finances.manage')) return;
    openConfirm(modal, {
      title: 'Supprimer cette facture ?',
      message: `${invoice.reference} · ${invoice.student?.full_name || 'Élève'} · ${money(invoice.amount, currency)}. Les paiements associés seront supprimés.`,
      confirmLabel: 'Supprimer la facture',
      onConfirm: () => api.del(`/invoices/${invoice.id}`),
      success: 'Facture supprimée.',
    });
  }

  async function loadInvoice(source) {
    if (!source?.id) return null;
    try {
      const payload = await api.get(`/invoices/${source.id}`);
      const invoice = payload?.invoice || source;
      const paid = Number(payload?.paid_amount ?? source.paid_amount ?? 0);
      const total = Number(invoice.amount || 0);
      return {
        invoice,
        paid,
        balance: Number(payload?.balance ?? Math.max(0, total - paid)),
      };
    } catch (error) {
      notify(errorMessage(error), { tone: 'danger' });
      return null;
    }
  }

  async function invoiceDetail(source) {
    if (!can('finances.view')) return;
    const data = await loadInvoice(source);
    if (!data) return;

    const { invoice, paid, balance } = data;
    const status = INVOICE_STATUS[invoice.status] || { label: invoice.status || 'En attente', tone: 'muted' };
    const payments = Array.isArray(invoice.payments) ? invoice.payments : [];
    const student = invoice.student || {};
    const feeLabel = invoice.fee_type?.name || invoice.feeType?.name || 'Frais de scolarité';

    modal.open({
      title: 'Facture',
      sub: `${invoice.reference} · ${fullName(student)}`,
      eyebrow: 'Finances',
      icon: 'finance',
      variant: 'wide',
      size: 720,
      body: (
        <div className="invoice-view">
          <div className="invoice-hero">
            <div className="invoice-hero-main">
              <span className="invoice-kicker">Facture</span>
              <h3>{invoice.reference}</h3>
              <p>{fullName(student)} · {student.matricule || '—'} · {student.school_class?.name || 'Sans classe'}</p>
            </div>
            <div className="invoice-hero-side">
              <Pill tone={status.tone}>{status.label}</Pill>
              <b>{money(invoice.amount, currency)}</b>
              <em>Échéance {date(invoice.due_on)}</em>
            </div>
          </div>

          <div className="invoice-meta-grid">
            <div><span>Nature des frais</span><b>{feeLabel}</b></div>
            <div><span>Période</span><b>{invoice.term?.name || meta?.term?.name || '—'}</b></div>
            <div><span>Émise le</span><b>{date(invoice.issued_on)}</b></div>
            <div><span>Élève</span><b>{fullName(student)}</b></div>
          </div>

          <div className="invoice-balance">
            <div><span>Montant facturé</span><b>{money(invoice.amount, currency)}</b></div>
            <div><span>Déjà réglé</span><b>{money(paid, currency)}</b></div>
            <div className={balance > 0 ? 'debt' : 'settled'}>
              <span>Solde restant</span>
              <b>{money(balance, currency)}</b>
            </div>
          </div>

          <div className="invoice-payments">
            <div className="invoice-subhead">
              <span>Paiements</span>
              <em>{payments.length} mouvement{payments.length > 1 ? 's' : ''}</em>
            </div>
            {payments.length ? (
              <ul className="invoice-payment-list">
                {payments.map((payment) => (
                  <li key={payment.id}>
                    <span className={`invoice-payment-ic ${payment.status === 'completed' ? 'is-ok' : ''}`}>
                      <Icon name={payment.status === 'completed' ? 'check' : 'clock'} size={13} />
                    </span>
                    <span className="invoice-payment-main">
                      <b>{PAYMENT_METHODS[payment.method] || payment.method || 'Paiement'}</b>
                      <em>{payment.reference || `PAY-${payment.id}`} · {date(payment.paid_on)}</em>
                    </span>
                    <span className="invoice-payment-status">
                      {PAYMENT_STATUS[payment.status]?.label || payment.status || 'Validé'}
                    </span>
                    <b className="mono">{money(payment.amount, currency)}</b>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="invoice-empty">Aucun paiement enregistré pour cette facture.</div>
            )}
          </div>

          {invoice.notes && (
            <div className="invoice-notes">
              <b>Notes</b>
              <p>{invoice.notes}</p>
            </div>
          )}
        </div>
      ),
      actions: [
        { label: 'Fermer', onClick: () => modal.close() },
        balance > 0 && {
          label: 'Encaisser',
          icon: 'finance',
          onClick: () => {
            modal.close();
            paymentForm(null, {
              student_id: invoice.student_id || student.id,
              invoice_id: invoice.id,
              amount: balance,
            });
          },
        },
        {
          label: 'Télécharger PDF',
          kind: 'primary',
          icon: 'download',
          onClick: () => exportInvoiceReport({
            invoice, paidAmount: paid, balance, meta, currency,
          }),
        },
      ].filter(Boolean),
    });
  }

  async function invoicePdf(source) {
    if (!can('finances.view')) return;
    const data = await loadInvoice(source);
    if (!data) return;
    exportInvoiceReport({
      invoice: data.invoice,
      paidAmount: data.paid,
      balance: data.balance,
      meta,
      currency,
    });
  }

  async function paymentForm(payment, defaults = {}) {
    if (!can('finances.manage')) return;
    const editing = Boolean(payment?.id);
    let invoices = defaults.invoices;
    if (!invoices) {
      try {
        const payload = await api.get('/invoices', { query: { per_page: 300 } });
        invoices = payload?.data || [];
      } catch {
        invoices = [];
      }
    }
    const invoiceOptions = invoices.map((item) => ({
      value: item.id,
      label: `${item.reference} · ${item.student?.full_name || ''} · ${compactMoney(item.amount, currency)} · ${INVOICE_STATUS[item.status]?.label || item.status}`,
    }));
    openResourceForm(modal, {
      title: editing ? 'Modifier le paiement' : 'Enregistrer un paiement',
      sub: editing
        ? `${payment.student?.full_name || ''} · ${dateInput(payment.paid_on)}`
        : `Encaissement · reçu immédiat · ${currency}`,
      eyebrow: 'Finances',
      icon: 'finance',
      variant: 'center',
      size: 680,
      fields: [
        { name: 'student_id', label: 'Élève', type: 'select', options: studentOptions, required: true, half: true },
        { name: 'invoice_id', label: 'Facture à régler', type: 'select', options: invoiceOptions, half: true, placeholder: '— Paiement libre —' },
        { name: 'amount', label: `Montant (${currency})`, type: 'number', min: 0.01, step: '0.01', required: true, half: true },
        { name: 'method', label: 'Moyen de paiement', type: 'select', options: methodOptions, half: true },
        { name: 'paid_on', label: 'Date du paiement', type: 'date', required: true, half: true },
        { name: 'status', label: 'Statut', type: 'select', options: paymentStatusOptions, half: true },
        { name: 'reference', label: 'Référence', half: true, placeholder: 'PAY-…' },
      ],
      initial: editing ? {
        ...payment,
        student_id: payment.student_id,
        invoice_id: payment.invoice_id || '',
        amount: payment.amount,
        method: payment.method || 'cash',
        paid_on: dateInput(payment.paid_on),
        status: payment.status || 'completed',
        reference: payment.reference || '',
      } : {
        student_id: defaults.student_id || '',
        invoice_id: defaults.invoice_id || '',
        amount: defaults.amount || '',
        method: 'cash',
        paid_on: today(),
        status: 'completed',
        reference: '',
      },
      intro: (
        <div className="form-intro">
          Le statut de la facture est recalculé automatiquement après l’enregistrement du paiement.
        </div>
      ),
      submit: (payload) => (editing
        ? api.patch(`/payments/${payment.id}`, payload)
        : api.post('/payments', payload)),
      success: editing ? 'Paiement mis à jour.' : 'Paiement encaissé.',
      submitLabel: editing ? 'Enregistrer' : 'Encaisser',
    });
  }

  function deletePayment(payment) {
    if (!can('finances.manage')) return;
    openConfirm(modal, {
      title: 'Supprimer ce paiement ?',
      message: `${payment.student?.full_name || 'Élève'} · ${money(payment.amount, currency)} · ${dateInput(payment.paid_on)}. La facture sera recalculée.`,
      confirmLabel: 'Supprimer le paiement',
      onConfirm: () => api.del(`/payments/${payment.id}`),
      success: 'Paiement supprimé.',
    });
  }

  /* ------------------------------------------------ admissions */
  function admissionForm(admission) {
    if (!can('admissions.manage')) return;
    const editing = Boolean(admission?.id);
    openResourceForm(modal, {
      title: editing ? 'Modifier le dossier' : 'Nouveau dossier',
      sub: editing
        ? `${fullName(admission)} · ${admission.reference}`
        : 'Admissions · prochaine rentrée',
      eyebrow: 'Admissions',
      icon: 'admissions',
      fields: [
        { type: 'section', label: 'Candidat' },
        { name: 'first_name', label: 'Prénom', required: true, half: true },
        { name: 'last_name', label: 'Nom', required: true, half: true },
        {
          name: 'gender', label: 'Sexe', type: 'select', half: true,
          options: [{ value: 'F', label: 'Féminin' }, { value: 'M', label: 'Masculin' }],
          placeholder: '— Non renseigné —',
        },
        { name: 'birth_date', label: 'Date de naissance', type: 'date', half: true },
        { name: 'desired_class_id', label: 'Classe demandée', type: 'select', options: classOptions, half: true },
        { name: 'status', label: 'Étape du dossier', type: 'select', options: admissionStatusOptions, half: true },
        { type: 'section', label: 'Responsable légal' },
        { name: 'guardian_name', label: 'Nom du responsable', half: true },
        { name: 'guardian_phone', label: 'Téléphone', type: 'tel', half: true },
        { name: 'guardian_email', label: 'E-mail', type: 'email', half: true },
        { name: 'reference', label: 'Référence', half: true, hint: 'auto si vide' },
        { type: 'section', label: 'Suivi' },
        { name: 'applied_on', label: 'Date de candidature', type: 'date', required: true, half: true },
        { name: 'decision_on', label: 'Date de décision', type: 'date', half: true },
        { name: 'notes', label: 'Notes internes', type: 'textarea', rows: 3 },
      ],
      initial: editing ? {
        ...admission,
        gender: admission.gender || '',
        birth_date: dateInput(admission.birth_date),
        desired_class_id: admission.desired_class_id || '',
        guardian_name: admission.guardian_name || '',
        guardian_phone: admission.guardian_phone || '',
        guardian_email: admission.guardian_email || '',
        status: admission.status || 'nouveau',
        reference: admission.reference || '',
        applied_on: dateInput(admission.applied_on),
        decision_on: dateInput(admission.decision_on),
        notes: admission.notes || '',
      } : {
        status: 'nouveau',
        applied_on: today(),
        desired_class_id: classes[0]?.id || '',
      },
      submit: (payload) => (editing
        ? api.patch(`/admissions/${admission.id}`, payload)
        : api.post('/admissions', payload)),
      success: editing ? 'Dossier mis à jour.' : 'Dossier de candidature créé.',
      submitLabel: editing ? 'Enregistrer' : 'Créer le dossier',
    });
  }

  function enrollAdmission(admission) {
    if (!can('admissions.manage')) return;
    openConfirm(modal, {
      title: `Inscrire ${fullName(admission)} ?`,
      message: `Un dossier élève sera créé dans la classe ${admission.desired_class?.name || 'choisie'} avec un matricule automatique. La candidature passera au statut « Inscrit ».`,
      confirmLabel: 'Inscrire l’élève',
      busyLabel: 'Inscription…',
      destructive: false,
      icon: 'userPlus',
      onConfirm: () => api.post(`/admissions/${admission.id}/enroll`),
      success: 'Candidat inscrit et dossier élève créé.',
    });
  }

  function deleteAdmission(admission) {
    if (!can('admissions.manage')) return;
    openConfirm(modal, {
      title: 'Supprimer ce dossier ?',
      message: `${fullName(admission)} · ${admission.reference}. Le dossier de candidature sera définitivement supprimé.`,
      confirmLabel: 'Supprimer le dossier',
      onConfirm: () => api.del(`/admissions/${admission.id}`),
      success: 'Dossier supprimé.',
    });
  }

  /* ------------------------------------------------ documents */
  function documentForm(student, options = {}) {
    if (!can('documents.manage')) return;
    const target = student || students.find((item) => item.id === studentId);
    if (!target) {
      notify('Sélectionnez d’abord un élève.', { tone: 'danger' });
      return;
    }
    openResourceForm(modal, {
      title: 'Ajouter un document',
      sub: `${fullName(target)} · ${target.matricule}`,
      eyebrow: 'Dossier élève',
      icon: 'upload',
      variant: 'center',
      size: 580,
      fields: [
        { name: 'name', label: 'Nom du document', required: true, placeholder: 'Bulletin trimestre 1' },
        {
          name: 'type', label: 'Type', type: 'select', half: true,
          options: [
            { value: 'pdf', label: 'PDF' },
            { value: 'image', label: 'Image' },
            { value: 'doc', label: 'Document bureautique' },
          ],
        },
        { name: 'issued_on', label: 'Date du document', type: 'date', half: true },
        { name: 'file', label: 'Fichier', type: 'file', required: true, wide: true, accept: '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx' },
      ],
      initial: { issued_on: today(), type: 'pdf', file: null },
      submit: (payload, values) => {
        const form = new FormData();
        form.append('student_id', target.id);
        form.append('name', payload.name);
        if (payload.type) form.append('type', payload.type);
        if (payload.issued_on) form.append('issued_on', payload.issued_on);
        if (values.file) form.append('file', values.file);
        return api.upload('/documents', form);
      },
      success: 'Document ajouté au dossier.',
      submitLabel: 'Téléverser le document',
      onDone: options.onDone,
    });
  }

  function deleteDocument(document) {
    if (!can('documents.manage')) return;
    openConfirm(modal, {
      title: 'Supprimer ce document ?',
      message: `${document.name} sera retiré du dossier et le fichier sera supprimé du stockage.`,
      confirmLabel: 'Supprimer le document',
      onConfirm: () => api.del(`/documents/${document.id}`),
      success: 'Document supprimé.',
    });
  }

  /* ------------------------------------------------ photos */
  function photoForm(target, options = {}) {
    const kind = options.kind || 'student';
    const isUser = kind === 'user';
    const isSchool = kind === 'school';

    if (kind === 'student' && !can('students.manage')) return;
    if (kind === 'staff' && !can('staff.manage')) return;
    if (isSchool && !can('establishment.manage')) return;

    if (!isUser && !isSchool && !target?.id) {
      notify('Sélectionnez d’abord une fiche.', { tone: 'danger' });
      return;
    }

    const labels = {
      student: {
        title: 'Changer la photo de l’élève',
        sub: `${fullName(target)} · ${target?.matricule || ''}`,
        eyebrow: 'Dossier élève',
      },
      staff: {
        title: 'Changer la photo du membre',
        sub: `${fullName(target)} · ${target?.role || ''}`,
        eyebrow: 'Personnel',
      },
      school: {
        title: 'Changer le logo de l’établissement',
        sub: 'Cette image apparaît dans l’application et sur les documents.',
        eyebrow: 'Établissement',
      },
      user: {
        title: 'Changer la photo de profil',
        sub: 'Votre avatar dans la barre latérale et la barre supérieure.',
        eyebrow: 'Mon compte',
      },
    };

    const path = isUser
      ? '/me/avatar'
      : isSchool
        ? '/school/photo'
        : `/${kind === 'staff' ? 'staff' : 'students'}/${target.id}/photo`;

    openResourceForm(modal, {
      title: labels[kind].title,
      sub: labels[kind].sub,
      eyebrow: labels[kind].eyebrow,
      icon: 'upload',
      variant: 'center',
      size: 540,
      fields: [
        {
          name: 'photo',
          label: 'Image',
          type: 'file',
          required: true,
          wide: true,
          accept: 'image/jpeg,image/png,image/webp',
          help: 'JPG, PNG ou WebP · 8 Mo maximum',
        },
      ],
      initial: { photo: null },
      submit: (payload, values) => {
        const form = new FormData();
        if (values.photo) form.append(isUser ? 'avatar' : 'photo', values.photo);
        return api.upload(path, form);
      },
      success: 'Photo mise à jour.',
      submitLabel: 'Téléverser la photo',
      onDone: options.onDone,
    });
  }

  /* ------------------------------------------------ messagerie */
  function threadForm() {
    if (!can('messages.manage')) return;
    openResourceForm(modal, {
      title: 'Nouveau message',
      sub: 'Aux familles ou à l’équipe',
      eyebrow: 'Messagerie',
      icon: 'messages',
      variant: 'center',
      size: 620,
      fields: [
        { name: 'subject', label: 'Objet', required: true, placeholder: 'Suivi de l’assiduité — octobre' },
        {
          name: 'type', label: 'Destinataires', type: 'select', half: true,
          options: [
            { value: 'parent', label: 'Familles' },
            { value: 'internal', label: 'Équipe interne' },
          ],
        },
        { name: 'sender_name', label: 'Expéditeur', half: true, default: 'Direction' },
        { name: 'body', label: 'Message', type: 'textarea', required: true, rows: 6, placeholder: 'Bonjour, …' },
      ],
      initial: { type: 'parent', sender_name: 'Direction' },
      submit: (payload) => api.post('/threads', payload),
      success: 'Message envoyé.',
      submitLabel: 'Envoyer le message',
    });
  }

  function threadEditForm(thread) {
    if (!can('messages.manage')) return;
    openResourceForm(modal, {
      title: 'Modifier la conversation',
      sub: thread.subject,
      eyebrow: 'Messagerie',
      icon: 'messages',
      variant: 'center',
      size: 560,
      fields: [
        { name: 'subject', label: 'Objet', required: true },
        {
          name: 'type', label: 'Type', type: 'select', half: true,
          options: [
            { value: 'parent', label: 'Familles' },
            { value: 'internal', label: 'Équipe interne' },
          ],
        },
        { name: 'is_archived', label: 'Archivage', type: 'checkbox', half: true, switchLabel: 'Conversation archivée' },
      ],
      initial: { subject: thread.subject, type: thread.type, is_archived: Boolean(thread.is_archived) },
      submit: (payload) => api.patch(`/threads/${thread.id}`, payload),
      success: 'Conversation mise à jour.',
      submitLabel: 'Enregistrer',
    });
  }

  function deleteThread(thread) {
    if (!can('messages.manage')) return;
    openConfirm(modal, {
      title: 'Supprimer cette conversation ?',
      message: `« ${thread.subject} » et tous ses messages seront définitivement supprimés.`,
      confirmLabel: 'Supprimer la conversation',
      onConfirm: () => api.del(`/threads/${thread.id}`),
      success: 'Conversation supprimée.',
    });
  }

  /* ------------------------------------------------ départements et frais */
  function departmentForm(department) {
    if (!can('referentiels.manage')) return;
    const editing = Boolean(department?.id);
    openResourceForm(modal, {
      title: editing ? 'Modifier le département' : 'Nouveau département',
      sub: editing ? department.name : 'Organisation pédagogique',
      eyebrow: 'Paramètres',
      icon: 'classes',
      variant: 'center',
      size: 520,
      fields: [
        { name: 'name', label: 'Nom du département', required: true, half: true, placeholder: 'Sciences' },
        { name: 'code', label: 'Code', required: true, half: true, placeholder: 'SCI' },
      ],
      initial: editing ? { name: department.name, code: department.code } : {},
      submit: (payload) => (editing
        ? api.patch(`/references/departments/${department.id}`, payload)
        : api.post('/references/departments', payload)),
      success: editing ? 'Département mis à jour.' : 'Département créé.',
      submitLabel: editing ? 'Enregistrer' : 'Créer le département',
    });
  }

  function deleteDepartment(department) {
    if (!can('referentiels.manage')) return;
    openConfirm(modal, {
      title: `Supprimer ${department.name} ?`,
      message: 'Les matières et membres rattachés à ce département seront détachés. Cette action ne supprime pas les personnes.',
      confirmLabel: 'Supprimer le département',
      onConfirm: () => api.del(`/references/departments/${department.id}`),
      success: 'Département supprimé.',
    });
  }

  function feeTypeForm(feeType) {
    if (!can('referentiels.manage')) return;
    const editing = Boolean(feeType?.id);
    openResourceForm(modal, {
      title: editing ? 'Modifier les frais' : 'Nouveau type de frais',
      sub: editing ? `${feeType.name} · ${feeType.code}` : 'Grille tarifaire',
      eyebrow: 'Finances',
      icon: 'finance',
      variant: 'center',
      size: 560,
      fields: [
        { name: 'name', label: 'Libellé', required: true, half: true, placeholder: 'Frais de scolarité' },
        { name: 'code', label: 'Code', required: true, half: true, placeholder: 'SCOL' },
        { name: 'default_amount', label: `Montant par défaut (${currency})`, type: 'number', min: 0, step: '0.01', half: true },
        { name: 'is_recurring', label: 'Frais récurrent', type: 'checkbox', half: true, switchLabel: 'Facturé chaque période' },
        { name: 'is_active', label: 'Type actif', type: 'checkbox', half: true, switchLabel: 'Proposé à la facturation' },
      ],
      initial: editing ? {
        name: feeType.name,
        code: feeType.code,
        default_amount: feeType.default_amount,
        is_recurring: Boolean(feeType.is_recurring),
        is_active: Boolean(feeType.is_active),
      } : {
        default_amount: 0,
        is_recurring: false,
        is_active: true,
      },
      submit: (payload) => (editing
        ? api.patch(`/references/fee-types/${feeType.id}`, payload)
        : api.post('/references/fee-types', payload)),
      success: editing ? 'Type de frais mis à jour.' : 'Type de frais créé.',
      submitLabel: editing ? 'Enregistrer' : 'Créer le type de frais',
    });
  }

  function deleteFeeType(feeType) {
    if (!can('referentiels.manage')) return;
    openConfirm(modal, {
      title: `Supprimer ${feeType.name} ?`,
      message: 'Ce type de frais ne sera plus proposé lors de la création d’une facture. Les factures existantes restent inchangées.',
      confirmLabel: 'Supprimer le type de frais',
      onConfirm: () => api.del(`/references/fee-types/${feeType.id}`),
      success: 'Type de frais supprimé.',
    });
  }

  /* ------------------------------------------------ années et trimestres */
  function yearForm(year) {
    if (!can('referentiels.manage')) return;
    const editing = Boolean(year?.id);
    openResourceForm(modal, {
      title: editing ? 'Modifier l’année scolaire' : 'Nouvelle année scolaire',
      sub: editing ? year.label : 'Calendrier de l’établissement',
      eyebrow: 'Paramètres',
      icon: 'calendar',
      variant: 'center',
      size: 580,
      fields: [
        { name: 'label', label: 'Libellé', required: true, half: true, placeholder: '2026-2027' },
        { name: 'is_current', label: 'Année courante', type: 'checkbox', half: true, switchLabel: 'Utiliser par défaut' },
        { name: 'starts_on', label: 'Début', type: 'date', required: true, half: true },
        { name: 'ends_on', label: 'Fin', type: 'date', required: true, half: true },
      ],
      initial: editing ? {
        ...year,
        starts_on: dateInput(year.starts_on),
        ends_on: dateInput(year.ends_on),
        is_current: Boolean(year.is_current),
      } : { is_current: false, starts_on: today(), ends_on: addDays(300) },
      submit: (payload) => (editing
        ? api.patch(`/references/academic-years/${year.id}`, payload)
        : api.post('/references/academic-years', payload)),
      success: editing ? 'Année scolaire mise à jour.' : 'Année scolaire créée.',
      submitLabel: editing ? 'Enregistrer' : 'Créer l’année',
    });
  }

  async function termForm(term) {
    if (!can('referentiels.manage')) return;
    const editing = Boolean(term?.id);
    let years = [];
    try {
      const payload = await api.get('/references/academic-years');
      years = payload?.academic_years || [];
    } catch {
      years = [];
    }
    if (!years.length && currentYear) years = [currentYear];
    openResourceForm(modal, {
      title: editing ? 'Modifier le trimestre' : 'Nouveau trimestre',
      sub: editing ? term.name : 'Découpage de l’année scolaire',
      eyebrow: 'Paramètres',
      icon: 'clock',
      variant: 'center',
      size: 580,
      fields: [
        {
          name: 'academic_year_id', label: 'Année scolaire', type: 'select', required: true,
          options: years.map((year) => ({ value: year.id, label: year.label })),
        },
        { name: 'name', label: 'Nom', required: true, half: true, placeholder: 'Semestre 1' },
        { name: 'is_current', label: 'Période courante', type: 'checkbox', half: true, switchLabel: 'Utiliser par défaut' },
        { name: 'starts_on', label: 'Début', type: 'date', required: true, half: true },
        { name: 'ends_on', label: 'Fin', type: 'date', required: true, half: true },
      ],
      initial: editing ? {
        ...term,
        academic_year_id: term.academic_year_id,
        starts_on: dateInput(term.starts_on),
        ends_on: dateInput(term.ends_on),
        is_current: Boolean(term.is_current),
      } : {
        academic_year_id: term?.academic_year_id || currentYear?.id || years[0]?.id || '',
        is_current: false,
        starts_on: today(),
        ends_on: addDays(90),
      },
      submit: (payload) => (editing
        ? api.patch(`/references/terms/${term.id}`, payload)
        : api.post('/references/terms', payload)),
      success: editing ? 'Trimestre mis à jour.' : 'Trimestre créé.',
      submitLabel: editing ? 'Enregistrer' : 'Créer le trimestre',
    });
  }

  function deleteYear(year) {
    if (!can('referentiels.manage')) return;
    openConfirm(modal, {
      title: `Supprimer l’année ${year.label} ?`,
      message: 'Les classes, trimestres et factures rattachés à cette année peuvent être supprimés en cascade.',
      confirmLabel: 'Supprimer l’année',
      onConfirm: () => api.del(`/references/academic-years/${year.id}`),
      success: 'Année scolaire supprimée.',
    });
  }

  function deleteTerm(term) {
    if (!can('referentiels.manage')) return;
    openConfirm(modal, {
      title: `Supprimer ${term.name} ?`,
      message: 'Les notes et factures rattachées à cette période ne seront plus associées à un trimestre.',
      confirmLabel: 'Supprimer le trimestre',
      onConfirm: () => api.del(`/references/terms/${term.id}`),
      success: 'Trimestre supprimé.',
    });
  }

  /* ------------------------------------------------ comptes */
  function profile(account) {
    const target = account || user;
    if (!target?.id) return;

    const self = target.id === user?.id;

    modal.open({
      title: target.name || 'Profil',
      sub: self ? 'Votre compte' : (target.email || 'Compte utilisateur'),
      eyebrow: 'Profil',
      icon: 'profile',
      size: 540,
      body: (
        <UserProfileBody
          account={target}
          self={self}
          canManage={can('users.manage')}
          canOpenSettings={can('settings.view')}
          onEdit={() => {
            modal.close();
            userForm(target);
          }}
          onOpenSettings={() => {
            modal.close();
            window.location.hash = 'parametres';
          }}
        />
      ),
      actions: [{ label: 'Fermer', onClick: () => modal.close() }],
    });
  }

  function parentForm(account) {
    if (!can('users.manage')) return;

    const editing = Boolean(account?.id);
    const classById = new Map((meta?.classes || []).map((entry) => [entry.id, entry]));
    const studentOptions = (meta?.students || []).map((student) => ({
      value: String(student.id),
      label: fullName(student),
      hint: `${student.matricule || '—'} · ${classById.get(student.school_class_id)?.name || 'Sans classe'}`,
    }));

    openResourceForm(modal, {
      title: editing ? 'Modifier le compte parent' : 'Nouveau compte parent',
      sub: editing ? account.email : 'Le parent ne voit que les enfants qui lui sont liés.',
      eyebrow: 'Comptes parents',
      icon: 'profile',
      variant: 'center',
      size: 620,
      fields: [
        { name: 'name', label: 'Nom du parent', required: true, placeholder: 'Fatou Traoré' },
        { name: 'email', label: 'Adresse e-mail', type: 'email', required: true, placeholder: 'parent@exemple.com' },
        {
          name: 'password',
          label: editing ? 'Nouveau mot de passe (facultatif)' : 'Mot de passe',
          type: 'password',
          required: !editing,
          placeholder: '10 caractères minimum',
          help: editing
            ? 'Laisser vide pour conserver le mot de passe actuel.'
            : 'À transmettre au parent après la création.',
        },
        {
          name: 'student_ids',
          label: 'Enfants liés au compte',
          type: 'multiselect',
          required: true,
          wide: true,
          options: studentOptions,
          help: 'Le parent verra uniquement ces élèves (notes, absences, finances).',
        },
      ],
      initial: {
        name: account?.name || '',
        email: account?.email || '',
        password: '',
        student_ids: (account?.children || []).map((child) => String(child.id)),
      },
      submit: (payload) => {
        const body = {
          ...payload,
          role: ROLE_PARENT,
          student_ids: (payload.student_ids || []).map(Number),
        };
        if (!body.password) delete body.password;
        return editing
          ? api.patch(`/users/${account.id}`, body)
          : api.post('/users', body);
      },
      success: editing ? 'Compte parent enregistré.' : 'Compte parent créé.',
      submitLabel: editing ? 'Enregistrer' : 'Créer le compte parent',
    });
  }

  function userForm(account) {
    if (!can('users.manage')) return;
    if (account?.role === ROLE_PARENT) return parentForm(account);

    const editing = Boolean(account?.id);

    openResourceForm(modal, {
      title: editing ? 'Modifier le compte' : 'Nouveau compte',
      sub: editing ? account.email : 'Créer un accès pour un membre de l’équipe',
      eyebrow: 'Comptes et accès',
      icon: 'profile',
      variant: 'center',
      size: 580,
      fields: [
        { name: 'name', label: 'Nom complet', required: true, placeholder: 'Aminata Barry' },
        { name: 'email', label: 'Adresse e-mail', type: 'email', required: true, placeholder: 'prenom@mon-ecole.com' },
        {
          name: 'role',
          label: 'Rôle',
          type: 'select',
          required: true,
          options: ROLES.filter((role) => role !== ROLE_PARENT).map((role) => ({ value: role, label: ROLE_LABELS[role] })),
          help: 'Le rôle détermine les pages et les actions autorisées.',
        },
        {
          name: 'password',
          label: editing ? 'Nouveau mot de passe (facultatif)' : 'Mot de passe',
          type: 'password',
          required: !editing,
          placeholder: '10 caractères minimum',
          help: editing ? 'Laisser vide pour conserver le mot de passe actuel.' : undefined,
        },
      ],
      initial: {
        name: account?.name || '',
        email: account?.email || '',
        role: account?.role || 'enseignant',
        password: '',
      },
      submit: (payload) => (editing
        ? api.patch(`/users/${account.id}`, payload)
        : api.post('/users', payload)),
      success: editing ? 'Compte mis à jour.' : 'Compte créé.',
      submitLabel: editing ? 'Enregistrer' : 'Créer le compte',
    });
  }

  function deleteUser(account) {
    if (!can('users.manage')) return;

    openConfirm(modal, {
      title: `Supprimer ${account.name} ?`,
      message: 'Ce compte ne pourra plus se connecter à l’application.',
      confirmLabel: 'Supprimer le compte',
      onConfirm: () => api.del(`/users/${account.id}`),
      success: 'Compte supprimé.',
    });
  }

  return {
    student: studentForm,
    studentDrawer,
    deleteStudent,
    classRoom: classForm,
    deleteClass,
    subject: subjectForm,
    deleteSubject,
    staff: staffForm,
    deleteStaff,
    slot: slotForm,
    deleteSlot,
    grade: gradeForm,
    deleteGrade,
    absence: absenceForm,
    justifyAbsence,
    deleteAbsence,
    invoice: invoiceForm,
    deleteInvoice,
    invoiceView: invoiceDetail,
    invoicePdf,
    payment: paymentForm,
    deletePayment,
    admission: admissionForm,
    enrollAdmission,
    deleteAdmission,
    document: documentForm,
    deleteDocument,
    photo: photoForm,
    thread: threadForm,
    threadEdit: threadEditForm,
    deleteThread,
    year: yearForm,
    deleteYear,
    term: termForm,
    deleteTerm,
    department: departmentForm,
    deleteDepartment,
    feeType: feeTypeForm,
    deleteFeeType,
    user: userForm,
    parent: parentForm,
    profile,
    deleteUser,
    nextMatricule,
    money: (value) => money(value, currency),
    compactMoney: (value) => compactMoney(value, currency),
    currency,
  };
}
