import { Link } from 'react-router-dom';
import { ArrowRightIcon as ArrowRight, ArrowUpRightIcon as ArrowUpRight, ShieldCheckIcon as ShieldCheck, GraduationCapIcon as GraduationCap, LandmarkIcon as Landmark, MessagesSquareIcon as MessagesSquare, BookOpenIcon as BookOpen, PenLineIcon as PenLine, RocketIcon as Rocket, StarIcon as Star, QuoteIcon as Quote, Building2Icon as Building2, SparklesIcon as Sparkles, CheckIcon as Check, StethoscopeIcon as Stethoscope, FlaskConicalIcon as FlaskConical, HeartPulseIcon as HeartPulse, PlayIcon as Play, MapPinIcon as MapPin, AwardIcon as Award, UsersIcon as Users, SmartphoneIcon as Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import Reveal from '../components/Reveal.jsx';
import FormationCard from '../components/FormationCard.jsx';
import { formations, articles, stats, testimonials, school, galerie, terrains } from '../data/content.js';
import { formatShort } from '../components/Reveal.jsx';

const TICKER = [
  'Rentrée 2026 — 2027 ouverte',
  'Licence kinésithérapie · 23 novembre 2026',
  'BT-Santé 2026 · 95,65 % de réussite',
  'Inscriptions à Hippodrome 1',
  'Paiement BNDA 490001201401',
  '4ème promotion diplômée',
];

export default function Home() {
  const phares = formations.filter((f) => f.populaire).slice(0, 4);
  const aLaUne = articles.filter((a) => a.aLaUne);
  const recents = articles.slice(2, 5);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setCounter(1), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="hero">
        <div className="hero-media">
          <img src="/img/hero.jpg" alt="Étudiants en soins infirmiers en travaux pratiques à l’IPFS-BK" />
        </div>
        <div className="container hero-inner">
          <div className="hero-badges">
            <span className="chip glass"><span className="dot" /> Hippodrome 1 · Bamako</span>
            <span className="chip glass"><ShieldCheck size={13} /> Arrêté n°2026-0401/MESRS-SG</span>
            <span className="chip glass"><Star size={13} /> 4,6/5 · 39 avis Google</span>
          </div>

          <h1 className="display-xl">
            La santé commence par une <em>formation sérieuse</em>.
          </h1>

          <p className="hero-sub">{school.claim} Intégrez un institut qui place la qualité, la rigueur et l’engagement au cœur de son action.</p>

          <div className="hero-cta">
            <Link to="/admission" className="btn btn-gold btn-lg">
              S’inscrire en ligne <ArrowRight className="arrow" />
            </Link>
            <Link to="/formations" className="btn btn-light btn-lg">
              Explorer les 14 formations
            </Link>
            <a href={`tel:${school.phones[1].replace(/\s/g, '')}`} className="chip glass" style={{ padding: '10px 16px', fontSize: '0.8rem' }}>
              {school.phones[1]}
            </a>
          </div>

          <div className="hero-panel">
            {stats.map((s) => (
              <div className="hero-stat" key={s.label}>
                <b>
                  {s.value}
                  <i>{s.suffix}</i>
                </b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-ticker" style={{ gridColumn: '1 / -1', width: '100%' }}>
          <div className="ticker-track">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- ENGAGEMENT ---------------- */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <Reveal className="titles">
              <span className="eyebrow">Notre engagement</span>
              <h2 className="display-lg">
                Une école de santé ancrée dans les <span className="italic-accent">réalités du Mali</span>
              </h2>
              <p className="lead">
                Des parcours conçus pour développer des compétences utiles, une pratique responsable et une
                meilleure capacité d’action au service des patients et des communautés.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <Link to="/a-propos" className="link-arrow">
                Découvrir l’institut <ArrowUpRight />
              </Link>
            </Reveal>
          </div>

          <div className="grid-4" style={{ marginBottom: 44 }}>
            {[
              { tag: 'DEF', t: 'Parcours accessibles', d: 'Après le Diplôme d’études fondamentales.', icon: BookOpen },
              { tag: 'BAC', t: 'Licences & supérieur', d: 'Des formations orientées métiers de la santé.', icon: GraduationCap },
              { tag: 'MASTER', t: 'Spécialisations', d: 'Pour approfondir et faire évoluer sa carrière.', icon: Award },
              { tag: 'CONTINU', t: 'Renforcement', d: 'Capacités des professionnels et organisations.', icon: Sparkles },
            ].map((x, i) => (
              <Reveal key={x.tag} delay={i * 90} className="card value-card">
                <div className="value-icon"><x.icon /></div>
                <span className="mono-xs" style={{ color: 'var(--gold)' }}>{x.tag}</span>
                <h3>{x.t}</h3>
                <p>{x.d}</p>
              </Reveal>
            ))}
          </div>

          <div className="split">
            <Reveal className="media-frame">
              <img src="/img/campus.jpg" alt="Campus de l’institut à Hippodrome 1, Bamako" />
              <div className="media-badge">
                <span className="value-icon" style={{ width: 44, height: 44 }}><MapPin size={19} /></span>
                <div>
                  <b>Hippodrome 1</b>
                  <small>Derrière le siège d’Orange Mali, RN27 · Bamako</small>
                </div>
                <a href={school.mapsUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}>
                  Itinéraire
                </a>
              </div>
            </Reveal>

            <Reveal delay={120} style={{ display: 'grid', gap: 22 }}>
              <span className="eyebrow">Confiance & inscription</span>
              <h2 className="display-md">Un institut officiellement autorisé, avec des modalités de paiement claires</h2>
              <p className="lead">
                L’Institut Privé de Formation Sanitaire Bernard Kouchner (IPFS-BK) accompagne les candidats avec
                une procédure d’inscription simple, transparente et adaptée aux réalités du Mali.
              </p>
              <ul className="check-list">
                <li>
                  <span className="tick"><Check /></span>
                  <span>
                    <strong>Autorisation officielle.</strong> {school.agrement.creation}. Ouverture :{' '}
                    {school.agrement.ouverture}.
                  </span>
                </li>
                <li>
                  <span className="tick"><Check /></span>
                  <span>
                    <strong>Paiement bancaire BNDA {school.bank.compte}</strong> — par versement ou virement, avec
                    échéanciers possibles.
                  </span>
                </li>
                <li>
                  <span className="tick"><Check /></span>
                  <span>
                    <strong>Accompagnement candidat.</strong> Notre équipe vous guide du choix de la formation à la
                    validation du dossier.
                  </span>
                </li>
              </ul>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/admission" className="btn btn-primary">Déposer ma demande <ArrowRight className="arrow" /></Link>
                <a href={`tel:${school.phones[0].replace(/\s/g, '')}`} className="btn btn-ghost">{school.phones[0]}</a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------- ADMISSION 3 ÉTAPES ---------------- */}
      <section className="section-sm" style={{ background: 'var(--cream-2)' }}>
        <div className="container">
          <div className="section-head">
            <Reveal className="titles">
              <span className="eyebrow">Parcours d’admission</span>
              <h2 className="display-md">Comment rejoindre l’Institut en 3 étapes</h2>
              <p className="lead">Un processus clair, simple et rassurant pour finaliser votre inscription sans confusion.</p>
            </Reveal>
          </div>
          <div className="grid-3">
            {[
              { n: '01', icon: BookOpen, t: 'Choisissez votre formation', d: 'Explorez les programmes disponibles, les niveaux d’accès, les conditions et les opportunités de bourses.' },
              { n: '02', icon: PenLine, t: 'Déposez votre demande', d: 'Remplissez votre dossier d’inscription en ligne avec vos informations, votre parcours et vos motivations.' },
              { n: '03', icon: Rocket, t: 'Recevez votre accompagnement', d: 'Notre équipe suit votre dossier, vous informe rapidement et vous guide jusqu’à la validation.' },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 110} className="card step-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="step-icon"><s.icon /></span>
                  <span className="num">{s.n}</span>
                </div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- FORMATIONS ---------------- */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <Reveal className="titles">
              <span className="eyebrow">Nos programmes</span>
              <h2 className="display-lg">
                Des formations pensées pour construire un <span className="italic-accent">vrai avenir professionnel</span>
              </h2>
              <p className="lead">
                Des parcours adaptés aux réalités du terrain, avec des contenus professionnalisants et des niveaux
                d’accès variés selon votre profil.
              </p>
            </Reveal>
            <Reveal delay={100}>
              <Link to="/formations" className="btn btn-ghost">Voir les 14 formations <ArrowRight className="arrow" /></Link>
            </Reveal>
          </div>

          <div className="grid-4" style={{ gap: 20 }}>
            {phares.map((f, i) => (
              <Reveal key={f.slug} delay={i * 80}>
                <FormationCard f={f} />
              </Reveal>
            ))}
          </div>

          <Reveal delay={120} style={{ marginTop: 40 }}>
            <div className="card" style={{ padding: 26, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flex: 1 }}>
                {[
                  { icon: Stethoscope, l: 'Soins infirmiers' },
                  { icon: HeartPulse, l: 'Santé maternelle' },
                  { icon: FlaskConical, l: 'Biologie médicale' },
                  { icon: Users, l: 'Promotion médicale' },
                ].map((c) => (
                  <span key={c.l} className="chip emerald" style={{ padding: '8px 14px' }}>
                    <c.icon style={{ width: 14, height: 14 }} /> {c.l}
                  </span>
                ))}
              </div>
              <Link to="/formations" className="link-arrow">Tout explorer <ArrowUpRight /></Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- VALEURS / DARK ---------------- */}
      <section className="section band-dark noise">
        <div className="container">
          <div className="split">
            <Reveal>
              <span className="eyebrow">Pourquoi nous choisir</span>
              <h2 className="display-lg" style={{ margin: '16px 0 18px', color: '#fff' }}>
                Une école de santé tournée vers l’excellence et <span style={{ fontStyle: 'italic', color: 'var(--gold-2)' }}>l’avenir</span>
              </h2>
              <p className="lead" style={{ maxWidth: '48ch' }}>
                Nous combinons expertise pédagogique, formations professionnalisantes, accompagnement humain et
                vision santé 4.0 pour préparer chaque étudiant à réussir durablement.
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 26, flexWrap: 'wrap' }}>
                <Link to="/a-propos" className="btn btn-gold">Notre histoire <ArrowRight className="arrow" /></Link>
                <Link to="/application" className="btn btn-light"><Smartphone /> Voir l’app mobile</Link>
              </div>
              <div style={{ display: 'grid', gap: 0, marginTop: 34 }}>
                {[
                  { n: '01', t: 'Formation initiale et continue', d: 'Des parcours diplômants dans les métiers de la santé.' },
                  { n: '02', t: 'Recherche et innovation', d: 'Santé publique, prévention et innovation pédagogique.' },
                  { n: '03', t: 'Incubation & capacités', d: 'Renforcement des compétences des organisations.' },
                  { n: '04', t: 'Coopération scientifique', d: 'Mali et espace sahélien, former et publier ensemble.' },
                ].map((p) => (
                  <div className="pillar" key={p.n}>
                    <span className="n">{p.n}</span>
                    <div>
                      <h3>{p.t}</h3>
                      <p>{p.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={140} style={{ display: 'grid', gap: 14 }}>
              {[
                { icon: GraduationCap, t: 'Enseignants qualifiés', d: 'Une équipe d’intervenants expérimentés pour transmettre des compétences directement applicables.', tag: 'Encadrement expert' },
                { icon: Stethoscope, t: 'Formations orientées métier', d: 'Des programmes adaptés aux besoins actuels du secteur de la santé.', tag: 'Approche professionnalisante' },
                { icon: Building2, t: 'Présentiel et apprentissage en ligne', d: 'Une expérience flexible, moderne et accessible, quel que soit votre rythme.', tag: 'Santé & éducation 4.0' },
                { icon: Award, t: 'Bourses et accompagnement', d: 'Des opportunités d’accès à la formation avec un suivi qui aide à construire un vrai projet d’avenir.', tag: 'Accès facilité' },
              ].map((x) => (
                <div
                  key={x.t}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '46px 1fr',
                    gap: 14,
                    padding: '18px 20px',
                    borderRadius: 'var(--r-md)',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <span
                    style={{
                      width: 46, height: 46, borderRadius: 13, display: 'grid', placeItems: 'center',
                      background: 'rgba(47,199,154,0.14)', color: 'var(--jade)',
                    }}
                  >
                    <x.icon size={20} />
                  </span>
                  <div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.02rem', color: '#fff' }}>{x.t}</h3>
                      <span className="chip on-dark" style={{ fontSize: '0.62rem' }}>{x.tag}</span>
                    </div>
                    <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{x.d}</p>
                  </div>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------- TERRAIN ---------------- */}
      <section className="section-sm">
        <div className="container">
          <Reveal className="card" style={{ padding: 'clamp(24px,4vw,44px)', display: 'grid', gap: 22 }}>
            <div style={{ display: 'flex', gap: 20, justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <span className="eyebrow">Expérience terrain</span>
                <h2 className="display-sm" style={{ marginTop: 12 }}>La pratique au cœur de l’apprentissage</h2>
                <p style={{ fontSize: '0.9rem', color: 'rgba(4,19,15,0.6)', marginTop: 8, maxWidth: '58ch' }}>
                  Les stages commencent dès la fin du premier semestre de la première année, selon la filière et la
                  programmation pédagogique.
                </p>
              </div>
              <Link to="/formations" className="link-arrow">Voir les filières <ArrowUpRight /></Link>
            </div>
            <div className="marquee">
              <div>
                {[...terrains, ...terrains, ...terrains].map((t, i) => (
                  <span className="marquee-item" key={i}>
                    <HeartPulse size={16} style={{ color: 'var(--emerald)' }} /> {t}
                  </span>
                ))}
              </div>
              <div aria-hidden>
                {[...terrains, ...terrains, ...terrains].map((t, i) => (
                  <span className="marquee-item" key={i}>
                    <HeartPulse size={16} style={{ color: 'var(--emerald)' }} /> {t}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- APP MOBILE ---------------- */}
      <AppTeaser />

      {/* ---------------- TÉMOIGNAGES ---------------- */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <Reveal className="titles">
              <span className="eyebrow">Avis authentiques</span>
              <h2 className="display-md">Ce que disent nos étudiants</h2>
              <p className="lead">Les témoignages ci-dessous ont été envoyés par des étudiants puis vérifiés par l’Institut.</p>
            </Reveal>
            <Reveal delay={100}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 999, border: '1px solid var(--line-strong)', background: '#fff' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>4,6</span>
                <div className="testi-stars" style={{ display: 'flex' }}>
                  {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={13} fill="currentColor" />)}
                </div>
                <span style={{ fontSize: '0.78rem', color: 'rgba(4,19,15,0.5)' }}>39 avis Google</span>
              </div>
            </Reveal>
          </div>
          <div className="grid-3">
            {testimonials.map((t, i) => (
              <Reveal key={i} delay={i * 100} className="testi-card">
                <Quote size={26} style={{ color: 'rgba(15,111,82,0.25)' }} />
                <div className="testi-stars">
                  {Array.from({ length: t.note }).map((_, k) => <Star key={k} />)}
                </div>
                <p className="testi-quote">« {t.texte} »</p>
                <div className="testi-person">
                  <span className="avatar-initials">{t.nom.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <b>{t.nom}</b>
                    <small>{t.formation}</small>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- BLOG ---------------- */}
      <section className="section" style={{ background: 'var(--cream-2)' }}>
        <div className="container">
          <div className="section-head">
            <Reveal className="titles">
              <span className="eyebrow">À la une</span>
              <h2 className="display-lg">Actualités de l’Institut</h2>
              <p className="lead">Rentrées, résultats, vie étudiante et communiqués : suivez la vie de l’IPFS-BK.</p>
            </Reveal>
            <Reveal delay={100}>
              <Link to="/blog" className="btn btn-ghost">Tous les articles <ArrowRight className="arrow" /></Link>
            </Reveal>
          </div>

          {aLaUne[0] && (
            <Reveal className="post-featured" style={{ marginBottom: 24 }}>
              <div className="pm">
                <img src={aLaUne[0].image} alt={aLaUne[0].titre} />
                <span className="chip gold" style={{ position: 'absolute', top: 16, left: 16 }}>
                  <Sparkles size={12} /> À la une
                </span>
              </div>
              <div className="pb">
                <div className="post-meta">
                  <span className="cat">{aLaUne[0].categorie}</span>
                  <span>•</span>
                  <span>{formatShort(aLaUne[0].date)}</span>
                  <span>•</span>
                  <span>{aLaUne[0].tempsLecture} min de lecture</span>
                </div>
                <h2>{aLaUne[0].titre}</h2>
                <p style={{ fontSize: '0.93rem', color: 'rgba(4,19,15,0.62)' }}>{aLaUne[0].chapo}</p>
                <Link to={`/blog/${aLaUne[0].slug}`} className="btn btn-primary" style={{ justifySelf: 'start' }}>
                  Lire l’article <ArrowRight className="arrow" />
                </Link>
              </div>
            </Reveal>
          )}

          <div className="grid-3">
            {[{ ...aLaUne[1], _a: true }, ...recents].filter((a) => a && a.slug).slice(0, 3).map((a, i) => (
              <Reveal key={a.slug} delay={i * 90} className="post-card">
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
                  <Link to={`/blog/${a.slug}`} className="link-arrow">Lire <ArrowUpRight /></Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- GALERIE ---------------- */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <Reveal className="titles">
              <span className="eyebrow">Galerie</span>
              <h2 className="display-md">La vie à l’Institut</h2>
            </Reveal>
            <Reveal delay={100}>
              <span className="chip emerald"><Play size={12} /> Cérémonie de remise des diplômes · 4ème promotion</span>
            </Reveal>
          </div>
          <div className="gallery-grid">
            {galerie.map((g, i) => (
              <Reveal as="figure" key={g.src} delay={i * 60}>
                <img src={g.src} alt={g.legende} loading="lazy" />
                <figcaption>{g.legende}</figcaption>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- CTA FINAL ---------------- */}
      <section className="section-sm" style={{ paddingBottom: 'clamp(56px, 8vw, 100px)' }}>
        <div className="container">
          <Reveal className="cta-panel">
            <span className="eyebrow on-dark">Passez à l’action</span>
            <h2 className="display-lg">Construisez votre avenir avec nous</h2>
            <p>
              Explorez nos programmes, découvrez nos opportunités et prenez contact avec notre équipe. Notre
              accompagnement candidat vous suit de la première question jusqu’à la validation de votre inscription.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
              <Link to="/admission" className="btn btn-gold btn-lg">S’inscrire maintenant <ArrowRight className="arrow" /></Link>
              <Link to="/formations" className="btn btn-light btn-lg">Voir les formations</Link>
              <a href={school.whatsappUrl} target="_blank" rel="noreferrer" className="btn btn-light btn-lg">
                <MessagesSquare /> WhatsApp
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

/* ---------------- Teaser application mobile ---------------- */
function AppTeaser() {
  return (
    <section className="section band-dark noise" style={{ overflow: 'hidden' }}>
      <div className="container">
        <div className="split" style={{ alignItems: 'center' }}>
          <Reveal style={{ display: 'grid', gap: 18 }}>
            <span className="eyebrow">Application mobile</span>
            <h2 className="display-lg" style={{ color: '#fff' }}>
              Votre institut, <span style={{ fontStyle: 'italic', color: 'var(--gold-2)' }}>dans votre poche</span>.
            </h2>
            <p className="lead" style={{ maxWidth: '46ch' }}>
              Emploi du temps, notes, bulletins, scolarité, messagerie et notifications : l’application IPFS-BK
              rassemble votre parcours étudiant dans une interface claire, rapide et sécurisée.
            </p>
            <div style={{ display: 'grid', gap: 10, marginTop: 4 }}>
              {['Rappels de cours et d’évaluations', 'Bulletins et relevés téléchargeables', 'Paiements BNDA et reçus', 'Absences signalées aux parents'].map((x) => (
                <div key={x} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '0.9rem', color: 'rgba(255,255,255,0.72)' }}>
                  <span style={{ width: 20, height: 20, borderRadius: 99, display: 'grid', placeItems: 'center', background: 'rgba(47,199,154,0.18)', color: 'var(--jade)', flex: 'none' }}>
                    <Check size={12} />
                  </span>
                  {x}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
              <Link to="/application" className="btn btn-gold">Découvrir l’application <ArrowRight className="arrow" /></Link>
              <Link to="/espace" className="btn btn-light"><Smartphone /> Version PC personnel</Link>
            </div>
          </Reveal>

          <Reveal delay={120} className="phones-stage">
            <PhoneMock />
            <div style={{ width: 1 }} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function PhoneMock() {
  return (
    <div className="phone phone-float" style={{ transform: 'rotate(-3deg)' }}>
      <div className="phone-notch" />
      <div className="phone-screen">
        <div className="phone-status">
          <span>09:41</span>
          <span style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: '0.6rem' }}>▮▮▮ 5G</span>
        </div>
        <div className="phone-content">
          <div className="phone-appbar">
            <span className="pa-logo">BK</span>
            <div>
              <b>Bonjour, Awa</b>
              <small>Licence Kinésithérapie · L1</small>
            </div>
            <span className="dot" style={{ marginLeft: 'auto' }} />
          </div>
          <div className="ph-hero">
            <small>Aujourd’hui · 23 novembre</small>
            <b>Rééducation fonctionnelle<br />08:00 — Amphi B</b>
            <div style={{ display: 'flex', gap: 6, marginTop: 9 }}>
              <span className="chip on-dark" style={{ fontSize: '0.55rem', padding: '3px 8px' }}>
                Salle B204
              </span>
              <span className="chip on-dark" style={{ fontSize: '0.55rem', padding: '3px 8px' }}>
                Pr. Traoré
              </span>
            </div>
          </div>
          <div className="ph-grid2">
            <div className="ph-mini">
              <small>Moyenne S1</small>
              <b>15,4<span style={{ fontSize: '0.6em', color: 'var(--emerald)' }}>/20</span></b>
            </div>
            <div className="ph-mini">
              <small>Scolarité</small>
              <b>68<span style={{ fontSize: '0.6em', color: 'rgba(4,19,15,0.45)' }}>%</span></b>
              <div className="ph-progress" style={{ marginTop: 5 }}><i style={{ width: '68%' }} /></div>
            </div>
          </div>
          <div className="ph-card">
            <div className="ph-row">
              <span className="ph-icon"><BookOpen size={13} /></span>
              <div style={{ flex: 1 }}>
                <div className="ph-label">Anatomie appliquée</div>
                <div className="ph-sub">Demain · 10:00 · Amphi A</div>
              </div>
            </div>
          </div>
          <div className="ph-card">
            <div className="ph-row">
              <span className="ph-icon"><MessagesSquare size={13} /></span>
              <div style={{ flex: 1 }}>
                <div className="ph-label">Scolarité</div>
                <div className="ph-sub">Votre reçu BNDA est disponible</div>
              </div>
              <span className="dot" />
            </div>
          </div>
          <div className="ph-tabs">
            <Smartphone className="on" />
            <BookOpen />
            <FlaskConical />
            <MessagesSquare />
          </div>
        </div>
      </div>
    </div>
  );
}
