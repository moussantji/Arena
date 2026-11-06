import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchIcon as Search, ArrowUpRightIcon as ArrowUpRight, PlayIcon as Play, ClockIcon as Clock, ArrowRightIcon as ArrowRight, MailIcon as Mail } from 'lucide-react';
import { articles, galerie } from '../data/content.js';
import Reveal from '../components/Reveal.jsx';
import { formatDate, formatShort, useToast } from '../components/Reveal.jsx';

export default function Blog() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Toutes');
  const cats = useMemo(() => ['Toutes', ...new Set(articles.map((a) => a.categorie))], []);

  const filtered = articles.filter((a) => {
    const hay = `${a.titre} ${a.chapo} ${a.categorie}`.toLowerCase();
    if (q && !hay.includes(q.toLowerCase())) return false;
    if (cat !== 'Toutes' && a.categorie !== cat) return false;
    return true;
  });

  const une = articles.filter((a) => a.aLaUne);
  const { show, node } = useToast();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">Accueil</Link>
            <span>/</span>
            <span style={{ color: 'rgba(4,19,15,0.75)' }}>Blog</span>
          </div>
          <div style={{ display: 'grid', gap: 16, maxWidth: 780 }}>
            <span className="eyebrow">Actualités · {articles.length} articles</span>
            <h1 className="display-lg">
              Le journal de l’Institut <span className="italic-accent">Bernard Kouchner</span>
            </h1>
            <p className="lead">
              Formations, vie académique, vie étudiante, communiqués et métiers de la santé : suivez le
              quotidien de l’IPFS-BK, mis à jour par la Direction des études.
            </p>
          </div>
        </div>
      </section>

      {/* Vidéo à la une */}
      <section style={{ paddingBottom: 10 }}>
        <div className="container">
          <Reveal
            style={{
              position: 'relative',
              borderRadius: 'var(--r-xl)',
              overflow: 'hidden',
              minHeight: 300,
              display: 'grid',
              alignContent: 'end',
              padding: 'clamp(22px,4vw,44px)',
              color: '#fff',
              background: 'var(--ink)',
            }}
          >
            <img src="/img/graduation.jpg" alt="Cérémonie de remise des diplômes" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(4,19,15,0.2), rgba(4,19,15,0.9))' }} />
            <div style={{ position: 'relative', zIndex: 2, display: 'grid', gap: 12, maxWidth: 620 }}>
              <span className="chip glass" style={{ justifySelf: 'start' }}><Play size={12} /> Vidéo à la une</span>
              <h2 className="display-md" style={{ color: '#fff' }}>
                Cérémonie de remise des diplômes — 4ème Promotion « Feu Général Sadio Camara »
              </h2>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="chip glass">Remise de diplôme</span>
                <span className="chip glass">9 mai 2026 · Bamako</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Articles à la une */}
      <section className="section-sm" style={{ paddingTop: 36 }}>
        <div className="container">
          <div className="section-head">
            <div className="titles"><span className="eyebrow">À la une</span><h2 className="display-md">Articles mis en avant</h2></div>
          </div>
          <div className="grid-2">
            {une.map((a, i) => (
              <Reveal key={a.slug} delay={i * 90} className="post-card">
                <Link to={`/blog/${a.slug}`} className="post-media" style={{ aspectRatio: '16/10' }}>
                  <img src={a.image} alt={a.titre} />
                </Link>
                <div className="post-body">
                  <div className="post-meta">
                    <span className="cat">{a.categorie}</span>
                    <span>•</span>
                    <span>{a.auteur}</span>
                    <span>•</span>
                    <span>{formatShort(a.date)}</span>
                  </div>
                  <h3 style={{ fontSize: '1.3rem' }}><Link to={`/blog/${a.slug}`}>{a.titre}</Link></h3>
                  <p style={{ WebkitLineClamp: 3 }}>{a.chapo}</p>
                  <Link to={`/blog/${a.slug}`} className="btn btn-ghost btn-sm" style={{ justifySelf: 'start', marginTop: 4 }}>
                    Lire l’article <ArrowRight className="arrow" />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Tous les articles */}
      <section className="section-sm">
        <div className="container">
          <div className="section-head">
            <div className="titles">
              <span className="eyebrow">Tous les articles</span>
              <h2 className="display-md">Actualités récentes</h2>
            </div>
            <label className="search-box" style={{ maxWidth: 330 }}>
              <Search />
              <input
                type="search"
                placeholder="Rechercher un article…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Rechercher un article"
              />
            </label>
          </div>

          <div className="filter-row" style={{ marginBottom: 26 }}>
            {cats.map((c) => (
              <button key={c} className={`seg ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>
                {c}
              </button>
            ))}
            <span className="chip" style={{ marginLeft: 'auto' }}>{filtered.length} article(s)</span>
          </div>

          <div className="grid-3" style={{ gap: 22 }}>
            {filtered.map((a, i) => (
              <Reveal key={a.slug} delay={Math.min(i, 6) * 60} className="post-card">
                <Link to={`/blog/${a.slug}`} className="post-media">
                  <img src={a.image} alt={a.titre} loading="lazy" />
                </Link>
                <div className="post-body">
                  <div className="post-meta">
                    <span className="cat">{a.categorie}</span>
                    <span>•</span>
                    <span>{formatShort(a.date)}</span>
                  </div>
                  <h3><Link to={`/blog/${a.slug}`}>{a.titre}</Link></h3>
                  <p>{a.chapo}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <Link to={`/blog/${a.slug}`} className="link-arrow">Lire <ArrowUpRight /></Link>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: 'rgba(4,19,15,0.45)' }}>
                      <Clock size={12} /> {a.tempsLecture} min
                    </span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Galerie + newsletter */}
      <section className="section-sm" style={{ background: 'var(--cream-2)' }}>
        <div className="container">
          <div className="desk-cols" style={{ gap: 26 }}>
            <div>
              <div className="section-head" style={{ marginBottom: 20 }}>
                <div className="titles"><span className="eyebrow">Galerie</span><h2 className="display-sm">Les images</h2></div>
              </div>
              <div className="gallery-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
                {galerie.slice(0, 4).map((g, i) => (
                  <figure key={g.src} style={{ position: 'relative', margin: 0, borderRadius: 'var(--r-md)', overflow: 'hidden', aspectRatio: '4/3' }}>
                    <img src={g.src} alt={g.legende} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <figcaption style={{ position: 'absolute', inset: 'auto 0 0 0', padding: '24px 12px 10px', fontSize: '0.7rem', fontWeight: 700, color: '#fff', background: 'linear-gradient(180deg,transparent,rgba(4,19,15,0.8))' }}>
                      {g.legende}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>

            <Reveal className="card" style={{ padding: 'clamp(22px,3vw,32px)', alignSelf: 'start', display: 'grid', gap: 14 }}>
              <span className="eyebrow">Newsletter</span>
              <h3 className="display-sm">L’actualité de l’Institut, chaque mois</h3>
              <p style={{ fontSize: '0.88rem', color: 'rgba(4,19,15,0.6)' }}>
                Rentrées, résultats, bourses et événements : un e-mail clair, une fois par mois, sans superflu.
              </p>
              <form
                onSubmit={(e) => { e.preventDefault(); show('Inscription enregistrée — merci !'); e.target.reset(); }}
                style={{ display: 'grid', gap: 10 }}
              >
                <label className="search-box">
                  <Mail />
                  <input type="email" required placeholder="votre@email.com" aria-label="Votre e-mail" />
                </label>
                <button className="btn btn-primary" type="submit">Je m’abonne <ArrowRight className="arrow" /></button>
              </form>
              <span style={{ fontSize: '0.72rem', color: 'rgba(4,19,15,0.42)' }}>
                Aucune information confidentielle. Désinscription en un clic.
              </span>
            </Reveal>
          </div>
        </div>
      </section>
      {node}
    </>
  );
}

export function ArticleDetail({ a }) {
  const others = articles.filter((x) => x.slug !== a.slug).slice(0, 3);
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">Accueil</Link><span>/</span>
            <Link to="/blog">Blog</Link><span>/</span>
            <span style={{ color: 'rgba(4,19,15,0.75)' }}>{a.categorie}</span>
          </div>
          <div style={{ maxWidth: 860, display: 'grid', gap: 16 }}>
            <div className="post-meta">
              <span className="cat">{a.categorie}</span><span>•</span>
              <span>{a.auteur}</span><span>•</span>
              <span>{formatDate(a.date)}</span><span>•</span>
              <span>{a.tempsLecture} min de lecture</span>
            </div>
            <h1 className="display-lg">{a.titre}</h1>
            <p className="lead">{a.chapo}</p>
          </div>
        </div>
      </section>

      <section style={{ paddingBottom: 20 }}>
        <div className="container">
          <Reveal style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
            <img src={a.image} alt={a.titre} style={{ width: '100%', aspectRatio: '16/7.5', objectFit: 'cover' }} />
          </Reveal>
        </div>
      </section>

      <section className="section-sm">
        <div className="container">
          <div className="desk-cols" style={{ gap: 40, alignItems: 'start' }}>
            <article className="article-body">
              {a.corps.map((p, i) => <p key={i}>{p}</p>)}
              <div style={{ padding: '20px 22px', borderRadius: 'var(--r-md)', background: 'rgba(15,111,82,0.06)', border: '1px solid rgba(15,111,82,0.16)', display: 'grid', gap: 8 }}>
                <b style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>Contact & inscription</b>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>
                  Téléphone : +223 83 01 02 02 ou +223 76 74 74 07.<br />
                  Adresse : Hippodrome 1, derrière l’agence Orange Mali, Bamako.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/admission" className="btn btn-primary">Candidater <ArrowRight className="arrow" /></Link>
                <Link to="/formations" className="btn btn-ghost">Voir les formations</Link>
                <Link to="/blog" className="btn btn-ghost">Retour aux actualités</Link>
              </div>
            </article>

            <aside style={{ display: 'grid', gap: 14, position: 'sticky', top: 96 }}>
              <div className="card" style={{ padding: 20 }}>
                <span className="mono-xs" style={{ color: 'rgba(4,19,15,0.42)' }}>Publié par</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                  <span className="avatar-initials">{a.auteur.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <b style={{ fontSize: '0.88rem', display: 'block' }}>{a.auteur}</b>
                    <small style={{ fontSize: '0.74rem', color: 'rgba(4,19,15,0.5)' }}>{formatDate(a.date)}</small>
                  </div>
                </div>
              </div>
              <div className="card" style={{ padding: 20, display: 'grid', gap: 8 }}>
                <span className="mono-xs" style={{ color: 'rgba(4,19,15,0.42)' }}>À lire ensuite</span>
                {others.map((o) => (
                  <Link key={o.slug} to={`/blog/${o.slug}`} style={{ display: 'grid', gap: 3, paddingBottom: 10, borderBottom: '1px solid var(--line)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--emerald)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{o.categorie}</span>
                    <span style={{ fontSize: '0.86rem', fontWeight: 600, lineHeight: 1.3 }}>{o.titre}</span>
                  </Link>
                ))}
                <Link to="/blog" className="link-arrow" style={{ marginTop: 4 }}>Tous les articles <ArrowUpRight /></Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
