import { Link } from 'react-router-dom';
import { ShieldCheckIcon as ShieldCheck, LandmarkIcon as Landmark, UsersIcon as Users, ArrowRightIcon as ArrowRight, ArrowUpRightIcon as ArrowUpRight, MapPinIcon as MapPin, StarIcon as Star, MailIcon as Mail, QuoteIcon as Quote, CheckIcon as Check, HandHeartIcon as HandHeart, LightbulbIcon as Lightbulb, Globe2Icon as Globe2 } from 'lucide-react';

const VALUE_ICONS = { ShieldCheck, HandHeart, Lightbulb, Globe2 };
import { school, valeurs, piliers, equipe, terrains, stats } from '../data/content.js';
import Reveal, { Breadcrumb } from '../components/Reveal.jsx';

export default function About() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Breadcrumb items={[{ label: 'À propos' }]} />
          <div className="split" style={{ alignItems: 'end', paddingTop: 10 }}>
            <div style={{ display: 'grid', gap: 16 }}>
              <span className="eyebrow">Notre histoire</span>
              <h1 className="display-lg">
                Une initiative malienne <span className="italic-accent">au service de la santé</span>
              </h1>
              <p className="lead">
                L’Institut Privé de Formation Sanitaire Bernard Kouchner est né de la volonté de professionnels
                maliens de la santé de réunir leurs expériences et de renforcer durablement les compétences locales.
              </p>
            </div>
            <Reveal className="media-frame" style={{ borderRadius: 'var(--r-lg)' }}>
              <img src="/img/campus.jpg" alt="Campus IPFS-BK" style={{ aspectRatio: '4/3' }} />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container">
          <div className="grid-2" style={{ gap: 40, alignItems: 'start' }}>
            <Reveal style={{ display: 'grid', gap: 16 }}>
              <p style={{ fontSize: '1.02rem', lineHeight: 1.8, color: 'rgba(4,19,15,0.76)' }}>
                Les enseignements tirés des crises sanitaires récentes ont confirmé l’importance de former des
                professionnels rigoureux, solidaires et capables d’agir au plus près des réalités du terrain.
              </p>
              <p style={{ fontSize: '1.02rem', lineHeight: 1.8, color: 'rgba(4,19,15,0.76)' }}>
                Notre ambition est de contribuer à la souveraineté sanitaire du Mali et du Sahel par la formation
                initiale et continue, l’innovation pédagogique et l’accompagnement des futurs acteurs de la santé.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                <Link to="/formations" className="btn btn-primary">Voir les formations <ArrowRight className="arrow" /></Link>
                <Link to="/admission" className="btn btn-ghost">S’inscrire</Link>
              </div>
            </Reveal>

            <div className="grid-2" style={{ gap: 14 }}>
              {stats.map((s) => (
                <Reveal key={s.label} className="stat-card">
                  <b>{s.value}<i>{s.suffix}</i></b>
                  <span>{s.label}</span>
                  <small>{s.detail}</small>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Reconnaissance */}
      <section className="section-sm">
        <div className="container">
          <div className="section-head">
            <div className="titles">
              <span className="eyebrow">Reconnaissance officielle</span>
              <h2 className="display-md">Autorisation ministérielle et paiement sécurisé</h2>
              <p className="lead">
                Pour rassurer les parents, les candidats et les partenaires, l’Institut affiche clairement ses
                références officielles et ses modalités de paiement.
              </p>
            </div>
          </div>
          <div className="grid-3">
            {[
              { icon: ShieldCheck, t: 'Références officielles du MESRS', d: `Création : ${school.agrement.creation}. Ouverture : ${school.agrement.ouverture}. Localisation : Hippodrome-Bamako.` },
              { icon: Landmark, t: 'Versement ou virement bancaire', d: `Paiement sur le compte BNDA de l’Institut Bernard Kouchner : ${school.bank.compte}.` },
              { icon: Users, t: 'Accompagnement administratif', d: 'L’équipe accompagne les candidats dans le choix de la formation, la constitution du dossier et le suivi de l’inscription.' },
            ].map((x, i) => (
              <Reveal key={x.t} delay={i * 90} className="card value-card">
                <div className="value-icon"><x.icon /></div>
                <h3 style={{ fontSize: '1.1rem' }}>{x.t}</h3>
                <p>{x.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Valeurs */}
      <section className="section band-dark noise">
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="section-head">
            <Reveal className="titles">
              <span className="eyebrow">Pourquoi nous choisir</span>
              <h2 className="display-md" style={{ color: '#fff' }}>Des valeurs fortes au service de l’apprentissage</h2>
            </Reveal>
          </div>
          <div className="grid-4">
            {valeurs.map((v, i) => {
              const Icon = VALUE_ICONS[v.icon] || ShieldCheck;
              return (
                <Reveal
                  key={v.titre}
                  delay={i * 80}
                  style={{
                    padding: 24, borderRadius: 'var(--r-md)',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'grid', gap: 12, alignContent: 'start',
                  }}
                >
                  <span style={{ width: 48, height: 48, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'rgba(47,199,154,0.14)', color: 'var(--jade)' }}>
                    <Icon size={22} />
                  </span>
                  <h3 style={{ color: '#fff', fontSize: '1.1rem' }}>{v.titre}</h3>
                  <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.62)' }}>{v.texte}</p>
                </Reveal>
              );
            })}
          </div>

          <div style={{ display: 'grid', gap: 0, marginTop: 46 }}>
            {piliers.map((p) => (
              <div className="pillar" key={p.num}>
                <span className="n">{p.num}</span>
                <div>
                  <h3>{p.titre}</h3>
                  <p>{p.texte}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Équipe */}
      <section className="section" id="equipe">
        <div className="container">
          <div className="section-head">
            <div className="titles">
              <span className="eyebrow">Notre équipe</span>
              <h2 className="display-md">L’administration qui accompagne l’institut</h2>
              <p className="lead">
                Des membres de l’administration engagés dans l’organisation, l’encadrement et le bon fonctionnement
                de l’établissement.
              </p>
            </div>
          </div>
          <div className="grid-3">
            {equipe.map((m, i) => (
              <Reveal key={m.nom} delay={i * 90} className="team-card">
                <img src={m.image} alt={m.nom} />
                <div className="team-info">
                  <b>{m.nom}</b>
                  <small>{m.role}</small>
                  <a href={`mailto:${m.email}`}><Mail /> {m.email}</a>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Localisation + terrain */}
      <section className="section-sm" style={{ background: 'var(--cream-2)' }}>
        <div className="container">
          <div className="split" style={{ alignItems: 'stretch' }}>
            <Reveal className="card" style={{ padding: 'clamp(22px,3vw,34px)', display: 'grid', gap: 16, alignContent: 'start' }}>
              <span className="eyebrow">Localisation</span>
              <h2 className="display-sm">Institut Privé de Formation Sanitaire Bernard Kouchner</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>{school.rating.score}</span>
                <div className="testi-stars" style={{ display: 'flex' }}>{[0, 1, 2, 3, 4].map((i) => <Star key={i} size={13} fill="currentColor" />)}</div>
                <a href={school.mapsUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--emerald)', fontWeight: 700 }}>
                  ({school.rating.reviews} avis)
                </a>
              </div>
              <div style={{ display: 'grid', gap: 10, fontSize: '0.9rem', color: 'rgba(4,19,15,0.7)' }}>
                <span style={{ display: 'flex', gap: 10 }}><MapPin size={16} style={{ color: 'var(--emerald)', flex: 'none', marginTop: 2 }} /> {school.address}</span>
                <span style={{ display: 'flex', gap: 10 }}><Star size={16} style={{ color: 'var(--emerald)', flex: 'none', marginTop: 2 }} /> Quartier Hippodrome 1, non loin du siège d’Orange Mali (RN27).</span>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a href={school.mapsUrl} target="_blank" rel="noreferrer" className="btn btn-primary">Obtenir l’itinéraire <ArrowUpRight className="arrow" /></a>
                <a href={`tel:${school.phones[0].replace(/\s/g, '')}`} className="btn btn-ghost">{school.phones[0]}</a>
              </div>
            </Reveal>

            <Reveal delay={100} className="card" style={{ overflow: 'hidden', display: 'grid', gridTemplateRows: 'auto 1fr' }}>
              <div style={{ padding: 'clamp(20px,3vw,28px)', display: 'grid', gap: 10 }}>
                <span className="eyebrow">Expérience terrain</span>
                <h3 className="display-sm">Nos terrains de stage</h3>
                <p style={{ fontSize: '0.88rem', color: 'rgba(4,19,15,0.6)' }}>
                  Les stages commencent dès la fin du premier semestre, selon la filière et la programmation
                  pédagogique.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                  {terrains.map((t) => <span key={t} className="chip emerald">{t}</span>)}
                </div>
              </div>
              <img src="/img/care.jpg" alt="Étudiante sage-femme en stage" style={{ width: '100%', height: '100%', minHeight: 200, objectFit: 'cover' }} />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-sm" style={{ paddingBottom: 'clamp(50px,7vw,90px)' }}>
        <div className="container">
          <Reveal style={{ position: 'relative', borderRadius: 'var(--r-xl)', overflow: 'hidden', minHeight: 380, display: 'grid', alignContent: 'end', padding: 'clamp(26px,4vw,54px)', color: '#fff' }}>
            <img src="/img/graduation.jpg" alt="4ème promotion de l’IPFS-BK" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(4,19,15,0.35), rgba(4,19,15,0.94))' }} />
            <div style={{ position: 'relative', zIndex: 2, display: 'grid', gap: 16, maxWidth: 680 }}>
              <span className="chip glass" style={{ justifySelf: 'start' }}><Quote size={12} /> 4ème promotion « Feu Général Sadio Camara »</span>
              <h2 className="display-md" style={{ color: '#fff' }}>
                « Former des professionnels rigoureux, solidaires et capables d’agir au plus près du terrain. »
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.96rem' }}>
                9 mai 2026 — l’IPFS-BK célébrait la sortie de sa quatrième promotion, entourée des familles, des
                formateurs et des partenaires hospitaliers.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/formations" className="btn btn-gold btn-lg">Voir les formations <ArrowRight className="arrow" /></Link>
                <Link to="/admission" className="btn btn-light btn-lg">S’inscrire</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
