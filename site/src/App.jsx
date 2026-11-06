import { Routes, Route, useLocation, Navigate, Link, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Formations, { FormationDetail } from './pages/Formations.jsx';
import Blog, { ArticleDetail } from './pages/Blog.jsx';
import Application from './pages/Application.jsx';
import About from './pages/About.jsx';
import Admission from './pages/Admission.jsx';
import Contact from './pages/Contact.jsx';
import Login from './pages/Login.jsx';
import Desktop from './pages/Desktop.jsx';
import Espace from './pages/Espace.jsx';
import { formations, articles, school } from './data/content.js';
import { MessageCircleIcon as MessageCircle } from 'lucide-react';

const TITLES = {
  '/': 'Institut Bernard Kouchner — IPFS-BK | École de santé à Bamako',
  '/formations': 'Formations sanitaires — IPFS-BK Bamako',
  '/blog': 'Actualités & blog — Institut Bernard Kouchner',
  '/application': 'Application mobile — IPFS-BK',
  '/a-propos': 'À propos — Institut Bernard Kouchner, Hippodrome 1',
  '/admission': 'Admission en ligne — IPFS-BK',
  '/contact': 'Contact — Institut Bernard Kouchner, Bamako',
  '/personnel': 'Espace personnel — Version PC | IPFS-BK',
  '/espace': 'Mon espace — IPFS-BK',
  '/espace/connexion': 'Connexion — IPFS-BK',
};

function ScrollRestore() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    const base = '/' + (pathname.split('/')[1] || '');
    const title = TITLES[pathname] || TITLES[base];
    if (title) document.title = title;
  }, [pathname]);
  return null;
}

function SiteLayout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <a href={school.whatsappUrl} className="wa-float" target="_blank" rel="noreferrer" aria-label="Discuter sur WhatsApp">
        <MessageCircle />
        <span>WhatsApp</span>
      </a>
    </>
  );
}

function FormationRoute() {
  const { slug } = useParams();
  const f = formations.find((x) => x.slug === slug);
  if (!f) return <Navigate to="/formations" replace />;
  return <FormationDetail f={f} />;
}

function ArticleRoute() {
  const { slug } = useParams();
  const a = articles.find((x) => x.slug === slug);
  if (!a) return <Navigate to="/blog" replace />;
  return <ArticleDetail a={a} />;
}

function NotFound() {
  return (
    <SiteLayout>
      <section className="page-hero" style={{ minHeight: '70svh', display: 'grid', alignItems: 'center' }}>
        <div className="container" style={{ textAlign: 'center', display: 'grid', gap: 16, justifyItems: 'center' }}>
          <span className="eyebrow">Erreur 404</span>
          <h1 className="display-lg">Cette page n’existe pas</h1>
          <p className="lead" style={{ maxWidth: '46ch' }}>
            Le lien est peut-être obsolète. Revenez à l’accueil ou explorez nos formations.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/" className="btn btn-primary">Retour à l’accueil</Link>
            <Link to="/formations" className="btn btn-ghost">Voir les formations</Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

export default function App() {
  const location = useLocation();
  const isApp = ['/personnel', '/espace', '/espace/connexion'].some((p) => location.pathname.startsWith(p));

  return (
    <>
      <ScrollRestore />
      {isApp ? (
        <Routes>
          <Route path="/personnel" element={<Desktop />} />
          <Route path="/espace" element={<Espace />} />
          <Route path="/espace/connexion" element={<Login />} />
        </Routes>
      ) : (
        <SiteLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/formations" element={<Formations />} />
            <Route path="/formations/:slug" element={<FormationRoute />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<ArticleRoute />} />
            <Route path="/application" element={<Application />} />
            <Route path="/a-propos" element={<About />} />
            <Route path="/admission" element={<Admission />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SiteLayout>
      )}
    </>
  );
}
