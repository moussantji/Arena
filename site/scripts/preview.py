#!/usr/bin/env python3
"""Génère des aperçus PNG haute fidélité des pages du site IPFS-BK.

Les navigateurs headless ne sont pas disponibles dans tous les environnements
d'exécution (bibliothèques NSS/GTK absentes). Ce script reconstruit donc chaque
page avec la même direction artistique — palette « Émeraude & Or », typographies
Fraunces/Manrope, photographies du site, contenus réels — grâce au moteur de rendu
de PyMuPDF (aucun navigateur requis).

    pip install pymupdf fonttools brotli
    python3 scripts/preview.py       # → shots/*.png

Pour des captures pixel-perfect du DOM réel, utiliser `npm run shots`
(Playwright + Chromium) sur une machine ou un runner CI disposant des
bibliothèques système de Chromium.
"""

import pathlib
import textwrap

import pymupdf

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG = ROOT / "public" / "img"
OUT = ROOT / "shots"
FONT_DIR = pathlib.Path("/tmp/fonts-ipfs")
FONTS = ROOT / "node_modules"
FONTS_CACHE = ROOT / ".fonts-cache"

# Palette
INK = (4 / 255, 19 / 255, 15 / 255)
INK2 = (7 / 255, 29 / 255, 23 / 255)
EMERALD = (15 / 255, 111 / 255, 82 / 255)
EMERALD2 = (22 / 255, 146 / 255, 108 / 255)
JADE = (47 / 255, 199 / 255, 154 / 255)
MINT = (215 / 255, 243 / 255, 231 / 255)
GOLD = (217 / 255, 178 / 255, 106 / 255)
GOLD2 = (240 / 255, 217 / 255, 167 / 255)
CREAM = (251 / 255, 248 / 255, 242 / 255)
CREAM2 = (243 / 255, 238 / 255, 228 / 255)
WHITE = (1, 1, 1)
LINE = (220 / 255, 214 / 255, 200 / 255)
MUTED = (92 / 255, 107 / 255, 100 / 255)
FAINT = (138 / 255, 148 / 255, 143 / 255)
GOLD_DARK = (138 / 255, 106 / 255, 36 / 255)
RED = (179 / 255, 38 / 255, 30 / 255)

W, H = 1440, 1000


def _ensure_fonts():
    """Convertit les woff2 Fontsource en TTF statiques (une seule fois)."""
    FONTS_CACHE.mkdir(exist_ok=True)
    sources = {
        "Sans": FONTS / "@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2",
        "Serif": FONTS / "@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2",
    }
    paths = {}
    for name, src in sources.items():
        regular = FONTS_CACHE / f"{name}.ttf"
        bold = FONTS_CACHE / f"{name}-Bold.ttf"
        if (not regular.exists() or not bold.exists()) and src.exists():
            from fontTools.ttLib import TTFont
            from fontTools.varLib.instancer import instantiateVariableFont

            font = TTFont(src)
            font.flavor = None
            instantiateVariableFont(font, {"wght": 400}).save(regular)
            instantiateVariableFont(font, {"wght": 700}).save(bold)
        paths[name] = (regular, bold)
    return paths


GLYPH_MAP = {
    "→": "›", "↗": "›", "✚": "+", "⌕": "○", "◆": "•", "▣": "▪", "▮": "|",
    "☾": "○", "▶": "›", "★": "*", "○": "o", "•": "·", "▪": "·", "✦": "+", "◉": "o",
}
GLYPHS = {}
_IMG_CACHE = {}


