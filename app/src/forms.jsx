import React, {
  useEffect, useMemo, useRef, useState,
} from 'react';
import { Icon, Btn } from './ui.jsx';
import { useData } from './data.jsx';
import { ApiError, errorMessage } from './api.js';

/* ============================================================
   Kalanso — formulaires, confirmations et contrôles de liste
   Un seul moteur de formulaire alimente toutes les ressources.
   ============================================================ */

const normalizeOptions = (options = []) => options.map((option) => {
  if (option == null) return { value: '', label: '—' };
  if (typeof option === 'string' || typeof option === 'number') {
    return { value: option, label: String(option) };
  }
  return {
    value: option.value ?? option.id ?? '',
    label: option.label ?? option.name ?? String(option.value ?? ''),
    disabled: option.disabled,
  };
});

const blankValue = (field) => {
  if (field.type === 'checkbox') return Boolean(field.default);
  if (field.type === 'file') return field.multiple ? [] : null;
  if (field.default !== undefined) return field.default;
  return '';
};

const isEmpty = (value) => value === '' || value === null || value === undefined
  || (Array.isArray(value) && value.length === 0);

const buildValues = (fields, initial) => {
  const values = {};
  fields.forEach((field) => {
    if (!field.name || field.type === 'section') return;
    const incoming = initial?.[field.name];
    values[field.name] = incoming === undefined || incoming === null ? blankValue(field) : incoming;
  });
  return values;
};

const initialsFor = (value = '') => String(value)
  .split(/\s+/)
  .filter(Boolean)
  .map((part) => part[0])
  .join('')
  .slice(0, 2)
  .toUpperCase();

/* ============================================================
   Formulaire générique
   ============================================================ */
