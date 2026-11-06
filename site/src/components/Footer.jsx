import { Link } from 'react-router-dom';
import { MapPinIcon as MapPin, PhoneIcon as Phone, MailIcon as Mail, ClockIcon as Clock, MessageCircleIcon as MessageCircle } from 'lucide-react';
import { FacebookIcon as Facebook, InstagramIcon as Instagram, LinkedinIcon as Linkedin, YoutubeIcon as Youtube } from './SocialIcons.jsx';
import { school } from '../data/content.js';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="brand">
              <span className="brand-mark">BK</span>
              <span className="brand-text">
                <strong>Bernard Kouchner</strong>
                <span>Institut de formation sanitaire</span>
              </span>
            </Link>
            <p>
              Institut Privé de Formation Sanitaire Bernard Kouchner — une école de santé malienne tournée
              vers l’excellence, la rigueur et l’engagement au service des patients.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="chip on-dark">Création 2023</span>
              <span className="chip on-dark">Arrêté 2026</span>
              <span className="chip on-dark">Bamako · Mali</span>
            </div>
          </div>

          <div className="footer-col">
            <h4>Institution</h4>
            <ul>
              <li><Link to="/a-propos">À propos de l’institut</Link></li>
              <li><Link to="/a-propos#equipe">Notre équipe</Link></li>
              <li><Link to="/formations">Toutes les formations</Link></li>
              <li><Link to="/blog">Actualités & blog</Link></li>
              <li><Link to="/application">Application mobile</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Candidats</h4>
            <ul>
              <li><Link to="/admission">Admission en ligne</Link></li>
              <li><Link to="/admission#bourses">Bourses & facilités</Link></li>
              <li><Link to="/admission#faq">Questions fréquentes</Link></li>
              <li><Link to="/contact">Nous contacter</Link></li>
              <li><Link to="/espace">Espace membre</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Contact</h4>
            <div className="footer-contact">
              <div>
                <MapPin />
                <span>{school.address}</span>
              </div>
              <div>
                <Phone />
                <span>
                  {school.phones.map((p) => (
                    <a key={p} href={`tel:${p.replace(/\s/g, '')}`} style={{ display: 'block' }}>{p}</a>
                  ))}
                </span>
              </div>
              <div>
                <MessageCircle />
                <a href={school.whatsappUrl} target="_blank" rel="noreferrer">WhatsApp {school.whatsapp}</a>
              </div>
              <div>
                <Mail />
                <a href="mailto:contact@institut-bernard-kouchner.com">contact@institut-bernard-kouchner.com</a>
              </div>
              <div>
                <Clock />
                <span>Lun — Ven · 08h00 à 18h00</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {school.name}. Tous droits réservés.
          </span>
          <span style={{ opacity: 0.7 }}>
            BNDA {school.bank.compte} · {school.agrement.ouverture}
          </span>
          <div className="socials">
            <a href={school.whatsappUrl} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle /></a>
            <a href="https://www.facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook /></a>
            <a href="https://www.instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram /></a>
            <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin /></a>
            <a href="https://www.youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube"><Youtube /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