class Canvas:
    @staticmethod
    def measure(s, serif=False, size=12, spacing=0):
        fontname = "serif" if serif else "sans-serif"
        try:
            base = pymupdf.get_text_length(s, fontname=fontname, fontsize=size)
        except Exception:
            base = len(s) * size * (0.52 if not serif else 0.47)
        return base + spacing * max(len(s) - 1, 0)

    def __init__(self, width=W, height=H, bg=CREAM):
        self.page = pymupdf.open().new_page(width=width, height=height)
        self.w, self.h = width, height
        self.rect(0, 0, width, height, fill=bg)
        for name, (regular, bold) in _ensure_fonts().items():
            if regular.exists():
                self.page.insert_font(fontname=f"{name}Regular", fontfile=str(regular))
            if bold.exists():
                self.page.insert_font(fontname=f"{name}Bold", fontfile=str(bold))

    # ---------------------------------------------------------------- primitives
    def rect(self, x, y, w, h, fill=None, r=0, stroke=None, sw=1, opacity=1):
        shape = self.page.new_shape()
        radius = min(0.5, max(0.001, r / min(w, h))) if r else None
        shape.draw_rect(pymupdf.Rect(x, y, x + w, y + h), radius=radius)
        shape.finish(color=stroke, fill=fill, width=sw,
                     fill_opacity=opacity, stroke_opacity=opacity)
        shape.commit()

    def circle(self, cx, cy, r, fill=None, stroke=None, sw=1, opacity=1):
        shape = self.page.new_shape()
        shape.draw_circle(pymupdf.Point(cx, cy), r)
        shape.finish(color=stroke, fill=fill, width=sw, fill_opacity=opacity)
        shape.commit()

    def line(self, x1, y1, x2, y2, color=LINE, width=1):
        self.page.draw_line(pymupdf.Point(x1, y1), pymupdf.Point(x2, y2), color=color, width=width)

    def img(self, name, x, y, w, h, opacity=1.0):
        """Insère l'image en « cover » (recadrage centré, comme object-fit: cover)."""
        path = IMG / name
        if not path.exists():
            return
        doc = _IMG_CACHE.get(str(path))
        if doc is None:
            img_doc = pymupdf.open(str(path))
            pdf_bytes = img_doc.convert_to_pdf()
            doc = pymupdf.open("pdf", pdf_bytes)
            _IMG_CACHE[str(path)] = doc
        src_rect = doc[0].rect
        target = w / h
        source = src_rect.width / src_rect.height
        if source > target:  # image trop large : on rogne les côtés
            new_w = src_rect.height * target
            clip = pymupdf.Rect(src_rect.x0 + (src_rect.width - new_w) / 2, src_rect.y0,
                                src_rect.x1 - (src_rect.width - new_w) / 2, src_rect.y1)
        else:
            new_h = src_rect.width / target
            clip = pymupdf.Rect(src_rect.x0, src_rect.y0 + (src_rect.height - new_h) / 2,
                                src_rect.x1, src_rect.y1 - (src_rect.height - new_h) / 2)
        self.page.show_pdf_page(pymupdf.Rect(x, y, x + w, y + h), doc, 0, clip=clip)

    def text(self, x, y, s, size=15, color=INK, serif=False, bold=False, italic=False,
             anchor="left", spacing=0, opacity=1):
        fontname = ("Serif" if serif else "Sans") + ("Bold" if bold else "Regular")
        s = GLYPHS.get(s, s)
        for bad, good in GLYPH_MAP.items():
            s = s.replace(bad, good)
        if not s:
            return
        width = self.measure(s, serif=serif, size=size, spacing=spacing)
        if anchor == "center":
            x -= width / 2
        elif anchor == "right":
            x -= width
        if spacing > 0.45:
            cursor = x
            for ch in s:
                self.page.insert_text((cursor, y), ch, fontname=fontname, fontsize=size,
                                      color=color, fill_opacity=opacity)
                cursor += self.measure(ch, serif=serif, size=size) + spacing
        else:
            self.page.insert_text((x, y), s, fontname=fontname, fontsize=size, color=color,
                                  fill_opacity=opacity)

    def wrap(self, x, y, s, size=14, width=60, lh=None, **kw):
        lh = lh or size * 1.55
        lines = textwrap.wrap(s, width)
        for i, line in enumerate(lines):
            self.text(x, y + i * lh, line, size=size, **kw)
        return y + len(lines) * lh

    def wrap_px(self, x, y, s, size=14, max_w=300, lh=None, max_lines=None, **kw):
        """Retour à la ligne mesuré en points (plus fidèle que le nombre de caractères)."""
        lh = lh or size * 1.55
        words, lines, cur = s.split(), [], ""
        serif = bool(kw.get("serif"))
        for word in words:
            trial = f"{cur} {word}".strip()
            if self.measure(trial, serif=serif, size=size) <= max_w:
                cur = trial
            else:
                lines.append(cur)
                cur = word
        if cur:
            lines.append(cur)
        if max_lines:
            lines = lines[:max_lines]
        for i, line in enumerate(lines):
            self.text(x, y + i * lh, line, size=size, **kw)
        return y + (len(lines) - 1) * lh

    def chip(self, x, y, label, fg=INK, bg=(0, 0, 0), size=10, h=24, padx=11, stroke=None, opacity=1):
        label = label.upper() if size <= 11 and label.isupper() is False else label
        tw = self.measure(label, size=size) + 0.2 * len(label)
        w = tw + padx * 2
        self.rect(x, y, w, h, fill=bg, r=h / 2, stroke=stroke, opacity=opacity)
        self.text(x + padx, y + h / 2 + size * 0.36, label, size=size, color=fg, spacing=0.2)
        return w

    def btn(self, x, y, label, w=None, h=48, bg=EMERALD, fg=WHITE, size=13.5, stroke=None, opacity=1):
        tw = self.measure(label, size=size) + 0.4 * len(label)
        w = w or tw + 44
        self.rect(x, y, w, h, fill=bg, r=h / 2, stroke=stroke, opacity=opacity)
        self.text(x + w / 2, y + h / 2 + size * 0.36, label, size=size, color=fg, anchor="center")
        return w

    def eyebrow(self, x, y, label, color=EMERALD):
        self.rect(x, y - 6, 26, 1.4, fill=color, opacity=0.6)
        self.text(x + 36, y, label.upper(), size=9.5, color=color, spacing=1.1)

    def star(self, x, y, size=11, color=GOLD):
        self.page.insert_text((x, y), "★", fontname="helv", fontsize=size, color=color)

    def logo(self, x, y, dark=False):
        fg = WHITE if dark else INK
        sub = (1, 1, 1) if dark else FAINT
        self.rect(x, y, 42, 42, fill=EMERALD, r=12)
        self.circle(x + 33, y + 9, 13, fill=(26 / 255, 130 / 255, 100 / 255), opacity=0.9)
        self.text(x + 21, y + 27, "BK", size=14, color=GOLD2, serif=True, anchor="center")
        self.text(x + 54, y + 19, "Bernard Kouchner", size=15, color=fg, serif=True)
        self.text(x + 54, y + 34, "IPFS-BK · HIPPODROME 1", size=7.5, color=sub, spacing=1.3)

    def header(self, active="Accueil"):
        self.rect(0, 0, self.w, 74, fill=CREAM, opacity=0.96)
        self.line(0, 74, self.w, 74, color=LINE, width=1.1)
        self.logo(72, 16)
        items = ["Accueil", "Formations", "Blog", "App mobile", "À propos", "Admission", "Contact"]
        x = 566
        for it in items:
            color = EMERALD if it == active else MUTED
            self.text(x, 43, it, size=12.5, color=color)
            if it == active:
                self.rect(x, 52, self.measure(it, size=12.5), 2, fill=EMERALD, r=1)
            x += self.measure(it, size=12.5) + 26
        self.btn(1218, 16, "Se connecter", h=40, size=11.5)

    def footer(self, y):
        self.rect(0, y, self.w, self.h - y, fill=INK)
        self.logo(72, y + 34, dark=True)
        self.wrap_px(72, y + 100,
                     "Institut Privé de Formation Sanitaire Bernard Kouchner — une école de santé malienne "
                     "tournée vers l'excellence, la rigueur et l'engagement.",
                     11.5, 300, color=(0.62, 0.68, 0.65), lh=17)
        cols = [
            ("INSTITUTION", ["À propos de l'institut", "Notre équipe", "Toutes les formations", "Actualités & blog", "Application mobile"], 500),
            ("CANDIDATS", ["Admission en ligne", "Bourses & facilités", "Questions fréquentes", "Nous contacter", "Espace membre"], 730),
            ("CONTACT", ["Hippodrome 1, Bamako", "+223 76 74 74 07", "+223 83 01 02 02", "WhatsApp +223 63 64 30 30", "contact@institut-bernard-kouchner.com"], 960),
        ]
        for title, links, x in cols:
            self.text(x, y + 38, title, size=8.5, color=GOLD2, spacing=1.5)
            for i, l in enumerate(links):
                self.text(x, y + 62 + i * 21, l, size=10.5, color=(0.62, 0.68, 0.65))
        self.line(72, self.h - 44, self.w - 72, self.h - 44, color=(0.18, 0.24, 0.21))
        self.text(72, self.h - 24, "© 2026 Institut Bernard Kouchner. Tous droits réservés.", size=9, color=(0.5, 0.56, 0.53))
        self.text(self.w - 72, self.h - 24, "BNDA 490001201401 · Arrêté n°2026-0401/MESRS-SG", size=9,
                  color=(0.5, 0.56, 0.53), anchor="right")

    def soft(self, x, y, w, h, color=WHITE, opacity=0.2, feather=22):
        """Voile translucide à bords fondus (dégradé alpha) — pas de bandes visibles."""
        import numpy as np

        size = 64
        rgb = [int(v * 255) for v in color]
        alpha = np.full((size, size), int(opacity * 255), dtype=np.uint8)
        edge = np.linspace(0, int(opacity * 255), feather).astype(np.uint8)
        alpha[:feather, :] = np.minimum(alpha[:feather, :], edge[:, None])
        alpha[-feather:, :] = np.minimum(alpha[-feather:, :], edge[::-1][:, None])
        alpha[:, :feather] = np.minimum(alpha[:, :feather], edge[None, :])
        alpha[:, -feather:] = np.minimum(alpha[:, -feather:], edge[::-1][None, :])

        base = pymupdf.Pixmap(pymupdf.csRGB, pymupdf.IRect(0, 0, size, size), False)
        base.set_rect(base.irect, tuple(rgb))
        mask = pymupdf.Pixmap(pymupdf.csGRAY, pymupdf.IRect(0, 0, size, size), False)
        mask.set_rect(mask.irect, (255,))
        for row in range(size):
            for col in range(size):
                mask.set_pixel(row, col, (int(alpha[row, col]),))
        self.page.insert_image(pymupdf.Rect(x, y, x + w, y + h), pixmap=pymupdf.Pixmap(base, mask))

    def save(self, name):
        pix = self.page.get_pixmap(dpi=110)
        target = OUT / f"{name}.png"
        pix.save(target)
        print("✓", target.name, f"{pix.width}×{pix.height}")


# --------------------------------------------------------------------------- pages

