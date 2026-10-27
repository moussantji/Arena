#!/usr/bin/env python3
"""
DIALLO — génère un fichier .sketch importable dans Figma.

Figma importe nativement les fichiers Sketch (File → Import). Le format .fig
étant propriétaire et non générable hors de Figma, c'est le format pivot retenu :
un .sketch = une archive ZIP de JSON + images.

Contenu produit :
  · Page 1 « 01 · Écrans »        : 12 artboards 1440 × 900 (captures de l'app)
  · Page 2 « 02 · Design system » : palette, typographie, composants (vecteurs + textes)

Usage :
    python3 tools/make-figma-sketch.py
Sortie :
    figma/DIALLO-Indigo-Minuit.sketch
"""

import hashlib
import io
import json
import os
import uuid
import zipfile

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PALETTES = os.path.join(ROOT, "gallery", "palettes")
OUT = os.path.join(ROOT, "figma", "DIALLO-Indigo-Minuit.sketch")

W, H = 1440, 900
GAP = 80

# ---------------------------------------------------------------- couleurs
C = {
    "bg": "#070B1F",
    "bg-elevated": "#0B1030",
    "panel": "#1B2A6B",
    "ink": "#F0F2FF",
    "dim": "#A7B6FF",
    "faint": "#6B78A8",
    "accent": "#5B7CFA",
    "accent-soft": "#7E9BFF",
    "copper": "#E0A86F",
    "danger": "#F08A8A",
    "success": "#6FD3A8",
    "white": "#FFFFFF",
}


def uid():
    return str(uuid.uuid4()).upper()


def color(hex_str, alpha=1.0):
    h = hex_str.lstrip("#")
    return {
        "_class": "color",
        "alpha": alpha,
        "red": int(h[0:2], 16) / 255.0,
        "green": int(h[2:4], 16) / 255.0,
        "blue": int(h[4:6], 16) / 255.0,
    }


def rect(x, y, w, h):
    return {
        "_class": "rect",
        "constrainProportions": False,
        "height": h,
        "width": w,
        "x": x,
        "y": y,
    }


def export_options():
    return {
        "_class": "exportOptions",
        "exportFormats": [],
        "includedLayerIds": [],
        "layerOptions": 0,
        "shouldTrim": False,
    }


def common(cls, name, frame, **extra):
    layer = {
        "_class": cls,
        "do_objectID": uid(),
        "booleanOperation": -1,
        "clippingMaskMode": 0,
        "hasClippingMask": False,
        "exportOptions": export_options(),
        "frame": frame,
        "isFlippedHorizontal": False,
        "isFlippedVertical": False,
        "isLocked": False,
        "isTemplate": False,
        "isVisible": True,
        "isFixedToViewport": False,
        "layerListExpandedType": 0,
        "name": name,
        "nameIsFixed": False,
        "resizingConstraint": 63,
        "resizingType": 0,
        "rotation": 0,
        "shouldBreakMaskChain": False,
    }
    layer.update(extra)
    return layer


def style(fills=None, borders=None, shadows=None):
    return {
        "_class": "style",
        "do_objectID": uid(),
        "endMarkerType": 0,
        "miterLimit": 10,
        "startMarkerType": 0,
        "windingRule": 1,
        "borderOptions": {
            "_class": "borderOptions",
            "isEnabled": True,
            "dashPattern": [],
            "lineCapStyle": 0,
            "lineJoinStyle": 0,
        },
        "borders": borders or [],
        "colorControls": {
            "_class": "colorControls",
            "isEnabled": False,
            "brightness": 0,
            "contrast": 1,
            "hue": 0,
            "saturation": 1,
        },
        "contextSettings": {
            "_class": "graphicsContextSettings",
            "blendMode": 0,
            "opacity": 1,
        },
        "fills": fills or [],
        "innerShadows": [],
        "shadows": shadows or [],
    }


def gradient(hex_str, alpha=1.0):
    """Dégradé inerte : requis par le schéma Sketch pour tout fill/border."""
    return {
        "_class": "gradient",
        "gradientType": 0,
        "elipseLength": 0,
        "from": "{0.5, 0}",
        "to": "{0.5, 1}",
        "stops": [
            {"_class": "gradientStop", "color": color(hex_str, alpha), "position": 0},
            {"_class": "gradientStop", "color": color(hex_str, alpha), "position": 1},
        ],
    }


