import React from 'react';

/* ============================================================
   DIALLO — composants d'affichage (présentation pure)
   Aucun composant ne contient de logique métier.
   ============================================================ */

/* ---------- icônes ---------- */
const P = {
  dashboard: 'M4 11l8-7 8 7M6 10v10h12V10',
  students: 'M9 12a3 3 0 100-6 3 3 0 000 6zM4 20c0-3 2.2-5 5-5s5 2 5 5M17 12.2a2.2 2.2 0 100-4.4 2.2 2.2 0 000 4.4M15.5 20c0-2.4 1.2-3.8 3-3.8',
  classes: 'M4 6h7v7H4zM13 6h7v7h-7zM4 15h7v5H4zM13 15h7v5h-7z',
  calendar: 'M4 6h16v15H4zM4 10h16M9 3v4M15 3v4',
  finance: 'M12 20a8 8 0 100-16 8 8 0 000 16zM12 8v8M9.5 10.5h4a1.5 1.5 0 010 3h-4a1.5 1.5 0 000 3h4',
  staff: 'M12 11a3 3 0 100-6 3 3 0 000 6zM6 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5',
  grades: 'M4 19V6M4 19h16M8 16v-5M12.5 16V8M17 16v-3',
  absences: 'M4 6h16v15H4zM4 10h16M8 15l2 2 4-4',
  messages: 'M20 15a3 3 0 01-3 3H9l-5 3V7a3 3 0 013-3h10a3 3 0 013 3z',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM12 3v2.2M12 18.8V21M4.2 7.5l1.9 1.1M17.9 15.4l1.9 1.1M4.2 16.5l1.9-1.1M17.9 8.6l1.9-1.1',
  admissions: 'M12 3l8 4-8 4-8-4 8-4zM4 11l8 4 8-4M4 15l8 4 8-4',
  profile: 'M12 12.4a3.4 3.4 0 100-6.8 3.4 3.4 0 000 6.8zM5 20c0-3.6 3-6 7-6s7 2.4 7 6',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-3.5-3.5',
  bell: 'M18 8a6 6 0 10-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10.3 21a2 2 0 003.4 0',
  plus: 'M12 5v14M5 12h14',
  download: 'M12 3v12M8 11l4 4 4-4M4 19h16',
  chevronL: 'M15 6l-6 6 6 6',
  chevronR: 'M9 6l6 6-6 6',
  close: 'M6 6l12 12M18 6L6 18',
  filter: 'M4 6h16M7 12h10M10 18h4',
  dots: 'M6 12h.01M12 12h.01M18 12h.01',
  check: 'M4 12l5 5L20 6',
  play: 'M8 5l11 7-11 7z',
  pause: 'M9 5h3v14H9zM14 5h3v14h-3z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
};