def page_home():
    c = Canvas()
    c.img("hero.jpg", 0, 0, W, 620)
    c.rect(0, 0, W, 620, fill=INK, opacity=0.34)
    c.soft(0, 210, W, 300, opacity=0.30, feather=30)
    c.soft(-40, 300, W + 80, 250, opacity=0.22, feather=30)
    c.circle(1260, -140, 420, fill=(15 / 255, 111 / 255, 82 / 255), opacity=0.22)
    c.header()

    for cxp, cxl in ((72, "Hippodrome 1 · Bamako"), (262, "Arrêté n°2026-0401/MESRS-SG"),
                     (520, "4,6/5 · 39 avis Google")):
        c.chip(cxp, 126, cxl, fg=WHITE, bg=WHITE, size=9.5, h=26, padx=12,
               stroke=(0.92, 0.96, 0.94), opacity=0.16)

    c.text(72, 250, "La santé commence par", size=64, color=WHITE, serif=True)
    c.text(72, 318, "une", size=64, color=WHITE, serif=True)
    c.text(190, 318, "formation sérieuse", size=64, color=GOLD2, serif=True)
    c.text(716, 318, ".", size=64, color=GOLD2, serif=True)
    c.wrap_px(72, 372,
              "Nous formons des apprenants compétents, responsables et prêts à relever les défis du terrain. "
              "Intégrez un institut qui place la qualité, la rigueur et l'engagement au cœur de son action.",
              15, 660, color=(0.82, 0.86, 0.84), lh=24)
    c.btn(72, 452, "S'inscrire en ligne  →", h=52, bg=GOLD, fg=INK, size=14)
    c.btn(320, 452, "Explorer les 14 formations", h=52, bg=WHITE, fg=WHITE, size=14,
          stroke=(0.95, 0.98, 0.97), opacity=0.12)
    c.rect(624, 456, 196, 44, fill=WHITE, r=22, stroke=(0.95, 0.98, 0.97), opacity=0.12)
    c.text(722, 483, "+223 83 01 02 02", size=13, color=WHITE, anchor="center")

    c.rect(72, 528, 1296, 84, fill=(4 / 255, 19 / 255, 15 / 255), r=20, stroke=(0.42, 0.47, 0.45), opacity=0.72)
    stats = [("4e", "Promotion diplômée"), ("14", "Formations"), ("95,65%", "Réussite BT-Santé 2026"), ("4,6/5", "Note Google")]
    for i, (v, l) in enumerate(stats):
        x = 104 + i * 324
        c.text(x, 570, v, size=28, color=WHITE, serif=True)
        c.text(x, 590, l, size=11.5, color=(0.72, 0.78, 0.75))
        if i:
            c.line(x - 32, 542, x - 32, 598, color=(0.28, 0.34, 0.31))

    c.rect(0, 620, W, 44, fill=INK2)
    tick = ["RENTRÉE 2026 — 2027 OUVERTE", "LICENCE KINÉSITHÉRAPIE · 23 NOVEMBRE 2026",
            "BT-SANTÉ 2026 · 95,65 % DE RÉUSSITE", "PAIEMENT BNDA 490001201401"]
    x = 72
    for t in tick:
        c.text(x, 648, t, size=9, color=(0.66, 0.72, 0.69), spacing=1.4)
        x += c.measure(t, size=9) + 1.4 * len(t) + 34
        c.text(x - 22, 648, "◆", size=6.5, color=GOLD)

    c.eyebrow(72, 726, "Notre engagement")
    c.text(72, 776, "Une école de santé ancrée dans les réalités", size=36, color=INK, serif=True)
    c.text(72, 814, "du Mali", size=36, color=EMERALD, serif=True)
    c.wrap_px(792, 748,
              "Des parcours conçus pour développer des compétences utiles, une pratique responsable et une "
              "meilleure capacité d'action au service des patients et des communautés.",
              13.5, 470, color=MUTED, lh=21)
    c.text(1296, 812, "Découvrir l'institut ↗", size=12, color=EMERALD, anchor="right")

    levels = [("DEF", "Parcours accessibles", "Après le Diplôme d'études fondamentales."),
              ("BAC", "Licences & supérieur", "Des formations orientées métiers de la santé."),
              ("MASTER", "Spécialisations", "Pour approfondir et faire évoluer sa carrière."),
              ("CONTINU", "Renforcement", "Capacités des professionnels et organisations.")]
    for i, (tag, t, d) in enumerate(levels):
        x = 72 + i * 330
        c.rect(x, 852, 306, 120, fill=WHITE, r=18, stroke=LINE)
        c.rect(x + 18, 870, 40, 40, fill=MINT, r=12)
        c.text(x + 38, 896, "+", size=15, color=EMERALD, anchor="center")
        c.text(x + 18, 936, tag, size=8.5, color=GOLD_DARK, spacing=1.5)
        c.text(x + 78, 892, t, size=14, color=INK, serif=True)
        c.wrap_px(x + 78, 910, d, 10.5, 200, color=MUTED, lh=14)
    return c


def page_formations():
    c = Canvas()
    c.rect(0, 0, W, 286, fill=INK)
    c.circle(1230, 10, 380, fill=(15 / 255, 111 / 255, 82 / 255), opacity=0.4)
    c.header("Formations")
    c.text(72, 128, "Accueil  /  Formations", size=11, color=(0.6, 0.66, 0.63))
    c.eyebrow(72, 168, "14 programmes · DEF · BAC · Formation continue", color=GOLD2)
    c.text(72, 218, "Des formations pensées pour construire", size=40, color=WHITE, serif=True)
    c.text(72, 264, "un vrai avenir professionnel", size=40, color=GOLD2, serif=True)

    c.rect(72, 306, 1296, 96, fill=WHITE, r=18, stroke=LINE)
    c.rect(94, 324, 400, 36, fill=WHITE, r=18, stroke=(0.78, 0.76, 0.7))
    c.text(116, 347, "⌕  Rechercher une formation, une filière…", size=11.5, color=FAINT)
    x = 520
    for i, cat in enumerate(["Toutes", "Santé", "Soins infirmiers", "Santé et Nutrition", "Pharmacie"]):
        w = c.chip(x, 324, cat, fg=CREAM if i == 0 else MUTED,
                   bg=INK if i == 0 else (0.94, 0.92, 0.88), size=9.5, h=27)
        x += w + 7
    c.text(94, 388, "NIVEAU", size=8.5, color=FAINT, spacing=1.5)
    x = 168
    for i, cat in enumerate(["Tous", "DEF", "BAC", "Formation continue", "Tous niveaux"]):
        w = c.chip(x, 372, cat, fg=CREAM if i == 0 else MUTED, bg=INK if i == 0 else (0.94, 0.92, 0.88),
                   size=9.5, h=27)
        x += w + 7
    c.text(742, 388, "MODE", size=8.5, color=FAINT, spacing=1.5)
    x = 790
    for cat in ["Tous", "En présentiel", "En ligne", "Hybride"]:
        w = c.chip(x, 372, cat, fg=MUTED, bg=(0.94, 0.92, 0.88), size=9.5, h=27)
        x += w + 7
    c.text(72, 448, "14 formations trouvées", size=12, color=MUTED)
    c.chip(1198, 432, "Rentrée 2026 — 2027 ouverte", fg=GOLD_DARK, bg=(0.97, 0.93, 0.85), size=9.5, h=26)

    cards = [
        ("formations/kine.jpg", "Kinésithérapie", "Santé · BAC", "450 000 FCFA",
         "Étudiez la prévention, la rééducation fonctionnelle et l'accompagnement de la mobilité des patients.", True),
        ("formations/infirmier.jpg", "Infirmier en santé publique", "Soins infirmiers · DEF", "290 000 FCFA",
         "Formez-vous aux soins, à la prévention et aux actions de santé menées au bénéfice des communautés.", False),
        ("care.jpg", "Santé maternelle et infantile", "Santé · DEF", "290 000 FCFA",
         "Développez les compétences nécessaires à l'accompagnement de la mère, du nouveau-né et de l'enfant.", True),
        ("lab.jpg", "Technicien de laboratoire", "Santé · DEF", "290 000 FCFA",
         "Préparez-vous aux activités techniques de laboratoire, de pharmacie et de contrôle sanitaire.", True),
        ("hero.jpg", "Aide-soignant", "Santé · DEF", "100 000 FCFA",
         "Acquérez les compétences essentielles pour accompagner les patients et assister l'équipe soignante.", True),
        ("campus.jpg", "Nutrition Diététique", "Santé et Nutrition · BAC", "450 000 FCFA",
         "Licence professionnelle pour la prise en charge nutritionnelle et la prévention des maladies.", True),
    ]
    for i, (img, title, meta, price, desc, pop) in enumerate(cards):
        col, row = i % 3, i // 3
        x, y = 72 + col * 330, 466 + row * 268
        c.rect(x, y, 306, 252, fill=WHITE, r=18, stroke=LINE)
        c.img(img, x + 1, y + 1, 304, 118)
        c.rect(x + 1, y + 84, 304, 35, fill=INK, opacity=0.42)
        if pop:
            c.chip(x + 12, y + 12, "Populaire", fg=INK, bg=GOLD, size=8.5, h=21, padx=9)
        c.chip(x + (84 if pop else 12), y + 12, meta.split("·")[1].strip(), fg=INK, bg=WHITE,
               size=8.5, h=21, padx=9)
        c.rect(x + 208, y + 88, 84, 22, fill=INK, r=11, opacity=0.75)
        c.text(x + 250, y + 103, price, size=8.5, color=WHITE, anchor="center")
        c.text(x + 20, y + 146, meta.split("·")[0].strip().upper(), size=8.5, color=EMERALD, spacing=1.3)
        c.wrap_px(x + 20, y + 168, title, 15, 264, serif=True, lh=18)
        c.wrap_px(x + 20, y + 204, desc, 10, 250, color=MUTED, lh=14, max_lines=2)
        c.line(x + 20, y + 228, x + 286, y + 228, color=(0.93, 0.91, 0.87))
        c.text(x + 20, y + 240, "Découvrir  ↗", size=10, color=EMERALD)
    return c