def context_settings():
    return {"_class": "graphicsContextSettings", "blendMode": 0, "opacity": 1}


def fill(hex_str, alpha=1.0):
    return {
        "_class": "fill",
        "isEnabled": True,
        "fillType": 0,
        "color": color(hex_str, alpha),
        "contextSettings": context_settings(),
        "gradient": gradient(hex_str, alpha),
        "noiseIndex": 0,
        "noiseIntensity": 0,
        "patternFillType": 1,
        "patternTileScale": 1,
    }


def border(hex_str, alpha=1.0, thickness=1):
    return {
        "_class": "border",
        "isEnabled": True,
        "fillType": 0,
        "color": color(hex_str, alpha),
        "contextSettings": context_settings(),
        "gradient": gradient(hex_str, alpha),
        "position": 1,
        "thickness": thickness,
    }


# ---------------------------------------------------------------- couches
def artboard(name, x, y, w, h, bg="#070B1F"):
    return common(
        "artboard",
        name,
        rect(x, y, w, h),
        backgroundColor=color(bg),
        hasBackgroundColor=True,
        includeBackgroundColorInExport=True,
        hasClickThrough=True,
        horizontalRulerData={"_class": "rulerData", "base": 0, "guides": []},
        verticalRulerData={"_class": "rulerData", "base": 0, "guides": []},
        isFlowHome=False,
        resizesContent=False,
        layers=[],
    )


def shape_rect(name, x, y, w, h, hex_fill=None, alpha=1.0, radius=0, hex_border=None, border_alpha=1.0):
    points = []
    for px, py in [(0, 0), (1, 0), (1, 1), (0, 1)]:
        points.append(
            {
                "_class": "curvePoint",
                "cornerRadius": radius,
                "cornerStyle": 0,
                "curveFrom": f"{{{px}, {py}}}",
                "curveTo": f"{{{px}, {py}}}",
                "hasCurveFrom": False,
                "hasCurveTo": False,
                "point": f"{{{px}, {py}}}",
                "curveMode": 1,
            }
        )

    inner = common(
        "rectangle",
        name,
        rect(0, 0, w, h),
        edited=False,
        isClosed=True,
        pointRadiusBehaviour=1,
        fixedRadius=radius,
        points=points,
        hasConvertedToNewRoundCorners=True,
        needsConvertionToNewRoundCorners=False,
    )

    group_fills = [fill(hex_fill, alpha)] if hex_fill else []
    group_borders = [border(hex_border, border_alpha)] if hex_border else []

    return common(
        "shapeGroup",
        name,
        rect(x, y, w, h),
        hasClickThrough=False,
        layerListExpandedType=0,
        windingRule=1,
        layers=[inner],
        style=style(group_fills, group_borders),
    )


def text_layer(string, x, y, size, weight, hex_color, w=None, line_height=None, tracking=0):
    fonts = {"regular": "Inter-Regular", "medium": "Inter-Medium", "semibold": "Inter-SemiBold", "bold": "Inter-Bold"}
    font_name = fonts.get(weight, "Inter-Regular")

    width = w if w else max(40, len(string) * size * 0.62)
    height = line_height or round(size * 1.35)

    paragraph = {"_class": "paragraphStyle", "alignment": 0}
    attrs = {
        "MSAttributedStringFontAttribute": {
            "_class": "fontDescriptor",
            "attributes": {"name": font_name, "size": size},
        },
        "MSAttributedStringColorAttribute": color(hex_color),
        "textStyleVerticalAlignmentKey": 0,
        "kerning": tracking,
        "paragraphStyle": paragraph,
    }

    attributed = {
        "_class": "attributedString",
        "string": string,
        "attributes": [
            {
                "_class": "stringAttribute",
                "location": 0,
                "length": len(string),
                "attributes": attrs,
            }
        ],
    }

    return common(
        "text",
        string[:40],
        rect(x, y, width, height),
        attributedString=attributed,
        automaticallyDrawOnUnderlyingPath=False,
        dontSynchroniseWithSymbol=False,
        glyphBounds=f"{{{{0, 0}}, {{{width}, {height}}}}}",
        lineSpacingBehaviour=2,
        textBehaviour=1,
        style=style(),
    )