function ResourceForm({
  config, onClose,
}) {
  const {
    title, fields = [], initial = {}, submit, submitLabel = 'Enregistrer',
    success = 'Modifications enregistrées.', intro, onDone, columns = 2, extra,
  } = config;
  const { notify, refresh } = useData();
  const [values, setValues] = useState(() => buildValues(fields, initial));
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const groups = useMemo(() => {
    const result = [];
    fields.forEach((field) => {
      if (field.type === 'section') {
        result.push({ label: field.label, hint: field.hint, fields: [] });
      } else {
        if (!result.length) result.push({ label: null, fields: [] });
        result[result.length - 1].fields.push(field);
      }
    });
    return result;
  }, [fields]);

  const setField = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    }
    if (message) setMessage('');
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (busy) return;

    const missing = fields.filter((field) => field.required && field.type !== 'section'
      && isEmpty(values[field.name]));
    if (missing.length) {
      const next = {};
      missing.forEach((field) => { next[field.name] = 'Ce champ est obligatoire.'; });
      setErrors(next);
      setMessage('Complétez les champs obligatoires avant d’enregistrer.');
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      const payload = {};
      fields.forEach((field) => {
        if (!field.name || field.type === 'section' || field.type === 'file') return;
        const value = values[field.name];
        if (field.type === 'checkbox') {
          payload[field.name] = Boolean(value);
        } else if (typeof value === 'string') {
          const trimmed = value.trim();
          payload[field.name] = trimmed === '' && !field.required ? null : trimmed;
        } else {
          payload[field.name] = value ?? null;
        }
      });

      const result = await submit(payload, values);
      notify(success);
      refresh();
      onClose();
      onDone?.(result);
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.errors).length) {
        const next = {};
        Object.entries(error.errors).forEach(([key, messages]) => {
          next[key] = Array.isArray(messages) ? messages[0] : String(messages);
        });
        setErrors(next);
        setMessage('Certains champs doivent être corrigés.');
      } else {
        setMessage(errorMessage(error));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="resource-form" onSubmit={submitForm} noValidate>
      {intro && <div className="form-intro">{intro}</div>}
      {message && (
        <div className="form-alert" role="alert">
          <Icon name="close" size={14} />
          <span>{message}</span>
        </div>
      )}

      {groups.map((group, groupIndex) => (
        <div className="mcard" key={`${group.label || 'group'}-${groupIndex}`}>
          {group.label && (
            <div className="mcard-head">
              {group.label}
              {group.hint && <em>{group.hint}</em>}
            </div>
          )}
          <div className={`form-rows cols-${Math.min(2, Math.max(1, Number(columns) || 1))}`}>
            {group.fields.map((field) => (
              <FormField
                key={field.name}
                field={field}
                value={values[field.name]}
                error={errors[field.name]}
                disabled={busy}
                onChange={(value) => setField(field.name, value)}
              />
            ))}
          </div>
        </div>
      ))}

      {extra}

      <div className="form-footer">
        <span className="form-hint"><kbd>Échap</kbd> pour annuler</span>
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose} disabled={busy}>Annuler</button>
          <button type="submit" className="btn solid" disabled={busy}>
            {busy ? <span className="spinner" /> : <Icon name="check" size={14} />}
            {busy ? 'Enregistrement…' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

function FormField({
  field, value, error, disabled, onChange,
}) {
  const id = `f-${field.name}`;
  const options = useMemo(() => normalizeOptions(
    typeof field.options === 'function' ? field.options() : field.options,
  ), [field.options]);

  const common = {
    id,
    name: field.name,
    disabled: disabled || field.readOnly,
    placeholder: field.placeholder,
    autoComplete: field.autoComplete || 'off',
    'aria-invalid': error ? 'true' : undefined,
  };

  let control;
  switch (field.type) {
    case 'select':
      control = (
        <span className="mselect">
          <select
            {...common}
            className="input"
            value={value ?? ''}
            onChange={(event) => onChange(event.target.value)}
          >
            {field.placeholder !== false && <option value="">{field.placeholder || '— Sélectionner —'}</option>}
            {options.map((option) => (
              <option key={`${option.value}`} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <Icon name="chevronR" size={12} className="mselect-caret" />
        </span>
      );
      break;
    case 'textarea':
      control = (
        <textarea
          {...common}
          className="input textarea"
          rows={field.rows || 3}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
        />
      );
      break;
    case 'checkbox':
      control = (
        <button
          type="button"
          id={id}
          className={`form-switch ${value ? 'on' : ''}`}
          role="switch"
          aria-checked={Boolean(value)}
          disabled={disabled}
          onClick={() => onChange(!value)}
        >
          <i />
          <span>{field.switchLabel || (value ? 'Actif' : 'Inactif')}</span>
        </button>
      );
      break;
    case 'file': {
      const files = field.multiple
        ? (Array.isArray(value) ? value : [])
        : (value ? [value] : []);
      const totalSize = files.reduce((sum, file) => sum + Number(file?.size || 0), 0);
      const label = files.length
        ? (files.length === 1 ? files[0].name : `${files.length} fichiers sélectionnés`)
        : (field.fileLabel || 'Choisir un fichier');
      const detail = files.length
        ? (files.length === 1
          ? `${Math.max(1, Math.round(totalSize / 1024))} Ko`
          : `${files.map((file) => file.name).join(' · ')} — ${Math.max(1, Math.round(totalSize / 1024))} Ko`)
        : (field.help || 'PDF, JPG, PNG ou DOCX · 10 Mo maximum');

      control = (
        <span className={`file-drop ${error ? 'invalid' : ''}`}>
          <input
            id={id}
            type="file"
            accept={field.accept}
            multiple={field.multiple}
            disabled={disabled}
            onChange={(event) => {
              const selected = Array.from(event.target.files || []);
              onChange(field.multiple ? selected : (selected[0] || null));
            }}
          />
          <span className="file-ic"><Icon name="download" size={16} /></span>
          <span className="file-copy">
            <b>{label}</b>
            <em title={detail}>{detail}</em>
          </span>
        </span>
      );
      break;
    }
    case 'number':
    case 'date':
    case 'time':
    case 'email':
    case 'tel':
    case 'url':
    case 'password':
      control = (
        <input
          {...common}
          className="input"
          type={field.type}
          value={value ?? ''}
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={(event) => onChange(event.target.value)}
        />
      );
      break;
    default:
      control = (
        <input
          {...common}
          className="input"
          type={field.type || 'text'}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
        />
      );
  }

  return (
    <div className={`mfield field-${field.name} ${field.wide || field.type === 'textarea' ? 'span-2' : ''} ${error ? 'invalid' : ''}`}>
      <label className="mfield-label" htmlFor={id}>
        {field.label}
        {field.required && <i className="req">*</i>}
        {field.hint && <em>{field.hint}</em>}
      </label>
      {control}
      {field.help && field.type !== 'file' && <span className="field-help">{field.help}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

export function openResourceForm(modal, config) {
  return modal.open({
    title: config.title,
    sub: config.sub,
    eyebrow: config.eyebrow,
    icon: config.icon || 'plus',
    variant: config.variant || 'wide',
    size: config.size,
    body: <ResourceForm config={config} onClose={() => modal.close()} />,
    footer: null,
    dismissible: config.dismissible,
  });
}

/* ============================================================
   Confirmation destructive / action asynchrone
   ============================================================ */
function ConfirmBody({
  config, onClose,
}) {
  const {
    message, confirmLabel = 'Supprimer', busyLabel = 'Suppression…', destructive = true,
    onConfirm, success = 'Action effectuée.', onDone, extra,
  } = config;
  const { notify, refresh } = useData();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await onConfirm();
      notify(success);
      refresh();
      onClose();
      onDone?.(result);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="confirm-body">
      <div className="confirm-copy">
        {typeof message === 'string' ? <p className="mtext">{message}</p> : message}
      </div>
      {extra}
      {error && (
        <div className="form-alert" role="alert">
          <Icon name="close" size={14} />
          <span>{error}</span>
        </div>
      )}
      <div className="form-footer">
        <span className="form-hint"><kbd>Échap</kbd> pour annuler</span>
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose} disabled={busy}>Annuler</button>
          <button type="button" className={`btn ${destructive ? 'danger' : 'solid'}`} onClick={run} disabled={busy}>
            {busy ? <span className="spinner" /> : <Icon name={destructive ? 'close' : 'check'} size={14} />}
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function openConfirm(modal, config) {
  return modal.open({
    title: config.title || 'Confirmer cette action ?',
    sub: config.sub || (config.destructive === false ? 'Confirmez pour continuer.' : 'Cette action est définitive.'),
    icon: config.icon || (config.destructive === false ? 'check' : 'close'),
    tone: config.destructive === false ? 'success' : 'danger',
    variant: 'center',
    size: 460,
    body: <ConfirmBody config={config} onClose={() => modal.close()} />,
    footer: null,
  });
}

/* ============================================================
   Menus d'actions de ligne
   ============================================================ */
export function ActionMenu({ actions = [], label = 'Actions' }) {
  const { can } = useData();
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const visible = actions.filter((action) => (
    action && !action.hidden && (!action.permission || can(action.permission))
  ));

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (root.current && !root.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!visible.length) return null;

  return (
    <span className={`action-menu ${open ? 'open' : ''}`} ref={root}>
      <button
        type="button"
        className="icon-btn action-trigger"
        title={label}
        aria-label={label}
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <Icon name="dots" size={15} />
      </button>
      {open && (
        <span className="action-pop" role="menu">
          {visible.map((action, index) => (
            <button
              key={`${action.label}-${index}`}
              type="button"
              role="menuitem"
              className={`action-item ${action.tone === 'danger' ? 'danger' : ''}`}
              onClick={(event) => {
                event.stopPropagation();
                setOpen(false);
                action.onClick?.();
              }}
            >
              {action.icon && <Icon name={action.icon} size={13} />}
              {action.label}
            </button>
          ))}
        </span>
      )}
    </span>
  );
}

/* ============================================================
   Contrôles de liste
   ============================================================ */
export function SearchInput({ value, onChange, placeholder = 'Rechercher…', label = 'Rechercher' }) {
  return (
    <label className="search-field">
      <Icon name="search" size={14} className="search-field-ic" />
      <input
        type="search"
        className="input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        spellCheck="false"
      />
      {value && (
        <button type="button" className="search-clear" onClick={() => onChange('')} aria-label="Effacer">
          <Icon name="close" size={11} />
        </button>
      )}
    </label>
  );
}

export function SelectFilter({ value, onChange, options = [], label }) {
  return (
    <label className="filter-select">
      <span className="filter-label">{label}</span>
      <span className="mselect">
        <select className="input" value={value ?? ''} onChange={(event) => onChange(event.target.value)}>
          {normalizeOptions(options).map((option) => (
            <option key={`${option.value}`} value={option.value}>{option.label}</option>
          ))}
        </select>
        <Icon name="chevronR" size={12} className="mselect-caret" />
      </span>
    </label>
  );
}

export function Pager({ meta, onPage }) {
  if (!meta || !meta.total) return null;
  const page = meta.current_page || 1;
  const last = meta.last_page || 1;
  return (
    <span className="pager">
      <button type="button" className="pager-btn" onClick={() => onPage(Math.max(1, page - 1))} disabled={page <= 1} aria-label="Page précédente">
        <Icon name="chevronL" size={12} />
      </button>
      <span className="pager-label">{page} / {last}</span>
      <button type="button" className="pager-btn" onClick={() => onPage(Math.min(last, page + 1))} disabled={page >= last} aria-label="Page suivante">
        <Icon name="chevronR" size={12} />
      </button>
    </span>
  );
}

export function ListState({
  loading, error, empty, emptyTitle = 'Aucun résultat', emptySub, onRetry, children, rows = 4,
}) {
  if (loading) {
    return (
      <div className="state-box state-loading" aria-live="polite">
        <span className="spinner large" />
        <b>Chargement des données…</b>
        <span>Connexion à l’API Kalanso</span>
        <div className="skeleton-lines" aria-hidden="true">
          {Array.from({ length: rows }).map((_, index) => <i key={index} />)}
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="state-box state-error" role="alert">
        <span className="state-ic"><Icon name="close" size={18} /></span>
        <b>Impossible de charger cette vue</b>
        <span>{errorMessage(error)}</span>
        {onRetry && <Btn icon="refresh" onClick={onRetry}>Réessayer</Btn>}
      </div>
    );
  }
  if (empty) {
    return (
      <div className="state-box state-empty">
        <span className="state-ic"><Icon name="search" size={18} /></span>
        <b>{emptyTitle}</b>
        {emptySub && <span>{emptySub}</span>}
      </div>
    );
  }
  return children;
}

/* ============================================================
   Export CSV
   ============================================================ */
export function exportCsv(filename, columns, rows) {
  const escape = (value) => {
    const text = value == null ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };
  const header = columns.map((column) => escape(column.label)).join(';');
  const body = rows.map((row) => columns.map((column) => {
    const value = typeof column.value === 'function' ? column.value(row) : row[column.value];
    return escape(value);
  }).join(';')).join('\r\n');
  const blob = new Blob([`\uFEFF${header}\r\n${body}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