def page_application():
    c = Canvas(bg=INK)
    c.circle(1240, 40, 480, fill=(15 / 255, 111 / 255, 82 / 255), opacity=0.35)
    c.rect(0, 0, W, 74, fill=INK, opacity=0.85)
    c.header("App mobile")
    c.rect(0, 0, W, 74, fill=INK, opacity=0.8)
    c.logo(72, 16, dark=True)
    items = ["Accueil", "Formations", "Blog", "App mobile", "À propos", "Admission", "Contact"]
    x = 566
    for it in items:
        c.text(x, 43, it, size=12.5, color=GOLD2 if it == "App mobile" else (0.66, 0.72, 0.69))
        x += c.measure(it, size=12.5) + 26
    c.btn(1218, 16, "Se connecter", h=40, size=11.5, bg=EMERALD)

    c.text(72, 132, "Accueil  /  Application mobile", size=11, color=(0.55, 0.62, 0.59))
    c.eyebrow(72, 174, "L'application IPFS-BK · iOS & Android", color=GOLD2)
    c.text(72, 236, "Votre institut, dans", size=48, color=WHITE, serif=True)
    c.text(72, 292, "votre poche", size=48, color=GOLD2, serif=True)
    c.text(72 + c.measure("votre poche", serif=True, size=48) + 3, 292, ".", size=48, color=WHITE, serif=True)
    c.wrap_px(72, 342,
              "Emploi du temps, notes, bulletins, scolarité, paiements BNDA et messagerie : une expérience "
              "rapide, lisible et sécurisée, pensée pour les connexions mobiles du Mali.",
              13.5, 540, color=(0.78, 0.83, 0.8), lh=21)
    for cxp, cxl in ((72, "Mode économie de données"), (288, "Connexion sécurisée"), (466, "Interface en français")):
        c.chip(cxp, 430, cxl, fg=WHITE, bg=(1, 1, 1), size=9, h=25, padx=11,
               stroke=(0.7, 0.75, 0.73), opacity=0.14)
    for i, (top, bottom) in enumerate([("TÉLÉCHARGER SUR", "App Store"), ("DISPONIBLE SUR", "Google Play")]):
        x = 72 + i * 200
        c.rect(x, 484, 188, 62, fill=(1, 1, 1), r=16, stroke=(0.34, 0.4, 0.38), opacity=0.08)
        c.text(x + 20, 510, top, size=7.5, color=(0.6, 0.66, 0.63), spacing=1.1)
        c.text(x + 20, 532, bottom, size=15, color=WHITE, serif=True)

    def phone(x, y, w=250, h=460):
        c.rect(x, y, w, h, fill=(10 / 255, 19 / 255, 16 / 255), r=38, stroke=(0.34, 0.4, 0.38))
        c.rect(x + 10, y + 10, w - 20, h - 20, fill=(0.97, 0.985, 0.98), r=30)
        c.rect(x + w / 2 - 38, y + 16, 76, 17, fill=(10 / 255, 19 / 255, 16 / 255), r=9)
        c.text(x + 24, y + 50, "09:41", size=9, color=(0.25, 0.32, 0.29))
        c.text(x + w - 26, y + 50, "5G ▮", size=9, color=(0.25, 0.32, 0.29), anchor="right")
        c.rect(x + 22, y + 62, 30, 30, fill=EMERALD, r=9)
        c.text(x + 37, y + 82, "BK", size=8.5, color=GOLD2, anchor="center")
        c.text(x + 60, y + 74, "Bonjour, Awa", size=11, color=INK)
        c.text(x + 60, y + 87, "Licence Kinésithérapie · L1", size=7.5, color=FAINT)
        c.rect(x + 22, y + 100, w - 44, 104, fill=EMERALD, r=15)
        c.circle(x + w - 34, y + 96, 34, fill=GOLD, opacity=0.18)
        c.text(x + 36, y + 124, "Aujourd'hui · 23 novembre", size=7.5, color=(0.85, 0.89, 0.87))
        c.text(x + 36, y + 146, "Rééducation fonctionnelle", size=11.5, color=WHITE, serif=True)
        c.text(x + 36, y + 164, "08:00 — Amphi B", size=10, color=WHITE)
        c.chip(x + 36, y + 174, "Salle B204", fg=WHITE, bg=(1, 1, 1), size=6.5, h=17, padx=7,
               stroke=(0.8, 0.86, 0.84), opacity=0.2)
        c.text(x + 92, y + 186, "Pr. Traoré", size=6.5, color=WHITE)
        half = (w - 56) / 2
        c.rect(x + 22, y + 214, half, 54, fill=WHITE, r=12, stroke=(0.9, 0.92, 0.91))
        c.text(x + 34, y + 234, "MOYENNE S1", size=6.5, color=FAINT, spacing=0.5)
        c.text(x + 34, y + 256, "15,4/20", size=14, color=INK, serif=True)
        c.rect(x + 32 + half, y + 214, half, 54, fill=WHITE, r=12, stroke=(0.9, 0.92, 0.91))
        c.text(x + 44 + half, y + 234, "SCOLARITÉ", size=6.5, color=FAINT, spacing=0.5)
        c.text(x + 44 + half, y + 256, "68 %", size=14, color=INK, serif=True)
        c.rect(x + 44 + half, y + 260, half - 24, 5, fill=(0.9, 0.92, 0.91), r=3)
        c.rect(x + 44 + half, y + 260, (half - 24) * 0.68, 5, fill=EMERALD, r=3)
        for k, (t, sub) in enumerate([("Anatomie appliquée", "Demain · 10:00 · Amphi A"),
                                      ("Scolarité", "Votre reçu BNDA est disponible")]):
            yy = y + 278 + k * 50
            c.rect(x + 22, yy, w - 44, 42, fill=WHITE, r=12, stroke=(0.9, 0.92, 0.91))
            c.rect(x + 34, yy + 11, 21, 21, fill=MINT, r=7)
            c.text(x + 44, yy + 26, "+", size=9, color=EMERALD, anchor="center")
            c.text(x + 62, yy + 19, t, size=8.5, color=INK)
            c.text(x + 62, yy + 31, sub, size=7, color=FAINT)
        c.rect(x + 10, y + h - 46, w - 20, 36, fill=WHITE)
        for j in range(4):
            c.circle(x + 46 + j * ((w - 72) / 3), y + h - 28, 4.5,
                     fill=EMERALD if j == 0 else (0.78, 0.83, 0.81))

    phone(806, 132)
    phone(1088, 196, w=226, h=414)

    feats = [("Emploi du temps", "La semaine en un coup d'œil, avec rappels."),
             ("Notes & bulletins", "Évaluations et bulletins téléchargeables."),
             ("Scolarité & paiements", "Échéances, reçus et versements BNDA."),
             ("Messagerie", "Échanges directs avec la scolarité.")]
    for i, (t, d) in enumerate(feats):
        x = 72 + i * 330
        c.rect(x, 596, 306, 92, fill=(1, 1, 1), r=16, stroke=(0.24, 0.3, 0.28), opacity=0.055)
        c.rect(x + 16, 612, 32, 32, fill=JADE, r=10, opacity=0.18)
        c.text(x + 32, 634, "✦", size=11, color=JADE, anchor="center")
        c.text(x + 60, 630, t, size=13, color=WHITE, serif=True)
        c.wrap_px(x + 60, 650, d, 10, 228, color=(0.66, 0.72, 0.69), lh=14)

    c.rect(72, 716, 1296, 212, fill=WHITE, r=22)
    c.eyebrow(104, 760, "Espace personnel")
    c.text(104, 804, "Vous êtes membre du personnel ? Connectez-vous", size=24, color=INK, serif=True)
    c.text(104, 836, "pour accéder à la version PC.", size=24, color=EMERALD, serif=True)
    c.wrap_px(104, 866,
              "Dès qu'un membre du personnel se connecte, le site bascule automatiquement sur l'interface "
              "de bureau : tableau de bord, élèves, classes, notes, scolarité et messagerie.",
              11.5, 700, color=MUTED, lh=18)
    c.btn(104, 886, "Accéder à la version PC  →", h=40, size=11.5)
    c.rect(1096, 750, 156, 156, fill=WHITE, r=14, stroke=LINE)
    for row in range(7):
        for col in range(7):
            if (row * 7 + col) % 3 != 0:
                c.rect(1112 + col * 18, 766 + row * 18, 13, 13, fill=INK, r=2)
    return c


