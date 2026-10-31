import React from 'react';
import { PageHeader } from '../layout.jsx';
import { Avatar, Pill } from '../ui.jsx';
import { META } from './meta.js';
import { fullName, initials, STUDENT_STATUS, INVOICE_STATUS, PAYMENT_STATUS, ADMISSION_STATUS, number } from '../data.jsx';

export function PageHead({
  id, sub, primary, secondary, onPrimary, onSecondary, children,
}) {
  const base = META[id] || META.dashboard;
  const page = {
    ...base,
    sub: sub || base.sub,
    primary: primary === undefined ? base.primary : primary,
    secondary: secondary === undefined ? base.secondary : secondary,
  };
  return (
    <PageHeader page={page} onPrimary={onPrimary} onSecondary={onSecondary}>
      {children}
    </PageHeader>
  );
}

export function StudentCell({ student, sub, size = 28 }) {
  return (
    <span className="cell-who">
      <Avatar initials={student?.initials || initials(fullName(student))} size={size} src={student?.photo_url} />
      <span>
        <b>{fullName(student)}</b>
        <em>{sub || student?.matricule || '—'}</em>
      </span>
    </span>
  );
}

export function StatusPill({ status, map = STUDENT_STATUS }) {
  const entry = map[status] || { label: status || '—', tone: 'muted' };
  return <Pill tone={entry.tone}>{entry.label}</Pill>;
}

export const InvoicePill = ({ status }) => <StatusPill status={status} map={INVOICE_STATUS} />;
export const PaymentPill = ({ status }) => <StatusPill status={status} map={PAYMENT_STATUS} />;
export const AdmissionPill = ({ status }) => <StatusPill status={status} map={ADMISSION_STATUS} />;

export const average = (value) => (value == null ? '—' : number(value, 2));

export function PageSection({ title, sub, right, children, className = '', delay }) {
  return (
    <section className={`card pad ${className}`} style={delay ? { animationDelay: delay } : undefined}>
      {(title || right) && (
        <div className="card-head">
          <div>
            {title && <h3>{title}</h3>}
            {sub && <span>{sub}</span>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}
