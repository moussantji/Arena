#!/usr/bin/env node
/**
 * Exécute figma/diallo-indigo/code.js dans un faux contexte Figma, puis écrit
 * tools/scene.json : l'arbre de calques réel (frames, rectangles, ellipses, textes)
 * avec les positions calculées par l'auto-layout.
 *
 * But : produire des écrans **éditables** (vecteurs + textes) dans le .sketch,
 * au lieu de captures d'écran aplaties.
 *
 * Usage :
 *   node tools/figma-mock.js            # → tools/scene.json
 *   node tools/figma-mock.js build-all  # autre commande du plugin
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.dirname(__dirname);
const CODE = path.join(ROOT, 'figma', 'diallo-indigo', 'code.js');
const OUT = path.join(__dirname, 'scene.json');

/* ------------------------------------------------------------ mesure du texte */
// Largeurs d'avance Inter approximatives, en em.
const W = {
  ' ': 0.26, '!': 0.28, '"': 0.42, '#': 0.62, $: 0.6, '%': 0.86, '&': 0.68, "'": 0.21,
  '(': 0.33, ')': 0.33, '*': 0.44, '+': 0.6, ',': 0.25, '-': 0.33, '.': 0.25, '/': 0.42,
  0: 0.58, 1: 0.58, 2: 0.58, 3: 0.58, 4: 0.58, 5: 0.58, 6: 0.58, 7: 0.58, 8: 0.58, 9: 0.58,
  ':': 0.25, ';': 0.25, '<': 0.6, '=': 0.6, '>': 0.6, '?': 0.48, '@': 0.96,
  A: 0.64, B: 0.6, C: 0.62, D: 0.65, E: 0.55, F: 0.53, G: 0.66, H: 0.66, I: 0.26, J: 0.48,
  K: 0.59, L: 0.52, M: 0.8, N: 0.67, O: 0.69, P: 0.58, Q: 0.69, R: 0.6, S: 0.56, T: 0.55,
  U: 0.66, V: 0.62, W: 0.92, X: 0.58, Y: 0.57, Z: 0.54,
  a: 0.53, b: 0.57, c: 0.52, d: 0.57, e: 0.54, f: 0.35, g: 0.56, h: 0.57, i: 0.25, j: 0.25,
  k: 0.51, l: 0.25, m: 0.87, n: 0.57, o: 0.57, p: 0.57, q: 0.57, r: 0.37, s: 0.49, t: 0.36,
  u: 0.57, v: 0.5, w: 0.75, x: 0.49, y: 0.5, z: 0.47,
  '·': 0.3, '—': 0.94, '–': 0.55, '×': 0.6, '’': 0.21, '…': 0.8, '«': 0.45, '»': 0.45,
  é: 0.54, è: 0.54, ê: 0.54, à: 0.53, â: 0.53, ç: 0.52, ù: 0.57, û: 0.57, î: 0.25,
  ï: 0.25, ô: 0.57, œ: 0.85, É: 0.55, È: 0.55, À: 0.64, Ç: 0.62, Ê: 0.55, Î: 0.26,
};

function textWidth(node) {
  const size = node.fontSize || 12;
  const track = node.letterSpacing && node.letterSpacing.unit === 'PIXELS' ? node.letterSpacing.value : 0;
  let em = 0;
  for (const ch of node.characters || '') em += W[ch] !== undefined ? W[ch] : 0.56;
  return Math.max(1, em * size + track * Math.max(0, (node.characters || '').length - 1));
}

function textHeight(node) {
  const size = node.fontSize || 12;
  const lh = node.lineHeight;
  if (lh && lh.unit === 'PERCENT' && lh.value) return (size * lh.value) / 100;
  if (lh && lh.unit === 'PIXELS' && lh.value) return lh.value;
  return Math.round(size * 1.21 * 100) / 100;
}

/* ------------------------------------------------------------------- nœuds */
let counter = 0;