def page_staff():
    c = Canvas(bg=(0.945, 0.957, 0.953))
    c.rect(0, 0, 262, H, fill=INK)
    c.logo(18, 18, dark=True)
    c.rect(18, 82, 168, 24, fill=(1, 1, 1), r=12, opacity=0.09)
    c.circle(32, 94, 3.5, fill=JADE)
    c.text(42, 98, "VERSION PC · SESSION ACTIVE", size=7.5, color=(0.75, 0.8, 0.78), spacing=0.7)
    nav = [("PILOTAGE", ["Tableau de bord", "Élèves", "Classes & filières", "Notes & bulletins"]),
           ("ADMINISTRATION", ["Scolarité", "Absences", "Emploi du temps", "Admissions"]),
           ("COMMUNICATION", ["Messagerie", "Documents", "Paramètres"])]
    y = 126
    for grp, items in nav:
        c.text(30, y, grp, size=7.5, color=(0.4, 0.46, 0.44), spacing=1.4)
        y += 16
        for it in items:
            active = it == "Tableau de bord"
            if active:
                c.rect(14, y, 234, 34, fill=EMERALD, r=10, opacity=0.92)
            c.text(30, y + 22, "▣", size=10, color=WHITE if active else (0.5, 0.56, 0.53))
            c.text(50, y + 22, it, size=11.5, color=WHITE if active else (0.72, 0.77, 0.75))
            y += 37
        y += 9
    c.line(14, H - 74, 248, H - 74, color=(0.2, 0.26, 0.24))
    c.circle(32, H - 44, 18, fill=EMERALD2)
    c.text(32, H - 40, "BS", size=10, color=GOLD2, anchor="center")
    c.text(60, H - 48, "Bakary Samake", size=10.5, color=WHITE)
    c.text(60, H - 34, "Direction des Études", size=8.5, color=(0.55, 0.6, 0.58))

    c.rect(262, 0, W - 262, 62, fill=WHITE, opacity=0.94)
    c.line(262, 61, W, 61, color=LINE)
    c.text(288, 30, "Tableau de bord", size=16, color=INK, serif=True)
    c.text(288, 47, "Année académique 2026 — 2027 · Semestre 1", size=9.5, color=FAINT)
    c.rect(1016, 16, 236, 32, fill=WHITE, r=16, stroke=(0.8, 0.78, 0.72))
    c.text(1034, 36, "⌕  Rechercher un élève…", size=10, color=FAINT)
    c.rect(1266, 14, 34, 34, fill=WHITE, r=10, stroke=LINE)
    c.circle(1283, 31, 6, fill=MUTED, opacity=0.35)
    c.btn(1312, 16, "Voir le site", h=32, bg=WHITE, fg=INK, size=10, stroke=(0.8, 0.78, 0.72))

    kpis = [("ÉLÈVES INSCRITS", "248", "+12 cette rentrée"), ("TAUX DE PRÉSENCE", "93,4 %", "+2,1 pts vs S2 2025"),
            ("SCOLARITÉ ENCAISSÉE", "38,4 M", "FCFA · 78 % de l'objectif"), ("DOSSIERS EN ATTENTE", "12", "3 à relancer")]
    for i, (l, v, d) in enumerate(kpis):
        x = 288 + i * 284
        c.rect(x, 82, 266, 92, fill=WHITE, r=15, stroke=LINE)
        c.text(x + 16, 104, l, size=7.5, color=FAINT, spacing=1.1)
        c.text(x + 16, 140, v, size=25, color=INK, serif=True)
        c.text(x + 16, 160, d, size=9.5, color=EMERALD)

    c.rect(288, 190, 826, 236, fill=WHITE, r=16, stroke=LINE)
    c.text(310, 218, "Répartition par filière", size=12.5, color=INK)
    c.chip(966, 202, "6 filières actives", fg=MUTED, bg=(0.94, 0.92, 0.88), size=8.5, h=22, padx=9)
    bars = [("Kiné", 42), ("Infirmier", 68), ("Sage-femme", 51), ("Biologie", 34), ("Nutrition", 27), ("Délégué", 26)]
    for i, (n, v) in enumerate(bars):
        x = 320 + i * 128
        hgt = v * 2.1
        c.rect(x, 396 - hgt, 60, hgt, fill=EMERALD, r=7, opacity=0.9)
        c.rect(x, 396 - hgt, 60, 10, fill=JADE, r=5, opacity=0.7)
        c.text(x + 30, 388 - hgt, str(v), size=10, color=MUTED, anchor="center")
        c.text(x + 30, 410, n, size=9, color=FAINT, anchor="center")

    c.rect(1130, 190, 262, 236, fill=WHITE, r=16, stroke=LINE)
    c.text(1148, 218, "Activité récente", size=12.5, color=INK)
    c.chip(1322, 202, "En direct", fg=EMERALD, bg=MINT, size=8.5, h=22, padx=9)
    acts = [("Nouvelle inscription validée", "Awa Traoré · Kinésithérapie"),
            ("Paiement BNDA reçu", "150 000 FCFA · Mamadou D."),
            ("Absence signalée", "Rokia Sangaré · non justifiée"),
            ("Notes publiées", "Biologie médicale · S1")]
    for i, (t, d) in enumerate(acts):
        y = 248 + i * 44
        c.circle(1162, y - 2, 11, fill=MINT)
        c.text(1162, y + 2, "✓", size=9, color=EMERALD, anchor="center")
        c.text(1182, y - 1, t, size=10, color=INK)
        c.text(1182, y + 12, d, size=8.5, color=FAINT)

    c.rect(288, 444, 1104, 316, fill=WHITE, r=16, stroke=LINE)
    c.text(310, 472, "Derniers élèves inscrits", size=12.5, color=INK)
    c.btn(1186, 456, "Exporter", h=30, bg=WHITE, fg=INK, size=9.5, stroke=(0.8, 0.78, 0.72))
    c.btn(1272, 456, "+ Nouvel élève", h=30, bg=EMERALD, size=9.5)
    cols = [("ÉLÈVE", 310), ("MATRICULE", 566), ("FILIÈRE", 716), ("NIVEAU", 936), ("MOYENNE", 1022), ("STATUT", 1174)]
    for l, x in cols:
        c.text(x, 512, l, size=7.5, color=FAINT, spacing=1.1)
    c.line(310, 520, 1372, 520, color=LINE)
    rows = [("Awa Traoré", "BK-2026-0141", "Kinésithérapie", "L1", "15,4", "À jour"),
            ("Mamadou Diarra", "BK-2026-0102", "Infirmier d'État", "L2", "14,1", "À jour"),
            ("Fatoumata Coulibaly", "BK-2026-0088", "Sage-femme d'État", "L1", "13,6", "En retard"),
            ("Ibrahim Keïta", "BK-2026-0075", "Biologie Médicale", "L2", "16,2", "À jour"),
            ("Aminata Sissoko", "BK-2026-0064", "Nutrition Diététique", "L3", "15,9", "Bourse")]
    for i, r in enumerate(rows):
        y = 552 + i * 44
        c.circle(324, y - 4, 14, fill=EMERALD2)
        c.text(324, y, r[0][0] + r[0].split(" ")[1][0], size=8, color=GOLD2, anchor="center")
        c.text(346, y, r[0], size=10.5, color=INK)
        c.text(566, y, r[1], size=10, color=FAINT)
        c.text(716, y, r[2], size=10, color=INK)
        c.text(936, y, r[3], size=10, color=INK)
        c.text(1022, y, r[4] + " / 20", size=10, color=INK)
        bg, fg = (MINT, EMERALD) if r[5] == "À jour" else ((0.97, 0.93, 0.85), GOLD_DARK) if r[5] == "Bourse" else ((0.96, 0.9, 0.89), RED)
        c.chip(1174, y - 13, r[5], fg=fg, bg=bg, size=8.5, h=22, padx=9)
        c.line(310, y + 20, 1372, y + 20, color=(0.95, 0.94, 0.92))

    c.rect(288, 776, 540, 190, fill=WHITE, r=16, stroke=LINE)
    c.text(310, 804, "Scolarité — encaissements par mois", size=11.5, color=INK)
    c.chip(738, 790, "+14 %", fg=EMERALD, bg=MINT, size=8.5, h=22, padx=9)
    months = ["Sep", "Oct", "Nov", "Déc", "Jan", "Fév", "Mar", "Avr", "Mai"]
    vals = [32, 46, 58, 41, 63, 78, 54, 88, 72]
    for i, v in enumerate(vals):
        x = 322 + i * 56
        c.rect(x, 936 - v * 1.1, 32, v * 1.1, fill=EMERALD, r=6, opacity=0.88)
        c.text(x + 16, 952, months[i], size=8, color=FAINT, anchor="center")

    c.rect(844, 776, 548, 190, fill=WHITE, r=16, stroke=LINE)
    c.text(866, 804, "Prochains événements", size=11.5, color=INK)
    evs = [("23 nov.", "Rentrée licence kinésithérapie", "Amphi principal"),
           ("28 nov.", "Conseil pédagogique", "Salle de réunion"),
           ("05 déc.", "Début des stages S1", "CHU Gabriel Touré")]
    for i, (d, t, l) in enumerate(evs):
        y = 838 + i * 44
        c.rect(866, y - 4, 56, 30, fill=MINT, r=9)
        c.text(894, y + 15, d, size=9, color=EMERALD, anchor="center")
        c.text(934, y + 6, t, size=10.5, color=INK)
        c.text(934, y + 20, l, size=8.5, color=FAINT)
    return c