export function Icon({ name, size = 16, className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`ic ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={P[name] || P.dashboard} />
    </svg>
  );
}

/* ---------- atomes ---------- */
export function Avatar({ initials = 'MD', tone = 'accent', size = 30 }) {
  return (
    <span className={`avatar tone-${tone}`} style={{ width: size, height: size, fontSize: size * 0.34 }}>
      {initials}
    </span>
  );
}

export function Pill({ children, tone = 'glass', dot = false }) {
  return (
    <span className={`pill pill-${tone}`}>
      {dot && <i className="pill-dot" />}
      {children}
    </span>
  );
}

export function Btn({ children, icon, solid = false, onClick, title }) {
  return (
    <button type="button" className={`btn ${solid ? 'solid' : ''}`} onClick={onClick} title={title}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </button>
  );
}

export function IconBtn({ icon, onClick, title, badge = false, className = '' }) {
  return (
    <button type="button" className={`icon-btn ${className}`} onClick={onClick} title={title} aria-label={title}>
      <Icon name={icon} size={15} />
      {badge && <i className="dot-badge" />}
    </button>
  );
}

export function Card({ children, className = '', pad = true, style }) {
  return (
    <div className={`card ${pad ? 'pad' : ''} ${className}`} style={style}>
      {children}
    </div>
  );
}

export function CardHead({ title, sub, right }) {
  return (
    <div className="card-head">
      <div>
        <h3>{title}</h3>
        {sub && <span>{sub}</span>}
      </div>
      {right}
    </div>
  );
}

export function SectionTitle({ children, right }) {
  return (
    <div className="section-title">
      <span>{children}</span>
      {right}
    </div>
  );
}

export function Progress({ value = 0, tone = 'accent', height = 4 }) {
  return (
    <span className={`progress tone-${tone}`} style={{ height }}>
      <i style={{ width: `${value}%` }} />
    </span>
  );
}

export function Divider() {
  return <span className="divider" />;
}

export function Field({ label, value, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children || <input className="input" defaultValue={value} readOnly />}
    </label>
  );
}

export function Toggle({ on = false, label }) {
  return (
    <div className="toggle-row">
      <span>{label}</span>
      <span className={`toggle ${on ? 'on' : ''}`} role="switch" aria-checked={on} tabIndex={0}>
        <i />
      </span>
    </div>
  );
}

export function Tabs({ items, active = 0 }) {
  return (
    <div className="tabs">
      {items.map((it, i) => (
        <button key={it} type="button" className={`tab ${i === active ? 'active' : ''}`}>
          {it}
        </button>
      ))}
    </div>
  );
}

export function Stat({ value, label, tone = 'dim' }) {
  return (
    <div className="stat">
      <b className={`tone-${tone}`}>{value}</b>
      <span>{label}</span>
    </div>
  );
}

/* ---------- KPI ---------- */
export function Kpi({ item, index = 0 }) {
  return (
    <Card className={`kpi rise`} style={{ animationDelay: `${index * 70}ms` }}>
      <div className="kpi-top">
        <span className="kpi-label">{item.label}</span>
        {item.dot && <i className="kpi-dot" />}
        {item.delta && <Pill tone="accent">{item.delta}</Pill>}
      </div>

      <div className="kpi-value">
        <b>{item.value}</b>
        {item.unit && <em>{item.unit}</em>}
      </div>

      {item.progress != null && <Progress value={item.progress} height={3} />}

      <div className="kpi-foot">
        {item.spark && <Sparkline data={item.spark} />}
        {item.hint && <span>{item.hint}</span>}
      </div>
    </Card>
  );
}

/* ---------- graphiques (SVG, animés en CSS) ---------- */
export function Sparkline({ data = [], width = 92, height = 26 }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / span) * (height - 3) - 1.5;
    return [x, y];
  });
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  return (
    <svg className="spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="1.9" fill="currentColor" />
    </svg>
  );
}

export function AreaChart({ data = [], height = 210 }) {
  const w = 700;
  const h = height;
  const padB = 24;
  const max = Math.max(...data.map((d) => d.v)) * 1.12;
  const stepX = w / (data.length - 1);
  const y = (v) => h - padB - (v / max) * (h - padB - 12);
  const pts = data.map((d, i) => [i * stepX, y(d.v)]);
  const line = pts.map(([x, yy], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${yy.toFixed(1)}`).join(' ');
  const area = `${line} L${w} ${h - padB} L0 ${h - padB} Z`;

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label="Recouvrement mensuel">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5B7CFA" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#5B7CFA" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7E9BFF" />
            <stop offset="100%" stopColor="#5B7CFA" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line
            key={g}
            x1="0"
            x2={w}
            y1={h - padB - g * (h - padB - 12)}
            y2={h - padB - g * (h - padB - 12)}
            stroke="rgba(167,182,255,.10)"
            strokeWidth="1"
          />
        ))}

        <path d={area} fill="url(#areaFill)" className="area-in" />
        <path
          d={line}
          fill="none"
          stroke="url(#lineStroke)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="line-in"
        />
        {pts.map(([x, yy], i) => (
          <circle key={i} cx={x} cy={yy} r="2.4" fill="#0B1030" stroke="#7E9BFF" strokeWidth="1.4" className="dot-in" />
        ))}
      </svg>

      <div className="chart-axis">
        {data.map((d) => (
          <span key={d.m}>{d.m}</span>
        ))}
      </div>
    </div>
  );
}

export function BarChart({ data = [], height = 190 }) {
  const max = Math.max(...data.map((d) => d.v));
  return (
    <div className="bars" style={{ height }}>
      {data.map((d, i) => (
        <div className="bar-col" key={d.label}>
          <span className="bar-track">
            <i style={{ height: `${(d.v / max) * 100}%`, animationDelay: `${i * 60}ms` }} />
          </span>
          <em>{d.label}</em>
        </div>
      ))}
    </div>
  );
}

export function Donut({ parts = [], size = 150 }) {
  const total = parts.reduce((a, p) => a + p.v, 0) || 1;
  const r = 54;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox="0 0 140 140" className="donut">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(167,182,255,.10)" strokeWidth="16" />
        {parts.map((p) => {
          const len = (p.v / total) * c;
          const dash = `${len} ${c - len}`;
          const el = (
            <circle
              key={p.label}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={p.color}
              strokeWidth="16"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform="rotate(-90 70 70)"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <ul className="donut-legend">
        {parts.map((p) => (
          <li key={p.label}>
            <i style={{ background: p.color }} />
            <span>{p.label}</span>
            <b>{Math.round((p.v / total) * 100)}%</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HBarList({ items = [] }) {
  const max = Math.max(...items.map((i) => i.v));
  return (
    <div className="hlist">
      {items.map((it, k) => (
        <div className="hrow" key={it.label}>
          <span className="hlabel">{it.label}</span>
          <span className="hvalue">{it.v}%</span>
          <span className="hbar">
            <i style={{ width: `${(it.v / max) * 100}%`, animationDelay: `${k * 60}ms` }} />
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------- tableaux ---------- */
export function Table({ columns = [], template, children, foot }) {
  return (
    <div className="table">
      <div className="thead" style={{ gridTemplateColumns: template }}>
        {columns.map((c, i) => (
          <span key={i} className={c === '' ? 'right' : ''}>{c}</span>
        ))}
      </div>
      <div className="tbody">{children}</div>
      {foot && <div className="tfoot">{foot}</div>}
    </div>
  );
}

export function Tr({ children, template }) {
  return (
    <div className="tr" style={{ gridTemplateColumns: template }}>
      {children}
    </div>
  );
}
