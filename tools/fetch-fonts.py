"""Downloads the site's fonts from Google Fonts into site/assets/fonts and
writes site/css/fonts.css. Run once; re-run only to change fonts.
    python tools/fetch-fonts.py
"""
import re, pathlib, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "site" / "assets" / "fonts"
OUT.mkdir(parents=True, exist_ok=True)

CSS_URL = ("https://fonts.googleapis.com/css2?"
           "family=EB+Garamond:ital,wght@0,500;0,600;1,500"
           "&family=Source+Sans+3:wght@400;600&display=swap")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"

req = urllib.request.Request(CSS_URL, headers={"User-Agent": UA})
css = urllib.request.urlopen(req).read().decode()

blocks = re.findall(r"/\* ([\w-]+) \*/\s*@font-face \{(.*?)\}", css, re.S)
out = ["/* Self-hosted fonts (built by tools/fetch-fonts.py). */"]
for subset, body in blocks:
    if subset not in ("latin", "latin-ext"):
        continue
    fam = re.search(r"font-family: '([^']+)'", body).group(1)
    style = re.search(r"font-style: (\w+)", body).group(1)
    weight = re.search(r"font-weight: (\d+)", body).group(1)
    url = re.search(r"url\((https://[^)]+\.woff2)\)", body).group(1)
    rng = re.search(r"unicode-range: ([^;]+);", body).group(1)
    name = f"{fam.replace(' ', '')}-{weight}-{style}-{subset}.woff2"
    (OUT / name).write_bytes(urllib.request.urlopen(url).read())
    out.append(
        "@font-face {\n"
        f"  font-family: '{fam}';\n  font-style: {style};\n  font-weight: {weight};\n"
        "  font-display: swap;\n"
        f"  src: url('/assets/fonts/{name}') format('woff2');\n"
        f"  unicode-range: {rng};\n}}"
    )
    print("saved", name)

(ROOT / "site" / "css" / "fonts.css").write_text("\n".join(out) + "\n", encoding="utf-8")
print("wrote site/css/fonts.css")