def page_login():
    c = Canvas()
    c.img("hero.jpg", 0, 0, 700, H)
    c.rect(0, 0, 700, H, fill=INK, opacity=0.78)
    c.circle(330, 210, 300, fill=(15 / 255, 111 / 255, 82 / 255), opacity=0.14)
    c.chip(64, 88, "Espace sécurisé IPFS-BK", fg=WHITE, bg=(1, 1, 1), size=9, h=26, padx=12,
           stroke=(0.72, 0.78, 0.76), opacity=0.14)
    c.text(64, 452, "Le personnel accède", size=40, color=WHITE, serif=True)
    c.text(64, 502, "directement à la", size=40, color=WHITE, serif=True)
    c.text(64, 552, "version PC", size=40, color=GOLD2, serif=True)
    c.text(64 + c.measure("version PC", serif=True, size=40) + 3, 552, ".", size=40, color=WHITE, serif=True)
    c.wrap_px(64, 602,
              "Étudiants, parents et personnel disposent chacun de leur espace. Dès qu'un membre du personnel "
              "se connecte, le site bascule sur l'interface de bureau complète.",
              13, 440, color=(0.8, 0.85, 0.83), lh=21)
    for i, (k, v) in enumerate([("4", "profils"), ("1", "plateforme"), ("24/7", "accès")]):
        c.text(64 + i * 110, 748, k, size=20, color=WHITE, serif=True)
        c.text(64 + i * 110, 766, v, size=10, color=(0.55, 0.62, 0.59))

    c.text(820, 124, "← Retour au site", size=11.5, color=MUTED)
    c.logo(820, 172)
    c.text(820, 292, "Connexion à votre espace", size=32, color=INK, serif=True)
    c.wrap_px(820, 324, "Sélectionnez votre profil, puis identifiez-vous avec les accès remis par la scolarité.",
              12.5, 470, color=MUTED, lh=19)
    profiles = [("Personnel", "Direction, scolarité, formateurs", True), ("Étudiant", "Notes, cours, scolarité", False),
                ("Parent", "Suivi de mon enfant", False)]
    for i, (t, d, on) in enumerate(profiles):
        y = 372 + i * 62
        c.rect(820, y, 480, 54, fill=MINT if on else WHITE, r=15, stroke=EMERALD if on else LINE)
        c.circle(848, y + 27, 9, stroke=EMERALD if on else (0.78, 0.76, 0.7))
        if on:
            c.circle(848, y + 27, 4.5, fill=EMERALD)
        c.rect(872, y + 12, 30, 30, fill=MINT if on else CREAM2, r=9)
        c.rect(880, y + 20, 14, 4, fill=EMERALD if on else FAINT, r=2)
        c.rect(880, y + 27, 9, 4, fill=EMERALD if on else FAINT, r=2)
        c.text(914, y + 25, t, size=12.5, color=INK)
        c.text(914, y + 41, d, size=9.5, color=FAINT)
        if on:
            c.chip(1178, y + 16, "Version PC", fg=EMERALD, bg=MINT, size=8.5, h=22, padx=9)

    c.text(820, 580, "Adresse e-mail", size=10.5, color=(0.3, 0.37, 0.34))
    c.rect(820, 590, 480, 46, fill=WHITE, r=11, stroke=(0.78, 0.76, 0.7))
    c.text(842, 619, "direction@ipfs-bk.ml", size=12, color=INK)
    c.text(820, 664, "Mot de passe", size=10.5, color=(0.3, 0.37, 0.34))
    c.rect(820, 674, 480, 46, fill=WHITE, r=11, stroke=(0.78, 0.76, 0.7))
    c.text(842, 703, "••••••••••••", size=13, color=INK)
    c.btn(820, 740, "Accéder à la version PC  →", w=480, h=48, size=13)
    c.rect(820, 806, 480, 74, fill=(0.98, 0.95, 0.9), r=13, stroke=(0.88, 0.78, 0.6))
    c.text(838, 828, "Accès de démonstration — personnel", size=10.5, color=GOLD_DARK)
    c.text(838, 848, "direction@ipfs-bk.ml  ·  direction2026", size=9.5, color=GOLD_DARK)
    c.text(838, 866, "staff@ipfs-bk.ml  ·  staff2026", size=9.5, color=GOLD_DARK)
    return c


