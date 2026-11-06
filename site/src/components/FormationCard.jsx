import { Link } from 'react-router-dom';
import { ClockIcon as Clock, MapPinIcon as MapPin, ArrowUpRightIcon as ArrowUpRight } from 'lucide-react';

export default function FormationCard({ f, compact = false }) {
  return (
    <article className="formation-card">
      <Link to={`/formations/${f.slug}`} className="formation-media" aria-label={f.titre}>
        <img src={f.image} alt={f.titre} loading="lazy" />
        <div className="formation-tags">
          {f.populaire ? <span className="chip gold">Populaire</span> : null}
          <span className="chip">{f.niveau}</span>
          <span className="chip">{f.mode}</span>
        </div>
        <span className="formation-price">{f.tarif}</span>
      </Link>
      <div className="formation-body">
        <span className="cat">{f.categorie}</span>
        <h3>
          <Link to={`/formations/${f.slug}`}>{f.titre}</Link>
          {f.sousTitre ? (
            <span style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: 600, color: 'rgba(4,19,15,0.45)', marginTop: 4 }}>
              {f.sousTitre}
            </span>
          ) : null}
        </h3>
        {!compact && <p>{f.resume}</p>}
        <div className="formation-foot">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Clock /> {f.duree}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><MapPin /> {f.mode}</span>
          <span style={{ marginLeft: 'auto', color: 'var(--emerald)', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
            Découvrir <ArrowUpRight style={{ width: 13, height: 13 }} />
          </span>
        </div>
      </div>
    </article>
  );
}