def bitmap_layer(name, x, y, w, h, image_ref):
    return common(
        "bitmap",
        name,
        rect(x, y, w, h),
        clippingMask=f"{{{{0, 0}}, {{{w}, 0}}, {{{w}, {h}}}, {{0, {h}}}}}",
        image={"_class": "MSJSONFileReference", "_ref_class": "MSImageData", "_ref": f"images/{image_ref}"},
        fillReplacesImage=False,
        intendedDPI=72,
        style=style(),
    )


# ---------------------------------------------------------------- images
def image_bytes(path, target_w=1440):
    """PNG → JPEG compressé, largeur cible."""
    img = Image.open(path).convert("RGB")
    if img.width != target_w:
        ratio = target_w / img.width
        img = img.resize((target_w, round(img.height * ratio)), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=82, optimize=True, progressive=True)
    return buf.getvalue()


SCREENS = [
    ("Tableau de bord", "indigo-page-tableau-de-bord.png"),
    ("Élèves", "indigo-page-eleves.png"),
    ("Classes", "indigo-page-classes.png"),
    ("Emploi du temps", "indigo-page-emploi-du-temps.png"),
    ("Finances", "indigo-page-finances.png"),
    ("Personnel", "indigo-page-personnel.png"),
    ("Messagerie", "indigo-page-messagerie.png"),
    ("Notes", "indigo-page-notes.png"),
    ("Absences", "indigo-page-absences.png"),
    ("Fiche élève", "indigo-page-profil.png"),
    ("Admissions", "indigo-page-admissions.png"),
    ("Paramètres", "indigo-page-parametres.png"),
]


# ---------------------------------------------------------------- pages
def build_screens_page(images):
    page = common(
        "page",
        "01 · Écrans",
        rect(0, 0, 0, 0),
        hasClickThrough=True,
        horizontalRulerData={"_class": "rulerData", "base": 0, "guides": []},
        verticalRulerData={"_class": "rulerData", "base": 0, "guides": []},
        layers=[],
    )

    for i, (label, filename) in enumerate(SCREENS):
        col, row = i % 3, i // 3
        ab = artboard(f"{i + 1:02d} · {label}", col * (W + GAP), row * (H + GAP), W, H)
        digest = images[filename]
        ab["layers"].append(bitmap_layer(label, 0, 0, W, H, digest))
        page["layers"].append(ab)

    return page