def page_blog():
    c = Canvas()
    c.header("Blog")
    c.text(72, 122, "Accueil  /  Blog", size=11, color=FAINT)
    c.eyebrow(72, 162, "Actualités · 11 articles")
    c.text(72, 212, "Le journal de l'Institut", size=42, color=INK, serif=True)
    c.text(72, 258, "Bernard Kouchner", size=42, color=EMERALD, serif=True)
    c.wrap_px(72, 296,
              "Formations, vie académique, vie étudiante, communiqués et métiers de la santé : toute la vie "
              "de l'IPFS-BK, mise à jour par la Direction des études.", 13.5, 640, color=MUTED, lh=20)

    c.img("graduation.jpg", 72, 348, 1296, 200)
    c.rect(72, 348, 1296, 200, fill=INK, opacity=0.66, r=22)
    c.chip(104, 374, "Vidéo à la une", fg=WHITE, bg=(1, 1, 1), size=9, h=26, padx=11,
           stroke=(0.75, 0.8, 0.78), opacity=0.16)
    c.text(104, 444, "Cérémonie de remise des diplômes", size=28, color=WHITE, serif=True)
    c.text(104, 480, "4ème Promotion « Feu Général Sadio Camara » — IPFSBK", size=20, color=GOLD2, serif=True)
    c.chip(104, 500, "Remise de diplôme", fg=WHITE, bg=(1, 1, 1), size=9, h=26, padx=11,
           stroke=(0.75, 0.8, 0.78), opacity=0.16)
    c.chip(266, 500, "9 mai 2026 · Bamako", fg=WHITE, bg=(1, 1, 1), size=9, h=26, padx=11,
           stroke=(0.75, 0.8, 0.78), opacity=0.16)

    posts = [("formations/kine.jpg", "Formations", "5 nov. 2026",
              "Licence professionnelle en kinésithérapie : rentrée le 23 novembre 2026",
              "L'Institut lance à Bamako une licence professionnelle en kinésithérapie. Inscriptions ouvertes."),
             ("graduation.jpg", "Vie académique", "25 sept. 2026",
              "Résultats d'admission au BT-Santé 2026",
              "22 candidats admis sur 23, soit 95,65 % de réussite. Santé Publique et TLP à 100 %."),
             ("campus.jpg", "Vie académique", "15 août 2026",
              "Vacances Académiques 2026 : formez-vous gratuitement",
              "Du 10 août au 22 septembre 2026, rejoignez gratuitement les Vacances Académiques.")]
    for i, (img, cat, date, title, desc) in enumerate(posts):
        x = 72 + i * 440
        c.rect(x, 584, 416, 344, fill=WHITE, r=18, stroke=LINE)
        c.img(img, x + 1, 585, 414, 168)
        c.text(x + 20, 788, cat.upper(), size=8.5, color=EMERALD, spacing=1.3)
        c.text(x + 20 + c.measure(cat.upper(), size=8.5) + 1.3 * len(cat) + 12,
               788, "•  " + date, size=10, color=FAINT)
        c.wrap_px(x + 20, 818, title, 17, 372, serif=True, lh=21)
        c.wrap_px(x + 20, 876, desc, 11, 372, color=MUTED, lh=16)
        c.text(x + 20, 900, "Lire l'article  ↗", size=11, color=EMERALD)

    c.rect(72, 928, 1296, 44, fill=CREAM2, r=14)
    c.text(100, 956, "Recevez les actualités de l'Institut — newsletter mensuelle", size=11.5, color=MUTED)
    c.btn(1150, 936, "Je m'abonne  →", h=28, size=10)
    return c


def mobile_header(c, dark=False):
    """Barre de navigation mobile : logo compact + menu hamburger."""
    bg = INK if dark else CREAM
    fg = WHITE if dark else INK
    sub = (0.55, 0.62, 0.59) if dark else FAINT
    c.rect(0, 0, c.w, 62, fill=bg, opacity=0.97)
    c.line(0, 62, c.w, 62, color=(0.2, 0.26, 0.24) if dark else LINE)
    c.rect(16, 13, 36, 36, fill=EMERALD, r=11)
    c.text(34, 37, "BK", size=11.5, color=GOLD2, serif=True, anchor="center")
    c.text(62, 32, "Bernard Kouchner", size=14, color=fg, serif=True)
    c.text(62, 46, "IPFS-BK · HIPPODROME 1", size=6.5, color=sub, spacing=0.9)
    c.rect(340, 15, 34, 34, fill=(1, 1, 1), r=10, stroke=(0.82, 0.8, 0.74), opacity=0.9 if not dark else 0.12)
    for i in range(3):
        c.rect(350, 25 + i * 5, 15, 1.5, fill=fg, r=1)


