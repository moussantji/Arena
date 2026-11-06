import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRightIcon as ArrowRight, ArrowLeftIcon as ArrowLeft, CheckIcon as Check, SearchIcon as Search, GraduationCapIcon as GraduationCap, AwardIcon as Award, CreditCardIcon as CreditCard, ChevronDown, PlusIcon as Plus, MinusIcon as Minus, FileTextIcon as FileText, SparklesIcon as Sparkles, CalendarIcon as Calendar } from 'lucide-react';
import { formations, bourses, faq, school, events } from '../data/content.js';
import Reveal, { Breadcrumb, formatDate, useToast } from '../components/Reveal.jsx';

const DOCS = [
  'Quatre photos d’identité récentes',
  'Une demande timbrée adressée au Directeur de l’Institut',
  'Une copie de l’acte de naissance',
  'Une copie légalisée du diplôme requis',
];

export default function Admission() {
  const [params] = useSearchParams();
  const [step, setStep] = useState(1);
  const [formation, setFormation] = useState(params.get('formation') || '');
  const [q, setQ] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [tel, setTel] = useState('');
  const [niveau, setNiveau] = useState('');
  const [motivation, setMotivation] = useState('');
  const [docs, setDocs] = useState([]);
  const [sent, setSent] = useState(false);
  const [erreur, setErreur] = useState('');
  const { show, node } = useToast();
  const [openFaq, setOpenFaq] = useState(0);

  const selected = formations.find((f) => f.slug === formation);
  const filtered = useMemo(
    () => formations.filter((f) => `${f.titre} ${f.categorie} ${f.niveau}`.toLowerCase().includes(q.toLowerCase())),
    [q]
  );

  const toggleDoc = (d) => setDocs((v) => (v.includes(d) ? v.filter((x) => x !== d) : [...v, d]));

  const next = () => {
    setErreur('');
    if (step === 1 && !formation) return setErreur('Sélectionnez une formation pour continuer.');
    if (step === 2) {
      if (!nom.trim() || !email.trim() || !tel.trim()) return setErreur('Renseignez votre nom, votre e-mail et votre téléphone.');
      if (!/^\S+@\S+\.\S+$/.test(email)) return setErreur('L’adresse e-mail n’est pas valide.');
    }
    if (step === 3 && !niveau) return setErreur('Indiquez votre dernier diplôme obtenu.');
    setStep((s) => Math.min(4, s + 1));
    window.scrollTo({ top: 220, behavior: 'smooth' });
  };

  const back = () => { setErreur(''); setStep((s) => Math.max(1, s - 1)); };

  const submit = (e) => {
    e.preventDefault();
    setSent(true);
    show('Dossier transmis au service des admissions');
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Breadcrumb items={[{ label: 'Admission' }]} />
          <div style={{ display: 'grid', gap: 16, maxWidth: 760, paddingTop: 8 }}>
            <span className="eyebrow">Admission en ligne · Rentrée 2026 — 2027</span>
            <h1 className="display-lg">
              Complétez votre dossier <span className="italic-accent">à votre rythme</span>
            </h1>
            <p className="lead">
              Chaque étape est vérifiée avant de continuer. Vous pourrez relire toutes vos informations avant
              l’envoi — aucune pièce justificative n’est à téléverser ici, elles seront demandées au dépôt.
            </p>
          </div>
        </div>
      </section>

      <section className="section-sm" style={{ paddingTop: 10 }}>
        <div className="container">
          <div className="desk-cols" style={{ gap: 26, alignItems: 'start' }}>
            <Reveal className="card" style={{ padding: 'clamp(20px,3vw,32px)', display: 'grid', gap: 22 }}>
              <div className="stepper">
                {[
                  { n: 1, l: 'Formation' },
                  { n: 2, l: 'Identité' },
                  { n: 3, l: 'Parcours' },
                  { n: 4, l: 'Vérification' },
                ].map((s, i) => (
                  <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    <span className={`step-dot ${step === s.n ? 'on' : ''} ${step > s.n ? 'done' : ''}`}>
                      <span className="n">{step > s.n ? '✓' : s.n}</span>
                      {s.l}
                    </span>
                    {i < 3 && <span className="step-line" />}
                  </div>
                ))}
              </div>

              {sent ? (
                <div style={{ display: 'grid', gap: 16, justifyItems: 'start', padding: '20px 0' }}>
                  <span style={{ width: 60, height: 60, borderRadius: 99, background: 'rgba(15,111,82,0.12)', color: 'var(--emerald)', display: 'grid', placeItems: 'center' }}>
                    <Check size={28} />
                  </span>
                  <h2 className="display-md">Dossier transmis avec succès</h2>
                  <p style={{ fontSize: '0.94rem', color: 'rgba(4,19,15,0.66)', maxWidth: '56ch' }}>
                    Merci <strong>{nom}</strong>. Votre demande pour <strong>{selected?.titre}</strong> a été
                    enregistrée. Le service des admissions de l’IPFS-BK vous contactera au {tel} ou par e-mail à{' '}
                    {email} sous 48 h ouvrées.
                  </p>
                  <div style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'rgba(217,178,106,0.14)', border: '1px solid rgba(217,178,106,0.4)', fontSize: '0.84rem', color: '#6d5318' }}>
                    <strong>Référence :</strong> IPFSBK-{(selected?.slug || 'doc').slice(0, 4).toUpperCase()}-
                    {new Date().getFullYear()}-{String(Math.floor(Math.random() * 9000) + 1000)}
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <Link to="/formations" className="btn btn-primary">Voir d’autres formations</Link>
                    <a href={`tel:${school.phones[0].replace(/\s/g, '')}`} className="btn btn-ghost">{school.phones[0]}</a>
                  </div>
                </div>
              ) : (
                <form onSubmit={submit} style={{ display: 'grid', gap: 20 }}>
                  {step === 1 && (
                    <>
                      <div>
                        <h2 className="display-sm">Quelle formation souhaitez-vous suivre ?</h2>
                        <p style={{ fontSize: '0.86rem', color: 'rgba(4,19,15,0.55)', marginTop: 5 }}>
                          Recherchez puis sélectionnez le parcours qui correspond à votre projet.
                        </p>
                      </div>
                      <label className="search-box">
                        <Search />
                        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une formation" />
                      </label>
                      <div style={{ display: 'grid', gap: 8, maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
                        {filtered.map((f) => (
                          <button
                            type="button"
                            key={f.slug}
                            className={`choice-card ${formation === f.slug ? 'on' : ''}`}
                            onClick={() => setFormation(f.slug)}
                          >
                            <span className="radio-dot" />
                            <span style={{ flex: 1 }}>
                              <b>{f.titre}</b>
                              <small>{f.categorie} • {f.niveau} • {f.tarif}</small>
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div>
                        <h2 className="display-sm">Vos informations personnelles</h2>
                        <p style={{ fontSize: '0.86rem', color: 'rgba(4,19,15,0.55)', marginTop: 5 }}>
                          Elles serviront à vous recontacter pour la suite de l’admission.
                        </p>
                      </div>
                      <div className="form-grid">
                        <div className="field full">
                          <label htmlFor="nom">Nom complet</label>
                          <input id="nom" className="input" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Prénom et nom" required />
                        </div>
                        <div className="field">
                          <label htmlFor="email">Adresse email</label>
                          <input id="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@email.com" required />
                        </div>
                        <div className="field">
                          <label htmlFor="tel">Téléphone</label>
                          <input id="tel" className="input" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="+223 __ __ __ __" required />
                        </div>
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <div>
                        <h2 className="display-sm">Votre parcours</h2>
                        <p style={{ fontSize: '0.86rem', color: 'rgba(4,19,15,0.55)', marginTop: 5 }}>
                          Précisez votre dernier diplôme et cochez les pièces que vous pouvez fournir.
                        </p>
                      </div>
                      <div className="form-grid">
                        <div className="field">
                          <label htmlFor="niv">Dernier diplôme obtenu</label>
                          <select id="niv" className="select" value={niveau} onChange={(e) => setNiveau(e.target.value)}>
                            <option value="">Sélectionner…</option>
                            <option>DEF (Diplôme d’études fondamentales)</option>
                            <option>BAC</option>
                            <option>BT / DUT / BTS</option>
                            <option>Licence ou plus</option>
                            <option>Expérience professionnelle</option>
                          </select>
                        </div>
                        <div className="field">
                          <label htmlFor="form">Formation choisie</label>
                          <input id="form" className="input" value={selected?.titre || '—'} readOnly />
                        </div>
                        <div className="field full">
                          <label>Pièces que je peux fournir</label>
                          <div style={{ display: 'grid', gap: 8 }}>
                            {DOCS.map((d) => (
                              <button type="button" key={d} className={`choice-card ${docs.includes(d) ? 'on' : ''}`} onClick={() => toggleDoc(d)}>
                                <span className="radio-dot" />
                                <span><b style={{ fontWeight: 600 }}>{d}</b></span>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="field full">
                          <label htmlFor="mot">Vos motivations (facultatif)</label>
                          <textarea id="mot" className="textarea" value={motivation} onChange={(e) => setMotivation(e.target.value)} placeholder="Quelques lignes sur votre projet professionnel…" />
                        </div>
                      </div>
                    </>
                  )}

                  {step === 4 && (
                    <>
                      <div>
                        <h2 className="display-sm">Vérifiez votre dossier</h2>
                        <p style={{ fontSize: '0.86rem', color: 'rgba(4,19,15,0.55)', marginTop: 5 }}>
                          Relisez les informations avant l’envoi au service des admissions.
                        </p>
                      </div>
                      <div style={{ display: 'grid', gap: 1, background: 'var(--line)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                        {[
                          ['Formation', selected?.titre || '—'],
                          ['Niveau requis', selected?.niveau || '—'],
                          ['Durée / mode', selected ? `${selected.duree} · ${selected.mode}` : '—'],
                          ['Tarif', selected?.tarif || '—'],
                          ['Nom complet', nom],
                          ['E-mail', email],
                          ['Téléphone', tel],
                          ['Dernier diplôme', niveau],
                          ['Pièces fournies', docs.length ? `${docs.length} / 4` : 'Aucune'],
                          ['Motivations', motivation ? 'Renseignées' : 'Non renseignées'],
                        ].map(([k, v]) => (
                          <div key={k} style={{ background: '#fff', display: 'flex', justifyContent: 'space-between', gap: 16, padding: '12px 16px', fontSize: '0.86rem' }}>
                            <span style={{ color: 'rgba(4,19,15,0.5)' }}>{k}</span>
                            <span style={{ fontWeight: 600, textAlign: 'right' }}>{v}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'rgba(15,111,82,0.06)', border: '1px solid rgba(15,111,82,0.16)', fontSize: '0.8rem', color: 'rgba(4,19,15,0.66)' }}>
                        Les frais seront réglés par versement ou virement sur le compte BNDA{' '}
                        <strong>{school.bank.compte}</strong>. Aucun paiement n’est demandé en ligne.
                      </div>
                    </>
                  )}

                  {erreur && <span className="error-text">{erreur}</span>}

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', paddingTop: 6 }}>
                    {step > 1 && (
                      <button type="button" className="btn btn-ghost" onClick={back}>
                        <ArrowLeft /> Retour
                      </button>
                    )}
                    {step < 4 ? (
                      <button type="button" className="btn btn-primary" onClick={next}>
                        Valider et continuer <ArrowRight className="arrow" />
                      </button>
                    ) : (
                      <button type="submit" className="btn btn-primary">
                        Envoyer mon dossier <ArrowRight className="arrow" />
                      </button>
                    )}
                    <span style={{ fontSize: '0.76rem', color: 'rgba(4,19,15,0.42)' }}>
                      Étape {step} sur 4
                    </span>
                  </div>
                </form>
              )}
            </Reveal>

            <aside style={{ display: 'grid', gap: 14 }}>
              <div className="card" style={{ padding: 22, display: 'grid', gap: 12 }}>
                <span className="eyebrow">Dossier d’inscription</span>
                <div style={{ display: 'grid', gap: 8 }}>
                  {DOCS.map((d) => (
                    <div key={d} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: '0.82rem', color: 'rgba(4,19,15,0.66)' }}>
                      <FileText size={14} style={{ color: 'var(--emerald)', flex: 'none', marginTop: 3 }} /> {d}
                    </div>
                  ))}
                </div>
              </div>
              <div className="card" style={{ padding: 22, display: 'grid', gap: 10 }}>
                <span className="eyebrow">Paiement</span>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', letterSpacing: '0.02em' }}>BNDA {school.bank.compte}</div>
                <p style={{ fontSize: '0.8rem', color: 'rgba(4,19,15,0.55)' }}>
                  Versement ou virement bancaire. Échéanciers possibles sur demande motivée à la Direction
                  administrative et financière.
                </p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.76rem', color: 'var(--emerald)', fontWeight: 700 }}>
                  <CreditCard size={14} /> Aucun paiement en ligne
                </div>
              </div>
              <div className="card" style={{ padding: 22, display: 'grid', gap: 10 }}>
                <span className="eyebrow">Accompagnement</span>
                <p style={{ fontSize: '0.82rem', color: 'rgba(4,19,15,0.58)' }}>
                  Une question sur votre dossier ? Notre équipe vous répond par téléphone ou WhatsApp.
                </p>
                <a href={`tel:${school.phones[1].replace(/\s/g, '')}`} className="link-arrow">{school.phones[1]} <ArrowRight size={14} /></a>
                <a href={school.whatsappUrl} target="_blank" rel="noreferrer" className="link-arrow">WhatsApp {school.whatsapp}</a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Bourses */}
      <section className="section-sm" id="bourses" style={{ background: 'var(--cream-2)' }}>
        <div className="container">
          <div className="section-head">
            <div className="titles">
              <span className="eyebrow">Opportunités</span>
              <h2 className="display-md">Bourses et facilités de paiement</h2>
              <p className="lead">
                L’Institut accompagne les candidats motivés : bourses au mérite, appui à l’engagement communautaire
                et échéanciers de paiement.
              </p>
            </div>
          </div>
          <div className="grid-3">
            {bourses.map((b, i) => (
              <Reveal key={b.titre} delay={i * 80} className="card" style={{ padding: 26, display: 'grid', gap: 12, alignContent: 'start' }}>
                <span className="chip gold" style={{ justifySelf: 'start' }}><Award size={12} /> {b.badge}</span>
                <h3 style={{ fontSize: '1.14rem' }}>{b.titre}</h3>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--emerald)' }}>{b.montant}</div>
                <p style={{ fontSize: '0.86rem', color: 'rgba(4,19,15,0.6)' }}>{b.criteres}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.76rem', color: 'rgba(4,19,15,0.5)' }}>
                  <Sparkles size={13} /> {b.places}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Agenda */}
      <section className="section-sm">
        <div className="container">
          <div className="section-head">
            <div className="titles">
              <span className="eyebrow">Agenda</span>
              <h2 className="display-md">Prochaines dates à retenir</h2>
            </div>
            <Link to="/blog" className="link-arrow">Voir les actualités <ArrowRight size={14} /></Link>
          </div>
          <div className="grid-3">
            {events.map((e, i) => (
              <Reveal key={e.titre} delay={i * 80} className="card" style={{ padding: 24, display: 'grid', gap: 12, alignContent: 'start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(15,111,82,0.09)', color: 'var(--emerald)', display: 'grid', placeItems: 'center' }}>
                    <Calendar size={19} />
                  </span>
                  <div>
                    <b style={{ fontSize: '0.84rem', display: 'block' }}>{formatDate(e.date)}</b>
                    <small style={{ fontSize: '0.74rem', color: 'rgba(4,19,15,0.5)' }}>{e.heure}</small>
                  </div>
                </div>
                <h3 style={{ fontSize: '1.04rem' }}>{e.titre}</h3>
                <p style={{ fontSize: '0.84rem', color: 'rgba(4,19,15,0.58)' }}>{e.texte}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="chip emerald">{e.type}</span>
                  <span className="chip">{e.lieu}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-sm" id="faq" style={{ paddingBottom: 'clamp(50px,7vw,90px)' }}>
        <div className="container">
          <div className="split" style={{ alignItems: 'start' }}>
            <div style={{ display: 'grid', gap: 14 }}>
              <span className="eyebrow">Questions fréquentes</span>
              <h2 className="display-md">Tout ce qu’il faut savoir avant de candidater</h2>
              <p className="lead">Une question qui n’apparaît pas ici ? Notre équipe d’accompagnement vous répond.</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
                <Link to="/contact" className="btn btn-primary">Poser ma question <ArrowRight className="arrow" /></Link>
                <a href={school.whatsappUrl} target="_blank" rel="noreferrer" className="btn btn-ghost">WhatsApp</a>
              </div>
            </div>
            <div>
              {faq.map((f, i) => (
                <div key={f.q} className={`faq-item ${openFaq === i ? 'open' : ''}`}>
                  <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? -1 : i)} aria-expanded={openFaq === i}>
                    {f.q}
                    <span className="ic">{openFaq === i ? <Minus size={14} /> : <Plus size={14} />}</span>
                  </button>
                  <div className="faq-a"><p>{f.r}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {node}
    </>
  );
}
