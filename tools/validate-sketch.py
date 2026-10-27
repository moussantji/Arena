#!/usr/bin/env python3
"""
Valide un fichier .sketch contre le schéma JSON **officiel** de Sketch
(@sketch-hq/sketch-file-format, v6.5.0), le même que celui utilisé par
l'écosystème Sketch — et donc le meilleur garde-fou avant un import Figma.

Le schéma n'est pas versionné dans le dépôt : il est récupéré une fois depuis
le registre npm, puis mis en cache (~/.cache/diallo-sketch-schemas).

Usage :
    python3 tools/validate-sketch.py figma/DIALLO-Indigo-Minuit.sketch
    SKETCH_SCHEMAS=/chemin/vers/dist python3 tools/validate-sketch.py fichier.sketch

Dépendance : jsonschema (`pip install jsonschema`, ou via un venv).
"""

import io
import json
import os
import sys
import tarfile
import urllib.request
import warnings
import zipfile

PKG = "@sketch-hq/sketch-file-format"
VERSION = "6.5.0"
TARBALL = f"https://registry.npmjs.org/{PKG}/-/sketch-file-format-{VERSION}.tgz"
CACHE = os.path.join(os.path.expanduser("~"), ".cache", "diallo-sketch-schemas")
PARTS = ("document", "page", "meta", "user", "file-format")


def schema_dir():
    local = os.environ.get("SKETCH_SCHEMAS")
    candidates = [local] if local else []
    candidates.append(CACHE)
    for d in candidates:
        if d and all(os.path.exists(os.path.join(d, f"{p}.schema.json")) for p in PARTS):
            return d

    os.makedirs(CACHE, exist_ok=True)
    with urllib.request.urlopen(TARBALL) as resp:  # noqa: S310
        blob = resp.read()
    with tarfile.open(fileobj=io.BytesIO(blob), mode="r:gz") as tar:
        for member in tar.getmembers():
            base = os.path.basename(member.name)
            if member.name.startswith("package/dist/") and base.endswith(".schema.json"):
                with open(os.path.join(CACHE, base), "wb") as out:
                    out.write(tar.extractfile(member).read())
    return CACHE


def main(path):
    warnings.filterwarnings("ignore", category=DeprecationWarning)
    try:
        import jsonschema
        from jsonschema import RefResolver
    except ImportError:
        print("jsonschema manquant : pip install jsonschema", file=sys.stderr)
        return 2

    directory = schema_dir()
    store = {}
    for part in PARTS:
        with open(os.path.join(directory, f"{part}.schema.json"), encoding="utf-8") as fh:
            # les $ref internes pointent vers des URLs unpkg : on les résout en local
            raw = fh.read().replace(
                f"https://unpkg.com/{PKG}@{VERSION}/dist/", ""
            )
        store[f"file://{directory}/{part}.schema.json"] = json.loads(raw)

    resolver = RefResolver(base_uri=f"file://{directory}/", referrer={}, store=store)

    archive = zipfile.ZipFile(path)
    names = archive.namelist()
    if "document.json" not in names:
        print("document.json absent : ce n'est pas une archive Sketch", file=sys.stderr)
        return 2

    targets = [("document", "document.json"), ("meta", "meta.json"), ("user", "user.json")]
    targets += [("page", n) for n in names if n.startswith("pages/")]

    total = 0
    for part, member in targets:
        data = json.loads(archive.read(member))
        validator = jsonschema.Draft7Validator(
            store[f"file://{directory}/{part}.schema.json"], resolver=resolver
        )
        errors = sorted(validator.iter_errors(data), key=lambda e: list(e.path))
        total += len(errors)
        mark = "✓" if not errors else "✗"
        print(f"  {mark} {member} — {len(errors)} écart(s)")
        for err in errors[:5]:
            where = "/".join(str(p) for p in err.path) or "(racine)"
            print(f"      · {where} : {err.message[:180]}")

    print()
    if total:
        print(f"✗ {total} écart(s) avec le schéma Sketch {VERSION}")
        return 1
    print(f"✓ conforme au schéma Sketch {VERSION} ({len(targets)} fichiers)")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