def page_mobile():
    MW = 390
    c = Canvas(width=MW, height=1180)
    c.img("hero.jpg", 0, 0, MW, 700)
    c.rect(0, 0, MW, 700, fill=INK, opacity=0.34)
    c.soft(0, 150, MW, 320, opacity=0.3, feather=26)
    c.rect(0, 430, MW, 270, fill=INK, opacity=0.42)
    mobile_header(c)

    c.chip(16, 86, "Hippodrome 1 · Bamako", fg=WHITE, bg=WHITE, size=8, h=22, padx=9,
           stroke=(0.92, 0.96, 0.94), opacity=0.16)
    c.chip(176, 86, "Arrêté n°2026-0401", fg=WHITE, bg=WHITE, size=8, h=22, padx=9,
           stroke=(0.92, 0.96, 0.94), opacity=0.16)

    c.text(16, 190, "La santé", size=38, color=WHITE, serif=True)
    c.text(16, 232, "commence par", size=38, color=WHITE, serif=True)
    c.text(16, 286, "une formation", size=38, color=GOLD2, serif=True)
    c.text(16, 328, "sérieuse", size=38, color=GOLD2, serif=True)
    c.text(16 + c.measure("sérieuse", serif=True, size=38) + 2, 328, ".", size=38, color=GOLD2, serif=True)
    c.wrap_px(16, 366,
              "Nous formons des apprenants compétents, responsables et prêts à relever les défis du terrain.",
              12.5, 330, color=(0.84, 0.88, 0.86), lh=19)

    c.btn(16, 424, "S'inscrire en ligne  ›", w=358, h=46, bg=GOLD, fg=INK, size=12.5)
    c.rect(16, 486, 358, 44, fill=WHITE, r=22, stroke=(0.92, 0.96, 0.94), opacity=0.18)
    c.text(195, 513, "Explorer les 14 formations", size=12, color=WHITE, anchor="center")

    # panneau de chiffres (2 × 2 sur mobile)
    stats = [("4e", "Promotion diplômée"), ("14", "Formations"),
             ("95,65%", "Réussite BT-Santé"), ("4,6/5", "Note Google")]
    c.rect(16, 552, 358, 128, fill=WHITE, r=16, opacity=0.1)
    for i, (v, l) in enumerate(stats):
        x = 36 + (i % 2) * 174
        y = 590 + (i // 2) * 54
        c.text(x, y, v, size=23, color=WHITE, serif=True)
        c.text(x, y + 16, l, size=9, color=(0.8, 0.85, 0.83))
    c.line(203, 570, 203, 662, color=(1, 1, 1), width=0.8)
    c.line(36, 628, 354, 628, color=(1, 1, 1), width=0.8)

    c.rect(0, 700, MW, 40, fill=INK2)
    c.text(16, 725, "RENTRÉE 2026 — 2027 OUVERTE", size=8, color=(0.66, 0.72, 0.69), spacing=1.2)
    c.circle(300, 722, 2.5, fill=GOLD)

    # contenu : engagement
    c.eyebrow(16, 790, "Notre engagement")
    c.text(16, 828, "Une école de santé", size=25, color=INK, serif=True)
    c.text(16, 858, "ancrée dans les", size=25, color=INK, serif=True)
    c.text(16, 888, "réalités du Mali", size=25, color=EMERALD, serif=True)
    c.wrap_px(16, 920,
              "Des parcours conçus pour développer des compétences utiles et une pratique "
              "responsable au service des patients et des communautés.",
              11.5, 350, color=MUTED, lh=18)

    # cartes empilées
    cards = [("DEF", "Parcours accessibles", "Après le Diplôme d'études fondamentales."),
             ("BAC", "Licences & supérieur", "Des formations orientées métiers de la santé.")]
    for i, (tag, t, d) in enumerate(cards):
        y = 980 + i * 96
        c.rect(16, y, 358, 84, fill=WHITE, r=15, stroke=LINE)
        c.rect(32, y + 16, 34, 34, fill=MINT, r=10)
        c.text(49, y + 38, "+", size=13, color=EMERALD, anchor="center")
        c.text(78, y + 32, t, size=12.5, color=INK, serif=True)
        c.wrap_px(78, y + 50, d, 9.5, 270, color=MUTED, lh=13)
        c.text(32, y + 74, tag, size=8, color=GOLD_DARK, spacing=1.2)
    return c


def page_tablet():
    c = Canvas(width=834, height=1000)
    c.img("hero.jpg", 0, 0, 834, 520)
    c.rect(0, 0, 834, 520, fill=INK, opacity=0.34)
    c.soft(0, 180, 834, 320, opacity=0.3, feather=28)
    c.rect(0, 0, 834, 74, fill=CREAM, opacity=0.96)
    c.line(0, 74, 834, 74, color=LINE)
    c.logo(40, 16)
    c.rect(742, 18, 40, 40, fill=WHITE, r=11, stroke=(0.82, 0.8, 0.74))
    for i in range(3):
        c.rect(753, 30 + i * 6, 18, 1.6, fill=INK, r=1)
    c.chip(40, 116, "Hippodrome 1 · Bamako", fg=WHITE, bg=WHITE, size=9, h=24, padx=10,
           stroke=(0.92, 0.96, 0.94), opacity=0.16)
    c.text(40, 210, "La santé commence par", size=44, color=WHITE, serif=True)
    c.text(40, 262, "une formation sérieuse", size=44, color=GOLD2, serif=True)
    c.text(40 + c.measure("une formation sérieuse", serif=True, size=44) + 2, 262, ".", size=44, color=GOLD2, serif=True)
    c.wrap_px(40, 306,
              "Nous formons des apprenants compétents, responsables et prêts à relever les défis du terrain. "
              "Intégrez un institut qui place la qualité, la rigueur et l'engagement au cœur de son action.",
              13.5, 520, color=(0.82, 0.86, 0.84), lh=21)
    c.btn(40, 388, "S'inscrire en ligne  ›", h=48, bg=GOLD, fg=INK, size=12.5)
    c.btn(268, 388, "Explorer les 14 formations", h=48, bg=WHITE, fg=WHITE, size=12.5,
          stroke=(0.95, 0.98, 0.97), opacity=0.12)
    stats = [("4e", "Promotion diplômée"), ("14", "Formations"), ("95,65%", "BT-Santé 2026"), ("4,6/5", "Note Google")]
    for i, (v, l) in enumerate(stats):
        x = 46 + i * 196
        c.text(x, 486, v, size=24, color=WHITE, serif=True)
        c.text(x, 504, l, size=10, color=(0.78, 0.83, 0.81))
    # grille 2 colonnes
    c.eyebrow(40, 590, "Nos programmes")
    c.text(40, 632, "Des formations pensées pour construire", size=30, color=INK, serif=True)
    c.text(40, 668, "un vrai avenir professionnel", size=30, color=EMERALD, serif=True)
    for i in range(4):
        col, row = i % 2, i // 2
        x, y = 40 + col * 388, 710 + row * 274
        c.rect(x, y, 366, 254, fill=WHITE, r=18, stroke=LINE)
        c.img(["formations/kine.jpg", "formations/infirmier.jpg", "care.jpg", "lab.jpg"][i], x + 1, y + 1, 364, 120)
        c.text(x + 18, y + 152, "SANTÉ · BAC", size=8, color=EMERALD, spacing=1.2)
        c.text(x + 18, y + 176, ["Kinésithérapie", "Infirmier en santé publique", "Santé maternelle", "Technicien de labo"][i],
               size=14, color=INK, serif=True)
        c.text(x + 18, y + 200, "Tarif sur la fiche formation", size=9.5, color=MUTED)
        c.line(x + 18, y + 220, x + 348, y + 220, color=(0.94, 0.92, 0.88))
        c.text(x + 18, y + 236, "Découvrir  ›", size=9.5, color=EMERALD)
    return c


def main():
    OUT.mkdir(exist_ok=True)
    for name, fn in [
        ("07-mobile", page_mobile),
        ("08-tablette", page_tablet),
        ("01-accueil", page_home),
        ("02-formations", page_formations),
        ("03-application-mobile", page_application),
        ("04-personnel-pc", page_staff),
        ("05-connexion", page_login),
        ("06-blog", page_blog),
    ]:
        fn().save(name)


if __name__ == "__main__":
    main()