def build_design_page():
    page = common(
        "page",
        "02 · Design system",
        rect(0, 0, 0, 0),
        hasClickThrough=True,
        horizontalRulerData={"_class": "rulerData", "base": 0, "guides": []},
        verticalRulerData={"_class": "rulerData", "base": 0, "guides": []},
        layers=[],
    )

    ab = artboard("Indigo Minuit · palette, type, composants", 0, 0, 1440, 1180)
    layers = ab["layers"]

    layers.append(shape_rect("Fond", 0, 0, 1440, 1180, "#070B1F", radius=0))
    layers.append(text_layer("INDIGO MINUIT", 64, 52, 40, "bold", C["ink"], tracking=-1))
    layers.append(
        text_layer("DIALLO · ÉCOLE PREMIUM · DESKTOP ELECTRON · 1440 × 900", 64, 108, 11, "medium", C["faint"], tracking=2.2)
    )

    # ---- palette
    layers.append(text_layer("COULEURS", 64, 160, 10, "medium", C["faint"], tracking=2))

    swatches = [
        ("bg", C["bg"]), ("bg-elevated", C["bg-elevated"]), ("panel", C["panel"]),
        ("ink", C["ink"]), ("dim", C["dim"]), ("faint", C["faint"]),
        ("accent", C["accent"]), ("accent-soft", C["accent-soft"]), ("copper", C["copper"]),
        ("danger", C["danger"]), ("success", C["success"]), ("line 15 %", C["dim"]),
    ]
    for i, (name, hex_color) in enumerate(swatches):
        col, row = i % 6, i // 6
        x = 64 + col * 216
        y = 190 + row * 150
        alpha = 0.15 if name.startswith("line") else 1.0
        layers.append(
            shape_rect(f"Swatch {name}", x, y, 190, 96, hex_color, alpha=alpha, radius=12,
                       hex_border=C["dim"], border_alpha=0.25)
        )
        layers.append(text_layer(name.upper(), x, y + 110, 9, "medium", C["faint"], tracking=1.4))
        layers.append(text_layer(hex_color.upper(), x, y + 124, 11, "medium", C["ink"]))

    # ---- typographie
    layers.append(text_layer("TYPOGRAPHIE", 64, 520, 10, "medium", C["faint"], tracking=2))

    type_scale = [
        ("Display / 28", 28, "bold", C["ink"]),
        ("Title / 20", 20, "bold", C["ink"]),
        ("Heading / 15", 15, "semibold", C["ink"]),
        ("Body / 12", 12, "regular", C["dim"]),
        ("Body strong / 12", 12, "medium", C["ink"]),
        ("Caption / 10.5", 10.5, "regular", C["faint"]),
        ("Label / 9", 9, "medium", C["faint"]),
        ("Mono / 10", 10, "medium", C["dim"]),
    ]
    for i, (label, size, weight, hex_color) in enumerate(type_scale):
        y = 552 + i * 34
        layers.append(text_layer(label.upper(), 64, y + 4, 9, "medium", C["faint"], tracking=1.2))
        layers.append(text_layer("École Internationale Diallo", 340, y, size, weight, hex_color))

    # ---- composants
    layers.append(text_layer("COMPOSANTS", 64, 846, 10, "medium", C["faint"], tracking=2))

    # boutons
    layers.append(shape_rect("Button / Primaire", 64, 876, 190, 40, C["accent"], radius=9,
                             hex_border=C["white"], border_alpha=0.2))
    layers.append(text_layer("Enregistrer", 106, 888, 12, "semibold", C["white"]))

    layers.append(shape_rect("Button / Secondaire", 268, 876, 170, 40, C["dim"], alpha=0.10, radius=9,
                             hex_border=C["dim"], border_alpha=0.5))
    layers.append(text_layer("Exporter", 314, 888, 12, "regular", C["ink"]))

    # pills
    pills = [("À jour", C["accent"], "#CDD8FF"), ("En retard", C["copper"], "#F2C79A"),
             ("Boursier", C["accent-soft"], C["dim"]), ("Payé", C["success"], "#BFF0DA")]
    x = 64
    for name, bg, fg in pills:
        w = max(56, len(name) * 7 + 22)
        layers.append(shape_rect(f"Pill / {name}", x, 936, w, 24, bg, alpha=0.18, radius=999,
                                 hex_border=bg, border_alpha=0.45))
        layers.append(text_layer(name, x + 11, 941, 9, "medium", fg, tracking=0.3))
        x += w + 12

    # kpi
    layers.append(shape_rect("KPI / card", 64, 986, 300, 128, C["panel"], alpha=0.28, radius=14,
                             hex_border=C["dim"], border_alpha=0.14))
    layers.append(text_layer("Élèves", 80, 1000, 11.5, "regular", C["dim"]))
    layers.append(text_layer("1 284", 80, 1022, 26, "bold", C["ink"], tracking=-0.5))
    layers.append(text_layer("+2,4 %", 150, 1032, 10, "medium", C["accent-soft"]))
    layers.append(shape_rect("KPI / jauge fond", 80, 1072, 268, 3, C["dim"], alpha=0.2, radius=999))
    layers.append(shape_rect("KPI / jauge", 80, 1072, 210, 3, C["accent"], radius=999))
    layers.append(text_layer("vs septembre", 80, 1084, 10, "regular", C["faint"]))

    # avatar
    layers.append(shape_rect("Avatar / MD", 400, 986, 44, 44, C["accent-soft"], radius=22,
                             hex_border=C["white"], border_alpha=0.22))
    layers.append(text_layer("MD", 410, 998, 15, "semibold", C["bg"]))

    # ligne de tableau
    layers.append(shape_rect("Table / Row", 400, 1050, 900, 64, C["dim"], alpha=0.04, radius=10,
                             hex_border=C["dim"], border_alpha=0.12))
    layers.append(shape_rect("Row / avatar", 416, 1067, 30, 30, C["accent"], radius=15))
    layers.append(text_layer("AT", 421, 1073, 10, "semibold", C["bg"]))
    layers.append(text_layer("Aminata Traoré", 458, 1064, 12.5, "medium", C["ink"]))
    layers.append(text_layer("Terminale S · 2026-0142", 458, 1083, 9.5, "regular", C["faint"]))
    layers.append(text_layer("12,80", 860, 1069, 11, "medium", C["dim"]))
    layers.append(text_layer("8,45 M FCFA", 1080, 1069, 11, "medium", C["ink"]))

    page["layers"].append(ab)
    return page