class Node {
  constructor(type) {
    this.type = type;
    this.id = `n${++counter}`;
    this.name = type;
    this.parent = null;
    this.children = [];
    this._x = 0;
    this._y = 0;
    this._w = type === 'PAGE' ? 0 : 100;
    this._h = type === 'PAGE' ? 0 : 100;
    this.fills = [];
    this.strokes = [];
    this.strokeWeight = 1;
    this.strokeAlign = 'INSIDE';
    this.cornerRadius = 0;
    this.opacity = 1;
    this.effects = [];
    this.clipsContent = true;
    this.visible = true;
    this.layoutMode = 'NONE';
    this.itemSpacing = 0;
    this.paddingTop = 0;
    this.paddingRight = 0;
    this.paddingBottom = 0;
    this.paddingLeft = 0;
    this.primaryAxisSizingMode = 'FIXED';
    this.counterAxisSizingMode = 'FIXED';
    this.characters = '';
    this.fontName = { family: 'Inter', style: 'Regular' };
    this.fontSize = 12;
    this.letterSpacing = { value: 0, unit: 'PIXELS' };
    this.lineHeight = { value: 0, unit: 'AUTO' };
    this.textAlignHorizontal = 'LEFT';
    this.textAutoResize = 'WIDTH_AND_HEIGHT';
  }

  get x() { return this._x; }
  set x(v) { this._x = v; }
  get y() { return this._y; }
  set y(v) { this._y = v; }

  get width() {
    if (this.type === 'TEXT') {
      if (this.textAutoResize === 'WIDTH_AND_HEIGHT') return textWidth(this);
      return this._w;
    }
    if (this.layoutMode !== 'NONE') return autoSize(this).w;
    return this._w;
  }
  set width(v) { this._w = v; }

  get height() {
    if (this.type === 'TEXT') {
      if (this.textAutoResize === 'HEIGHT' || this.textAutoResize === 'WIDTH_AND_HEIGHT') {
        return Math.max(textHeight(this), this.textAutoResize === 'HEIGHT' ? this._h : 0);
      }
      return this._h;
    }
    if (this.layoutMode !== 'NONE') return autoSize(this).h;
    return this._h;
  }
  set height(v) { this._h = v; }

  resize(w, h) {
    this._w = w;
    if (h !== undefined) this._h = h;
  }

