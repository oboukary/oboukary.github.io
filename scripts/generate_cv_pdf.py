"""Generate the static CV PDF, independent of Quarto.

Reads `assets/html/cv.html` (the CV body) and `assets/scss/_cv.scss`
(plus its custom.scss imports), compiles SCSS -> CSS, embeds Google
Fonts, builds a self-contained HTML document, and renders it to
`assets/pdf/CV_Boukary_Ouedraogo.pdf` via headless Chromium.

Usage:
    python scripts/generate_cv_pdf.py
"""
from __future__ import annotations

import re
from pathlib import Path

import sass
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
CV_HTML = ROOT / "assets" / "html" / "cv.html"
CV_SCSS = ROOT / "assets" / "scss" / "_cv.scss"
OUTPUT = ROOT / "assets" / "pdf" / "CV_Boukary_Ouedraogo.pdf"

GOOGLE_FONTS = (
    "https://fonts.googleapis.com/css2?"
    "family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400"
    "&family=Raleway:wght@300;400;500;600&display=swap"
)


def _extract_cv_body(html: str) -> str:
    """Keep only the <div id="cv-content"> block; drop floating button & scripts.

    Walks the HTML to find the matching </div> for the opening tag rather
    than relying on a fragile regex (the CV is deeply nested).
    """
    start = html.find('<div id="cv-content"')
    if start == -1:
        raise RuntimeError('cv-content block not found in cv.html')

    depth = 0
    i = start
    tag_re = re.compile(r'<(/?)div\b[^>]*>', re.IGNORECASE)
    for m in tag_re.finditer(html, pos=start):
        if m.group(1) == '':
            depth += 1
        else:
            depth -= 1
            if depth == 0:
                return html[start:m.end()]
    # Fallback: take to end of file
    return html[start:]


def _compile_css() -> str:
    return sass.compile(filename=str(CV_SCSS), output_style="expanded")


def _build_document(body: str, css: str) -> str:
    return f"""<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>CV — Boukary Ouedraogo</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="{GOOGLE_FONTS}" rel="stylesheet">
<style>
html, body {{
  margin: 0;
  padding: 0;
  background: #ffffff;
  font-family: 'Raleway', -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
}}
.cv {{
  margin: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  max-width: none !important;
  width: 210mm !important;
}}
.cv-fab {{ display: none !important; }}
@page {{ size: A4; margin: 0; }}
{css}
</style>
</head>
<body>
{body}
</body>
</html>
"""


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    body = _extract_cv_body(CV_HTML.read_text(encoding="utf-8"))
    css = _compile_css()
    doc = _build_document(body, css)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={"width": 1240, "height": 1754})
        page = context.new_page()
        page.set_content(doc, wait_until="networkidle")
        page.evaluate("document.fonts.ready")
        page.emulate_media(media="screen")
        page.pdf(
            path=str(OUTPUT),
            format="A4",
            print_background=True,
            prefer_css_page_size=True,
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
        )
        browser.close()

    size_kb = OUTPUT.stat().st_size / 1024
    print(f"[generate_cv_pdf] {OUTPUT.relative_to(ROOT)}  ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