# ---------------------------------------------------------------- assemblage
def main():
    images = {}
    blobs = {}

    for _, filename in SCREENS:
        path = os.path.join(PALETTES, filename)
        data = image_bytes(path)
        digest = hashlib.sha1(data).hexdigest()
        images[filename] = digest
        blobs[digest] = data

    screens_page = build_screens_page(images)
    design_page = build_design_page()
    pages = [screens_page, design_page]

    document = {
        "_class": "document",
        "do_objectID": uid(),
        "assets": {
            "_class": "assetCollection",
            "do_objectID": uid(),
            "colorAssets": [],
            "gradientAssets": [],
            "images": [],
            "colors": [],
            "gradients": [],
            "exportPresets": [],
        },
        "colorSpace": 0,
        "currentPageIndex": 0,
        "foreignLayerStyles": [],
        "foreignSymbols": [],
        "foreignTextStyles": [],
        "layerStyles": {"_class": "sharedStyleContainer", "objects": []},
        "layerSymbols": {"_class": "symbolContainer", "objects": []},
        "layerTextStyles": {"_class": "sharedTextStyleContainer", "objects": []},
        "perDocumentLibraries": [],
        "pages": [
            {"_class": "MSJSONFileReference", "_ref_class": "MSImmutablePage", "_ref": f"pages/{p['do_objectID']}"}
            for p in pages
        ],
    }

    pages_and_artboards = {}
    for p in pages:
        boards = {}
        for layer in p["layers"]:
            if layer["_class"] == "artboard":
                boards[layer["do_objectID"]] = {"name": layer["name"]}
        pages_and_artboards[p["do_objectID"]] = {"name": p["name"], "artboards": boards}

    meta = {
        "app": "com.bohemiancoding.sketch3",
        "appVersion": "121",
        "build": 202000,
        "commit": "generated-by-diallo-tools",
        "compatibilityVersion": 99,
        "created": {
            "app": "com.bohemiancoding.sketch3",
            "appVersion": "121",
            "build": 202000,
            "commit": "generated-by-diallo-tools",
            "compatibilityVersion": 99,
            "version": 121,
            "variant": "NONAPPSTORE",
        },
        "autosaved": 0,
        "saveHistory": [],
        "pagesAndArtboards": pages_and_artboards,
        "version": 121,
        "variant": "NONAPPSTORE",
    }

    user = {"document": {"pageListHeight": 120, "pageListCollapsed": 0}}
    for p in pages:
        user[p["do_objectID"]] = {"scrollOrigin": "{0, 0}", "zoomValue": 0.5}

    # aperçu du document (Sketch l'affiche dans le Finder et Figma s'en sert à l'import)
    cover = Image.open(os.path.join(PALETTES, SCREENS[0][1])).convert("RGB")
    cover.thumbnail((1200, 1200), Image.LANCZOS)
    buf = io.BytesIO()
    cover.save(buf, format="PNG", optimize=True)
    preview_png = buf.getvalue()

    os.makedirs(os.path.dirname(OUT), exist_ok=True)

    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("document.json", json.dumps(document, ensure_ascii=False))
        z.writestr("meta.json", json.dumps(meta, ensure_ascii=False))
        z.writestr("user.json", json.dumps(user, ensure_ascii=False))
        for p in pages:
            z.writestr(f"pages/{p['do_objectID']}.json", json.dumps(p, ensure_ascii=False))
        for digest, data in blobs.items():
            z.writestr(f"images/{digest}", data)
        z.writestr("previews/preview.png", preview_png)

    size = os.path.getsize(OUT)
    print(f"OK  {OUT}")
    print(f"    {len(pages)} pages · {len(SCREENS) + 1} artboards · {len(blobs)} images")
    print(f"    {size / 1024 / 1024:.1f} Mo")


if __name__ == "__main__":
    main()
