import { useMemo, useState } from 'react';
import { SearchIcon as Search, ArrowRightIcon as ArrowRight, SlidersHorizontalIcon as SlidersHorizontal, GraduationCapIcon as GraduationCap, XIcon as X, ArrowUpRightIcon as ArrowUpRight } from 'lucide-react';
import { formations, niveaux, modes, school } from '../data/content.js';
import FormationCard from '../components/FormationCard.jsx';
import Reveal, { Breadcrumb } from '../components/Reveal.jsx';
import { Link } from 'react-router-dom';

export default function Formations() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Toutes');
  const [niv, setNiv] = useState('Tous');
  const [mode, setMode] = useState('Tous');

  const cats = useMemo(() => ['Toutes', ...new Set(formations.map((f) => f.categorie))], []);

  const filtered = useMemo(
    () =>
      formations.filter((f) => {
        const hay = `${f.titre} ${f.sousTitre || ''} ${f.categorie} ${f.resume} ${f.niveau} ${f.mode}`.toLowerCase();
        if (q && !hay.includes(q.toLowerCase())) return false;
        if (cat !== 'Toutes' && f.categorie !== cat) return false;
        if (niv !== 'Tous' && f.niveau !== niv) return false;
        if (mode !== 'Tous' && f.mode !== mode) return false;
        return true;
      }),
    [q, cat, niv, mode]
  );

  const reset = () => {
    setQ(''); setCat('Toutes'); setNiv('Tous'); setMode('Tous');
  };
  const active = q || cat !== 'Toutes' || niv !== 'Tous' || mode !== 'Tous';

  return (
    <>
      <section className="page-hero band-dark">
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="breadcrumb" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <Link to="/">Accueil</Link>
            <span>/</span>
            <span style={{ color: '#fff' }}>Formations</span>
          </div>
          <div style={{ maxWidth: 760, display: 'grid', gap: 18, paddingTop: 12 }}>
            <span className="eyebrow">14 programmes · DEF · BAC · Formation continue</span>
            <h1 className="display-lg" style={{ color: '#fff' }}>
              Des formations conçues pour bâtir un <span style={{ fontStyle: 'italic', color: 'var(--gold-2)' }}>véritable avenir professionnel</span>
            </h1>
            <p className="lead" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Soins infirmiers, santé maternelle et infantile, kinésithérapie, biologie médicale, nutrition,
              promotion médicale, langues et communication : identifiez le parcours qui rejoint votre projet.
            </p>
          </div>
        </div>
      </section>

      <section className="section-sm" style={{ paddingTop: 34 }}>
        <div className="container">
          <Reveal className="filters">
            <div className="filter-row">
              <label className="search-box">
                <Search />
                <input
                  type="search"
                  placeholder="Rechercher une formation, une filière, un niveau…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  aria-label="Rechercher une formation"
                />
                {q && (
                  <button onClick={() => setQ('')} aria-label="Effacer" style={{ display: 'grid', placeItems: 'center' }}>
                    <X size={14} />
                  </button>
                )}
              </label>
              {active && (
                <button className="btn btn-ghost btn-sm" onClick={reset}>
                  <X size={14} /> Réinitialiser
                </button>
              )}
            </div>

            <div className="filter-row">
              <span className="label">Catégorie</span>
              {cats.map((c) => (
                <button key={c} className={`seg ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>
                  {c}
                </button>
              ))}
            </div>

            <div className="filter-row">
              <span className="label">Niveau</span>
              {niveaux.map((n) => (
                <button key={n} className={`seg ${niv === n ? 'on' : ''}`} onClick={() => setNiv(n)}>
                  {n}
                </button>
              ))}
              <span className="label" style={{ marginLeft: 18 }}>Mode</span>
              {modes.map((m) => (
                <button key={m} className={`seg ${mode === m ? 'on' : ''}`} onClick={() => setMode(m)}>
                  {m}
                </button>
              ))}
            </div>
          </Reveal>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, margin: '26px 0 18px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.86rem', color: 'rgba(4,19,15,0.55)' }}>
              <strong style={{ color: 'var(--ink)' }}>{filtered.length}</strong> formation{filtered.length > 1 ? 's' : ''} trouvée{filtered.length > 1 ? 's' : ''}
            </span>
            <span className="chip gold"><GraduationCap size={13} /> Rentrée 2026 — 2027 ouverte</span>
          </div>

          {filtered.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center', display: 'grid', gap: 12, justifyItems: 'center' }}>
              <SlidersHorizontal size={30} style={{ color: 'rgba(4,19,15,0.3)' }} />
              <h3 className="display-sm">Aucune formation ne correspond à votre recherche</h3>
              <p style={{ fontSize: '0.9rem', color: 'rgba(4,19,15,0.55)' }}>
                Essayez d’élargir vos critères ou contactez notre équipe d’accompagnement candidat.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" onClick={reset}>Réinitialiser les filtres</button>
                <a className="btn btn-ghost" href={school.whatsappUrl} target="_blank" rel="noreferrer">WhatsApp</a>
              </div>
            </div>
          ) : (
            <div className="grid-3" style={{ gap: 22 }}>
              {filtered.map((f, i) => (
                <Reveal key={f.slug} delay={Math.min(i, 6) * 60}>
                  <FormationCard f={f} />
                </Reveal>
              ))}
            </div>
          )}

          <Reveal className="card" style={{ marginTop: 40, padding: 'clamp(22px,3.4vw,36px)', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <h3 className="display-sm">Une hésitation entre deux filières ?</h3>
              <p style={{ fontSize: '0.9rem', color: 'rgba(4,19,15,0.6)', marginTop: 6 }}>
                Notre équipe vous aide à choisir la formation, à constituer le dossier et à suivre
                l’inscription.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link to="/admission" className="btn btn-primary">Être accompagné <ArrowRight className="arrow" /></Link>
              <Link to="/contact" className="btn btn-ghost">Nous contacter</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

export function FormationDetail({ f }) {
  const others = formations.filter((x) => x.slug !== f.slug && x.categorie === f.categorie).slice(0, 3);
  const fallback = formations.filter((x) => x.slug !== f.slug).slice(0, 3);
  const list = others.length >= 2 ? others : fallback;

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Breadcrumb items={[{ label: 'Formations', to: '/formations' }, { label: f.titre }]} />
          <div className="split" style={{ alignItems: 'start' }}>
            <div style={{ display: 'grid', gap: 18 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="chip emerald">{f.categorie}</span>
                {f.populaire && <span className="chip gold">Populaire</span>}
                <span className="chip">{f.niveau}</span>
                <span className="chip">{f.mode}</span>
              </div>
              <h1 className="display-lg">{f.titre}</h1>
              {f.sousTitre && (
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'rgba(4,19,15,0.55)', marginTop: -8 }}>
                  {f.sousTitre}
                </p>
              )}
              <p className="lead" style={{ maxWidth: '52ch' }}>{f.resume}</p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'rgba(15,111,82,0.07)', border: '1px solid rgba(15,111,82,0.16)' }}>
                <span style={{ color: 'var(--emerald)' }}>✓</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--emerald)' }}>
                  Institut officiellement autorisé — {school.agrement.ouverture}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
                <Link to={`/admission?formation=${f.slug}`} className="btn btn-primary btn-lg">
                  Candidater maintenant <ArrowRight className="arrow" />
                </Link>
                <Link to="/contact" className="btn btn-ghost btn-lg">Poser une question</Link>
              </div>
            </div>

            <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
              <img src={f.image} alt={f.titre} style={{ aspectRatio: '4/3', width: '100%', objectFit: 'cover' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--line)' }}>
                {[
                  ['Niveau', f.niveau],
                  ['Durée', f.duree],
                  ['Mode', f.mode],
                  ['Tarif', f.tarif],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: '#fff', padding: '16px 18px' }}>
                    <div className="mono-xs" style={{ color: 'rgba(4,19,15,0.42)' }}>{k}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.02rem', marginTop: 3 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container">
          <div className="desk-cols" style={{ gap: 26 }}>
            <div style={{ display: 'grid', gap: 20 }}>
              <Reveal className="card" style={{ padding: 'clamp(22px,3vw,34px)' }}>
                <span className="eyebrow">01 — Le programme</span>
                <h2 className="display-sm" style={{ margin: '14px 0 12px' }}>Un parcours pensé pour la pratique</h2>
                <p style={{ fontSize: '0.96rem', color: 'rgba(4,19,15,0.7)', lineHeight: 1.75 }}>{f.programme}</p>
              </Reveal>

              <Reveal delay={80} className="card" style={{ padding: 'clamp(22px,3vw,34px)' }}>
                <span className="eyebrow">02 — Votre parcours</span>
                <h2 className="display-sm" style={{ margin: '14px 0 12px' }}>Tout ce qu’il faut savoir avant de candidater</h2>
                <div style={{ display: 'grid', gap: 22, marginTop: 18 }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', marginBottom: 6 }}>Certification préparée</h3>
                    <p style={{ fontSize: '0.9rem', color: 'rgba(4,19,15,0.64)' }}>
                      {f.titre} — formation accréditée par l’État malien, délivrée par l’IPFS-BK (Hippodrome 1, Bamako).
                    </p>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', marginBottom: 6 }}>Conditions d’accès</h3>
                    <p style={{ fontSize: '0.9rem', color: 'rgba(4,19,15,0.64)' }}>
                      {f.niveau === 'BAC'
                        ? 'Être titulaire du baccalauréat ou d’un diplôme reconnu équivalent.'
                        : f.niveau === 'DEF'
                        ? 'Être titulaire du Diplôme d’études fondamentales (DEF) ou d’un diplôme reconnu équivalent.'
                        : 'Ouvert aux étudiants et professionnels, selon le parcours et l’expérience.'}{' '}
                      Les formations de niveau supérieur peuvent exiger un diplôme correspondant au cycle précédent.
                    </p>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>Dossier d’inscription</h3>
                    <ul className="check-list">
                      {['Quatre photos d’identité récentes', 'Une demande timbrée adressée au Directeur de l’Institut', 'Une copie de l’acte de naissance', 'Une copie légalisée du diplôme requis'].map((d) => (
                        <li key={d}><span className="tick">✓</span>{d}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>Perspectives</h3>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {f.debouches.map((d) => <span key={d} className="chip">{d}</span>)}
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={120} className="card" style={{ padding: 'clamp(22px,3vw,34px)' }}>
                <span className="eyebrow">03 — Expérience terrain</span>
                <h2 className="display-sm" style={{ margin: '14px 0 12px' }}>La pratique au cœur de l’apprentissage</h2>
                <p style={{ fontSize: '0.92rem', color: 'rgba(4,19,15,0.66)', marginBottom: 14 }}>
                  Les stages commencent dès la fin du premier semestre de la première année, selon la filière et la
                  programmation pédagogique.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['CHU Gabriel Touré', 'Hôpital de Kati', 'INSP', 'CNTS', 'CS Réf & CSCom'].map((t) => (
                    <span key={t} className="chip emerald">{t}</span>
                  ))}
                </div>
              </Reveal>
            </div>

            <aside style={{ display: 'grid', gap: 16, position: 'sticky', top: 96 }}>
              <div className="card" style={{ padding: 22, display: 'grid', gap: 12 }}>
                <b style={{ fontSize: '0.94rem' }}>Tarif de la formation</b>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', lineHeight: 1 }}>{f.tarif}</div>
                <p style={{ fontSize: '0.8rem', color: 'rgba(4,19,15,0.55)' }}>
                  Paiement par versement ou virement sur le compte BNDA <strong>{school.bank.compte}</strong>.
                </p>
                <Link to={`/admission?formation=${f.slug}`} className="btn btn-primary">Déposer ma demande <ArrowRight className="arrow" /></Link>
                <a href={`tel:${school.phones[0].replace(/\s/g, '')}`} className="btn btn-ghost btn-sm">{school.phones[0]}</a>
              </div>

              <div className="card" style={{ padding: 22, display: 'grid', gap: 10 }}>
                <b style={{ fontSize: '0.94rem' }}>Accompagnement candidat</b>
                <p style={{ fontSize: '0.82rem', color: 'rgba(4,19,15,0.58)' }}>
                  Une question sur les conditions d’admission ou les pièces à fournir ? Écrivez-nous, nous répondons
                  rapidement.
                </p>
                <a href={school.whatsappUrl} target="_blank" rel="noreferrer" className="link-arrow">
                  Discuter sur WhatsApp <ArrowUpRight />
                </a>
              </div>

              <div className="card" style={{ padding: 22, display: 'grid', gap: 10 }}>
                <b style={{ fontSize: '0.94rem' }}>Site & campus</b>
                <p style={{ fontSize: '0.82rem', color: 'rgba(4,19,15,0.58)' }}>{school.address}</p>
                <a href={school.mapsUrl} target="_blank" rel="noreferrer" className="link-arrow">Ouvrir dans Maps <ArrowUpRight /></a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="section-sm" style={{ background: 'var(--cream-2)' }}>
        <div className="container">
          <div className="section-head">
            <div className="titles">
              <span className="eyebrow">À découvrir aussi</span>
              <h2 className="display-md">Formations proches</h2>
            </div>
            <Link to="/formations" className="link-arrow">Toutes les formations <ArrowUpRight /></Link>
          </div>
          <div className="grid-3" style={{ gap: 22 }}>
            {list.map((o, i) => (
              <Reveal key={o.slug} delay={i * 70}><FormationCard f={o} /></Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
