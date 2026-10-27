#!/usr/bin/env python3
"""
Vérifie la structure d'un fichier .sketch avant import dans Figma.

Contrôle :
  · archive lisible, entrées attendues présentes
  · JSON valide partout
  · références page → document, page → meta
  · images référencées présentes, nommées par le SHA-1 de leur contenu
  · identifiants uniques, cadres cohérents, textes cohérents
"""

import hashlib
import json
import sys
import zipfile


def main(path):
    problems = []
    infos = []

    z = zipfile.ZipFile(path)
    names = set(z.namelist())

    required = {"document.json", "meta.json", "user.json", "previews/preview.png"}
    for r in required:
        if r not in names:
            problems.append(f"entrée manquante : {r}")

    def load(name):
        try:
            return json.loads(z.read(name))
        except Exception as e:  # noqa: BLE001
            problems.append(f"JSON invalide {name} : {e}")
            return None

    document = load("document.json")
    meta = load("meta.json")
    user = load("user.json")

    if not document or document.get("_class") != "document":
        problems.append("document.json : _class != document")

    # pages
    pages = []
    for i, ref in enumerate(document.get("pages", [])):
        r = ref.get("_ref", "")
        filename = r + ".json" if not r.endswith(".json") else r
        if filename not in names:
            problems.append(f"page référencée introuvable : {filename}")
            continue
        page = load(filename)
        if not page:
            continue
        if page.get("_class") != "page":
            problems.append(f"{filename} : _class != page")
        pages.append(page)

    infos.append(f"{len(pages)} pages : " + ", ".join(p.get("name", "?") for p in pages))

    # meta
    pna = (meta or {}).get("pagesAndArtboards", {})
    for p in pages:
        pid = p["do_objectID"]
        if pid not in pna:
            problems.append(f"meta.pagesAndArtboards ne contient pas {pid}")
    if user is not None:
        for p in pages:
            if p["do_objectID"] not in user:
                problems.append(f"user.json : pas d'entrée pour la page {p.get('name')}")

    # identifiants uniques
    ids = []
    artboard_count = 0
    layer_counts = {}

    def walk(layer, page_name):
        nonlocal artboard_count
        ids.append(layer.get("do_objectID"))
        cls = layer.get("_class")
        layer_counts[cls] = layer_counts.get(cls, 0) + 1
        if cls == "artboard":
            artboard_count += 1
            f = layer.get("frame", {})
            if not (f.get("width", 0) > 0 and f.get("height", 0) > 0):
                problems.append(f"artboard sans dimensions : {layer.get('name')}")
            if not layer.get("layers"):
                problems.append(f"artboard vide : {layer.get('name')}")
        for child in layer.get("layers", []) or []:
            walk(child, page_name)

    for p in pages:
        for layer in p.get("layers", []):
            walk(layer, p.get("name"))

    dupes = {i for i in ids if ids.count(i) > 1 and i}
    if dupes:
        problems.append(f"{len(dupes)} identifiants dupliqués")

    # images
    image_refs = []

    def collect_images(layer):
        img = layer.get("image")
        if isinstance(img, dict) and img.get("_ref"):
            image_refs.append(img["_ref"])
        for child in layer.get("layers", []) or []:
            collect_images(child)

    for p in pages:
        for layer in p.get("layers", []):
            collect_images(layer)

    for ref in image_refs:
        if ref not in names:
            problems.append(f"image absente de l'archive : {ref}")
            continue
        digest = hashlib.sha1(z.read(ref)).hexdigest()
        if ref.split("/")[-1] != digest:
            problems.append(f"{ref} : nom ≠ SHA-1 du contenu ({digest})")

    # textes
    def check_text(layer):
        if layer.get("_class") == "text":
            a = layer.get("attributedString", {})
            s = a.get("string", "")
            for attr in a.get("attributes", []):
                if attr.get("length") != len(s):
                    problems.append(f"texte « {s[:24]} » : length={attr.get('length')} ≠ {len(s)}")
                if "MSAttributedStringFontAttribute" not in attr.get("attributes", {}):
                    problems.append(f"texte « {s[:24]} » : police absente")
        for child in layer.get("layers", []) or []:
            check_text(child)

    for p in pages:
        for layer in p.get("layers", []):
            check_text(layer)

    # cadres
    def check_frames(layer):
        f = layer.get("frame")
        if not isinstance(f, dict):
            problems.append(f"{layer.get('_class')} sans frame")
        else:
            for k in ("x", "y", "width", "height"):
                if k not in f:
                    problems.append(f"{layer.get('_class')} : frame.{k} manquant")
        for child in layer.get("layers", []) or []:
            check_frames(child)

    for p in pages:
        for layer in p.get("layers", []):
            check_frames(layer)

    # résumé
    infos.append(f"{artboard_count} artboards")
    infos.append(
        "couches : "
        + ", ".join(f"{k}×{v}" for k, v in sorted(layer_counts.items(), key=lambda x: -x[1]))
    )
    infos.append(f"{len(image_refs)} images référencées · {len(names) - 3 - len(pages)} fichiers image")

    for line in infos:
        print("·", line)

    if problems:
        print(f"\n{len(problems)} problème(s) :")
        for p in problems[:20]:
            print("  ✗", p)
        return 1

    print("\n✓ structure valide")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "figma/DIALLO-Indigo-Minuit.sketch"))
