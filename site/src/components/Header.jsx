import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { MenuIcon as Menu, XIcon as X, ArrowRightIcon as ArrowRight, LayoutDashboardIcon as LayoutDashboard, LogInIcon as LogIn, ChevronRightIcon as ChevronRight } from 'lucide-react';
import { school } from '../data/content.js';
import { useAuth } from '../context/Auth.jsx';

const NAV = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/formations', label: 'Formations' },
  { to: '/blog', label: 'Blog' },
  { to: '/application', label: 'App mobile' },
  { to: '/a-propos', label: 'À propos' },
  { to: '/admission', label: 'Admission' },
  { to: '/contact', label: 'Contact' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('no-scroll', open);
    return () => document.body.classList.remove('no-scroll');
  }, [open]);

  return (
    <>
      <header className={`site-header ${scrolled || open ? 'scrolled' : ''}`}>
        <div className="container header-inner">
          <Link to="/" className="brand" aria-label={`${school.shortName} — accueil`}>
            <span className="brand-mark">BK</span>
            <span className="brand-text">
              <strong>Bernard Kouchner</strong>
              <span>{school.shortName} · Hippodrome 1</span>
            </span>
          </Link>

          <nav className="nav" aria-label="Navigation principale">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="header-actions">
            {user ? (
              <Link
                to={user.profile === 'personnel' ? '/personnel' : '/espace'}
                className="mode-badge"
                title="Votre espace connecté"
              >
                <span className="dot" />
                {user.profile === 'personnel' ? 'Version PC' : 'Espace membre'}
              </Link>
            ) : null}
            <Link to={user ? '/personnel' : '/espace'} className="btn btn-primary btn-sm hide-sm">
              <LayoutDashboard />
              {user ? 'Mon espace' : 'Se connecter'}
            </Link>
            <button
              className={`burger ${open ? 'open' : ''}`}
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={open}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      <div className={`drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="header-inner">
          <Link to="/" className="brand" onClick={() => setOpen(false)}>
            <span className="brand-mark">BK</span>
            <span className="brand-text">
              <strong>Bernard Kouchner</strong>
              <span>{school.shortName}</span>
            </span>
          </Link>
          <div style={{ marginLeft: 'auto' }}>
            <button className="burger open" onClick={() => setOpen(false)} aria-label="Fermer le menu">
              <X size={20} />
            </button>
          </div>
        </div>
        <div>
          <nav>
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)}>
                {n.label}
                <ChevronRight size={18} style={{ opacity: 0.3 }} />
              </Link>
            ))}
          </nav>
          <div className="drawer-cta">
            <Link
              to={user ? '/personnel' : '/espace'}
              className="btn btn-primary btn-lg"
              onClick={() => setOpen(false)}
            >
              <LogIn /> {user ? 'Mon espace personnel' : 'Espace membre / personnel'}
            </Link>
            <a href={`tel:${school.phones[0].replace(/\s/g, '')}`} className="btn btn-ghost btn-lg">
              {school.phones[0]}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
