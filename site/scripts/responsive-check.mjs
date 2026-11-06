// Vérifie qu'aucune page ne déborde horizontalement, à toutes les largeurs.
// Usage : node scripts/responsive-check.mjs   (nécessite un DOM : jsdom + esbuild)
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const VIEWPORTS = [320, 360, 390, 430, 640, 768, 1024, 1280, 1440, 1920, 2560];
const ROUTES = ['/', '/formations', '/formations/kinesitherapie', '/blog', '/application',
  '/a-propos', '/admission', '/contact', '/espace/connexion', '/espace', '/personnel'];

await build({
  entryPoints: ['src/main.jsx'],
  bundle: true, format: 'esm', platform: 'browser', outfile: '.rc-bundle.mjs',
  jsx: 'automatic',
  loader: { '.css': 'empty', '.woff2': 'empty', '.svg': 'empty' },
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.hot': 'undefined' },
  logLevel: 'error',
});

const code = (await import('node:fs')).readFileSync('.rc-bundle.mjs', 'utf8');
let failures = 0;

const SESSION = 'ipfsbk.session.v1';
const withSession = (route) => route === '/personnel'
  ? { nom: 'Bakary Samake', role: 'Direction des Études', initiales: 'BS', email: 'd@ipfs-bk.ml', profile: 'personnel' }
  : route === '/espace'
  ? { nom: 'Awa Traoré', role: 'Étudiant IPFS-BK', initiales: 'AT', email: 'a@ipfs-bk.ml', profile: 'etudiant' }
  : null;

for (const route of ROUTES) {
  for (const width of VIEWPORTS) {
    const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
      url: `http://localhost:5180${route}`,
      pretendToBeVisual: true,
      runScripts: 'outside-only',
    });
    const { window } = dom;
    Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 900, writable: true });
    for (const k of ['window', 'document', 'localStorage', 'HTMLElement', 'Element', 'Node', 'getComputedStyle']) {
      globalThis[k] = k === 'window' ? window : window[k];
    }
    globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
    globalThis.IntersectionObserver = window.IntersectionObserver = class { observe() {} disconnect() {} unobserve() {} };
    window.scrollTo = () => {};
    globalThis.matchMedia = window.matchMedia = () => ({
      matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
    });
    console.error = () => {};

    const session = withSession(route);
    if (session) window.localStorage.setItem(SESSION, JSON.stringify(session));
    else window.localStorage.clear();

    window.eval(code);
    await new Promise((r) => setTimeout(r, 60));

    const root = window.document.getElementById('root');
    const markup = root.innerHTML.length;
    if (process.env.VERBOSE) {
      const nb = root.querySelectorAll('*').length;
      if (width === 390 || width === 1440) console.log(`· ${route} @${width} — ${markup} o, ${nb} nœuds`);
    }
    if (markup < 2000) {
      console.log(`✗ ${route} @${width} — rendu vide (${markup} octets)`);
      failures += 1;
      continue;
    }
    // Détection de débordement : tout élément plus large que la fenêtre
    const overflows = [];
    root.querySelectorAll('*').forEach((el) => {
      const style = window.getComputedStyle(el);
      const w = parseFloat(style.width);
      if (!Number.isFinite(w)) return;
      if (w > width + 2 && style.position !== 'fixed' && style.overflow !== 'hidden') {
        const tag = el.tagName.toLowerCase();
        const cls = (el.className || '').toString().split(' ').filter(Boolean).slice(0, 2).join('.');
        overflows.push(`${tag}${cls ? '.' + cls : ''} ${Math.round(w)}px`);
      }
    });
    const unique = [...new Set(overflows)];
    if (unique.length) {
      console.log(`⚠ ${route} @${width} — ${unique.length} élément(s) large(s) : ${unique.slice(0, 4).join(', ')}`);
      failures += 1;
    }
    window.close();
  }
}

console.log(failures === 0 ? '\n✓ Aucun débordement détecté sur toutes les pages × largeurs' : `\n${failures} problème(s) détecté(s)`);
process.exit(failures === 0 ? 0 : 1);
