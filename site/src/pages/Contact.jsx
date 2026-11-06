import { useState } from 'react';
import { MapPinIcon as MapPin, PhoneIcon as Phone, MailIcon as Mail, ClockIcon as Clock, MessageCircleIcon as MessageCircle, ArrowRightIcon as ArrowRight, CheckIcon as Check, SendIcon as Send, ShieldCheckIcon as ShieldCheck } from 'lucide-react';
import { school } from '../data/content.js';
import Reveal, { Breadcrumb, useToast } from '../components/Reveal.jsx';

export default function Contact() {
  const [form, setForm] = useState({ nom: '', email: '', tel: '', sujet: 'Inscription', message: '' });
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const { show, node } = useToast();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.nom || !form.email || !form.message) return setErr('Merci de renseigner votre nom, votre e-mail et votre message.');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setErr('Adresse e-mail invalide.');
    setErr('');
    setSent(true);
    show('Message envoyé — réponse sous 48 h ouvrées');
  };

  return (
    <>
      <section className="page-hero band-dark">
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="breadcrumb" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <span style={{ color: '#fff' }}>Contact</span>
          </div>
          <div style={{ display: 'grid', gap: 16, maxWidth: 720, paddingTop: 10 }}>
            <span className="eyebrow">Hippodrome 1 · Bamako · Mali</span>
            <h1 className="display-lg" style={{ color: '#fff' }}>
              Parlons de <span style={{ fontStyle: 'italic', color: 'var(--gold-2)' }}>votre projet</span>
            </h1>
            <p className="lead" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Une question sur une formation, un dossier ou un partenariat ? L’équipe de l’Institut Bernard Kouchner
              vous répond du lundi au vendredi, de 8 h à 18 h.
            </p>
          </div>
        </div>
      </section>

      <section className="section-sm" style={{ paddingTop: 34 }}>
        <div className="container">
          <div className="desk-cols" style={{ gap: 26, alignItems: 'start' }}>
            <Reveal className="card" style={{ padding: 'clamp(20px,3vw,34px)' }}>
              <span className="eyebrow">Formulaire</span>
              <h2 className="display-sm" style={{ margin: '12px 0 6px' }}>Envoyez-nous un message</h2>
              <p style={{ fontSize: '0.88rem', color: 'rgba(4,19,15,0.56)', marginBottom: 20 }}>
                Remplissez ce formulaire et nous reviendrons vers vous dans les meilleurs délais.
              </p>

              {sent ? (
                <div style={{ display: 'grid', gap: 14, justifyItems: 'start', padding: '16px 0' }}>
                  <span style={{ width: 54, height: 54, borderRadius: 99, background: 'rgba(15,111,82,0.12)', color: 'var(--emerald)', display: 'grid', placeItems: 'center' }}>
                    <Check size={26} />
                  </span>
                  <h3 className="display-sm">Message bien reçu, merci {form.nom.split(' ')[0]} !</h3>
                  <p style={{ fontSize: '0.9rem', color: 'rgba(4,19,15,0.62)', maxWidth: '52ch' }}>
                    Votre message concernant « {form.sujet} » a été transmis. Nous vous répondons à l’adresse{' '}
                    {form.email} dans les meilleurs délais.
                  </p>
                  <button className="btn btn-ghost" onClick={() => { setSent(false); setForm({ nom: '', email: '', tel: '', sujet: 'Inscription', message: '' }); }}>
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="form-grid">
                  <div className="field full">
                    <label htmlFor="c-nom">Nom complet</label>
                    <input id="c-nom" className="input" value={form.nom} onChange={set('nom')} placeholder="Prénom et nom" />
                  </div>
                  <div className="field">
                    <label htmlFor="c-email">Adresse email</label>
                    <input id="c-email" className="input" type="email" value={form.email} onChange={set('email')} placeholder="vous@email.com" />
                  </div>
                  <div className="field">
                    <label htmlFor="c-tel">Téléphone</label>
                    <input id="c-tel" className="input" value={form.tel} onChange={set('tel')} placeholder="+223 __ __ __ __" />
                  </div>
                  <div className="field full">
                    <label htmlFor="c-sujet">Sujet</label>
                    <select id="c-sujet" className="select" value={form.sujet} onChange={set('sujet')}>
                      <option>Inscription</option>
                      <option>Information sur une formation</option>
                      <option>Bourses et paiement</option>
                      <option>Partenariat / stage</option>
                      <option>Application mobile</option>
                      <option>Autre</option>
                    </select>
                  </div>
                  <div className="field full">
                    <label htmlFor="c-msg">Message</label>
                    <textarea id="c-msg" className="textarea" value={form.message} onChange={set('message')} placeholder="Écrivez votre message…" />
                  </div>
                  {err && <span className="error-text full">{err}</span>}
                  <div className="full" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" type="submit">
                      <Send /> Envoyer le message
                    </button>
                    <span style={{ fontSize: '0.74rem', color: 'rgba(4,19,15,0.45)' }}>
                      Vos données ne sont utilisées que pour traiter votre demande.
                    </span>
                  </div>
                </form>
              )}
            </Reveal>

            <aside style={{ display: 'grid', gap: 14 }}>
              <div className="card" style={{ padding: 22, display: 'grid', gap: 14 }}>
                <span className="eyebrow">Coordonnées</span>
                {[
                  { icon: MapPin, t: 'Adresse', d: school.address },
                  { icon: Phone, t: 'Téléphones', d: school.phones.join(' · ') },
                  { icon: MessageCircle, t: 'WhatsApp', d: school.whatsapp },
                  { icon: Mail, t: 'E-mail', d: 'contact@institut-bernard-kouchner.com' },
                  { icon: Clock, t: 'Horaires', d: 'Lundi — Vendredi · 08h00 à 18h00' },
                ].map((x) => (
                  <div key={x.t} style={{ display: 'flex', gap: 11 }}>
                    <span style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(15,111,82,0.09)', color: 'var(--emerald)', display: 'grid', placeItems: 'center', flex: 'none' }}>
                      <x.icon size={15} />
                    </span>
                    <div>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, color: 'rgba(4,19,15,0.42)' }}>{x.t}</div>
                      <div style={{ fontSize: '0.85rem', lineHeight: 1.45 }}>{x.d}</div>
                    </div>
                  </div>
                ))}
              </div>

              <a href={school.whatsappUrl} target="_blank" rel="noreferrer" className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 12, background: '#04130f', color: '#fff', textDecoration: 'none' }}>
                <span style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(37,211,102,0.2)', color: '#25d366', display: 'grid', placeItems: 'center' }}>
                  <MessageCircle size={19} />
                </span>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: '0.88rem' }}>Discuter sur WhatsApp</b>
                  <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.6)' }}>Réponse rapide en journée</div>
                </div>
                <ArrowRight size={16} />
              </a>

              <div className="card" style={{ padding: 20, display: 'grid', gap: 8 }}>
                <span className="eyebrow"><ShieldCheck size={12} /> Institut agréé</span>
                <p style={{ fontSize: '0.8rem', color: 'rgba(4,19,15,0.6)' }}>
                  {school.agrement.creation}.<br />
                  {school.agrement.ouverture}.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="section-sm" style={{ paddingBottom: 'clamp(50px,7vw,90px)' }}>
        <div className="container">
          <Reveal style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden', position: 'relative', minHeight: 300, display: 'grid', alignContent: 'end', padding: 'clamp(22px,4vw,40px)', color: '#fff' }}>
            <img src="/img/campus.jpg" alt="Institut agréé par le ministère" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(4,19,15,0.92), rgba(4,19,15,0.45))' }} />
            <div style={{ position: 'relative', zIndex: 2, display: 'grid', gap: 12, maxWidth: 560 }}>
              <span className="eyebrow on-dark">Institut agréé par le ministère</span>
              <h2 className="display-md" style={{ color: '#fff' }}>Venez nous rencontrer à Hippodrome 1</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.94rem' }}>
                1, derrière le siège d’Orange Mali, RN27, Bamako. Nos équipes vous accueillent du lundi au vendredi.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a href={school.mapsUrl} target="_blank" rel="noreferrer" className="btn btn-gold">Ouvrir dans Maps <ArrowRight className="arrow" /></a>
                <a href={`tel:${school.phones[0].replace(/\s/g, '')}`} className="btn btn-light">{school.phones[0]}</a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      {node}
    </>
  );
}