  appendChild(child) {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  appendTo(parent) {
    parent.appendChild(this);
  }

  remove() {
    if (this.parent) {
      this.parent.children = this.parent.children.filter((c) => c !== this);
      this.parent = null;
    }
  }
}

function autoSize(node) {
  const horizontal = node.layoutMode === 'HORIZONTAL';
  let main = 0;
  let cross = 0;
  node.children.forEach((child, i) => {
    const cm = horizontal ? child.width : child.height;
    const cc = horizontal ? child.height : child.width;
    main += cm + (i ? node.itemSpacing : 0);
    cross = Math.max(cross, cc);
  });
  const padMain = horizontal
    ? node.paddingLeft + node.paddingRight
    : node.paddingTop + node.paddingBottom;
  const padCross = horizontal
    ? node.paddingTop + node.paddingBottom
    : node.paddingLeft + node.paddingRight;
  main += padMain;
  cross += padCross;

  const w = horizontal
    ? node.primaryAxisSizingMode === 'AUTO' ? main : node._w
    : node.counterAxisSizingMode === 'AUTO' ? cross : node._w;
  const h = horizontal
    ? node.counterAxisSizingMode === 'AUTO' ? cross : node._h
    : node.primaryAxisSizingMode === 'AUTO' ? main : node._h;
  return { w, h };
}

/* ------------------------------------------------------------------ figma */
function makeFigma(command) {
  const pages = [];
  let current = null;

  const page = () => {
    if (!current) {
      current = new Node('PAGE');
      current.name = 'Page 1';
      pages.push(current);
    }
    return current;
  };

  const api = {
    command,
    root: { name: 'Document' },
    notify: (msg) => sandboxNotifications.push(String(msg)),
    closePlugin: () => {},
    loadFontAsync: async () => {},
    loadAllPagesAsync: async () => {},
    createFrame: () => new Node('FRAME'),
    createComponent: () => new Node('COMPONENT'),
    createRectangle: () => new Node('RECTANGLE'),
    createEllipse: () => new Node('ELLIPSE'),
    createText: () => new Node('TEXT'),
    createPage: () => {
      const p = new Node('PAGE');
      p.name = 'Page';
      pages.push(p);
      return p;
    },
    createPaintStyle: () => ({}),
    createTextStyle: () => ({}),
    createEffectStyle: () => ({}),
    get currentPage() {
      return page();
    },
    set currentPage(p) {
      current = p;
    },
    get pages() {
      return pages;
    },
  };
  const sandboxNotifications = [];
  return { api, pages, notifications: sandboxNotifications };
}

/* ------------------------------------------------------------------- dump */
const hex = (c) => {
  const to = (v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0');
  return `#${to(c.r)}${to(c.g)}${to(c.b)}`.toUpperCase();
};

function paintSpec(paint) {
  if (!paint) return null;
  if (paint.type === 'SOLID') {
    return {
      kind: 'solid',
      hex: hex(paint.color),
      alpha: Math.round((paint.opacity !== undefined ? paint.opacity : 1) * (paint.color.a !== undefined ? paint.color.a : 1) * 1000) / 1000,
    };
  }
  if (paint.type === 'GRADIENT_LINEAR' || paint.type === 'GRADIENT_RADIAL') {
    const a = paint.opacity !== undefined ? paint.opacity : 1;
    return {
      kind: paint.type === 'GRADIENT_RADIAL' ? 'radial' : 'linear',
      stops: (paint.gradientStops || []).map((s) => ({
        position: s.position,
        hex: hex(s.color),
        alpha: Math.round(s.color.a * a * 1000) / 1000,
      })),
    };
  }
  return null;
}

function dumpNode(node, ox, oy) {
  const x = ox + (node.parent && node.parent.layoutMode !== 'NONE' ? node._ax : node._x);
  const y = oy + (node.parent && node.parent.layoutMode !== 'NONE' ? node._ay : node._y);
  const w = node.width;
  const h = node.height;

  if (node.type === 'TEXT') {
    return {
      kind: 'text',
      name: node.name === 'TEXT' ? (node.characters || '').slice(0, 40) : node.name,
      x, y, w, h,
      characters: node.characters,
      fontSize: node.fontSize,
      fontStyle: (node.fontName && node.fontName.style) || 'Regular',
      align: node.textAlignHorizontal,
      kerning: node.letterSpacing && node.letterSpacing.unit === 'PIXELS' ? node.letterSpacing.value : 0,
      color: paintSpec(node.fills && node.fills[0]),
      opacity: node.opacity,
    };
  }

  const out = {
    kind: node.type === 'RECTANGLE' ? 'rect' : node.type === 'ELLIPSE' ? 'ellipse' : 'frame',
    name: node.name,
    x, y, w, h,
    radius: node.type === 'ELLIPSE' ? Math.min(w, h) / 2 : node.cornerRadius || 0,
    fill: paintSpec(node.fills && node.fills[0]),
    stroke: node.strokes && node.strokes[0]
      ? {
        hex: hex(node.strokes[0].color),
        alpha: Math.round((node.strokes[0].opacity !== undefined ? node.strokes[0].opacity : 1) * 1000) / 1000,
        weight: node.strokeWeight || 1,
      }
      : null,
    opacity: node.opacity,
    children: [],
  };

  if (node.layoutMode !== 'NONE') layoutChildren(node);

  for (const child of node.children) out.children.push(dumpNode(child, x, y));
  return out;
}

function layoutChildren(node) {
  const horizontal = node.layoutMode === 'HORIZONTAL';
  let cursor = horizontal ? node.paddingLeft : node.paddingTop;
  for (const child of node.children) {
    child._ax = horizontal ? cursor : node.paddingLeft;
    child._ay = horizontal ? node.paddingTop : cursor;
    cursor += (horizontal ? child.width : child.height) + node.itemSpacing;
  }
}

/* ------------------------------------------------------------------- main */
function main() {
  const command = process.argv[2] || 'build-screens';
  const { api, pages } = makeFigma(command);

  const source = fs.readFileSync(CODE, 'utf8');
  const sandbox = {
    figma: api,
    console,
    setTimeout,
    clearTimeout,
    Promise,
    __result: null,
  };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'code.js' });

  return new Promise((resolve, reject) => {
    // le plugin lance une chaîne async : on laisse la boucle se vider
    setTimeout(() => {
      try {
        const out = { pages: [] };
        for (const p of pages) {
          if (!p.children.length) continue;
          out.pages.push({
            name: p.name,
            frames: p.children.map((c) => dumpNode(c, 0, 0)),
          });
        }
        fs.writeFileSync(OUT, JSON.stringify(out));
        const frames = out.pages.reduce((n, p) => n + p.frames.length, 0);
        console.log(`OK  ${OUT} · ${out.pages.length} page(s) · ${frames} frame(s)`);
        for (const p of out.pages) {
          console.log(`    ${p.name} : ${p.frames.map((f) => `${f.name} (${f.w}×${f.h})`).join(', ')}`);
        }
        resolve();
      } catch (e) {
        reject(e);
      }
    }, 200);
  });
}

main().catch((e) => {
  console.error('ÉCHEC', e);
  process.exit(1);
});
