#!/usr/bin/env python3
"""
Konvertiert WordPress/Elementor Blog-Posts zum neuen Clean Design.
Extrahiert Titel, Beschreibung, Inhalt und generiert sauberes HTML.
"""

import os
import re
from html import unescape
from pathlib import Path

# Blog-Posts mit Kategorien (aus blog.html)
BLOG_POSTS = {
    "angst-achtsamkeit-und-frieden.html": {"category": "Achtsamkeit", "image": "wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg"},
    "mit-allen-sinnen-achtsamkeit.html": {"category": "Achtsamkeit", "image": "wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg"},
    "sonnenuntergang-in-grignan.html": {"category": "Achtsamkeit", "image": "wp-content/uploads/2020/10/Mirmande-Photographe-Kathrin-Stahl-Photographer-3.jpg"},
    "stille_heilung.html": {"category": "Achtsamkeit", "image": "wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg"},
    "qarrtsiluni-neues-entsteht-in-der-stille.html": {"category": "Achtsamkeit", "image": "wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg"},
    "freude-als-wegweiser.html": {"category": "Achtsamkeit", "image": "wp-content/uploads/2020/10/Mirmande-Photographe-Kathrin-Stahl-Photographer-3.jpg"},
    "dankbarkeit.html": {"category": "Selbstliebe", "image": "wp-content/uploads/2021/04/Me-ich-Kathrin-Hogaza-1060x1042.jpg"},
    "deine-einzigartigkeit.html": {"category": "Selbstliebe", "image": "wp-content/uploads/2024/05/hochbegabt-hochsensibel-550x550.jpg"},
    "ueber-fehler-und-deinen-selbstwert.html": {"category": "Selbstliebe", "image": "wp-content/uploads/2021/04/Me-ich-Kathrin-Hogaza-1060x1042.jpg"},
    "verlass-dich-nicht.html": {"category": "Selbstliebe", "image": "wp-content/uploads/2021/04/Me-ich-Kathrin-Hogaza-1060x1042.jpg"},
    "wer-bist-du-wenn-du-niemand-sein-musst.html": {"category": "Selbstliebe", "image": "wp-content/uploads/2024/05/hochbegabt-hochsensibel-550x550.jpg"},
    "wie-du-gesunde-grenzen-setzen-kannst-ohne-schlechtes-gewissen.html": {"category": "Selbstliebe", "image": "wp-content/uploads/2021/04/Me-ich-Kathrin-Hogaza-1060x1042.jpg"},
    "es-ist-okay.html": {"category": "Selbstliebe", "image": "wp-content/uploads/2021/04/Me-ich-Kathrin-Hogaza-1060x1042.jpg"},
    "selbstvergessen.html": {"category": "Selbstliebe", "image": "wp-content/uploads/2021/04/Me-ich-Kathrin-Hogaza-1060x1042.jpg"},
    "beziehungsprobleme.html": {"category": "Beziehung", "image": "wp-content/uploads/2025/05/Paartherapie-Beziehungskrise-Neubeginn-550x550.jpg"},
    "ehe-retten.html": {"category": "Beziehung", "image": "wp-content/uploads/2025/05/Paartherapie-Beziehungskrise-Neubeginn-550x550.jpg"},
    "gehen-oder-bleiben.html": {"category": "Beziehung", "image": "wp-content/uploads/2025/05/Paartherapie-Beziehungskrise-Neubeginn-550x550.jpg"},
    "love-letters.html": {"category": "Beziehung", "image": "wp-content/uploads/2025/05/Paartherapie-Beziehungskrise-Neubeginn-550x550.jpg"},
    "gemeinsam-jammern.html": {"category": "Beziehung", "image": "wp-content/uploads/2025/05/Paartherapie-Beziehungskrise-Neubeginn-550x550.jpg"},
    "gib-deinem-leben-deinen-sinn-eine-heldinnenreise.html": {"category": "Heldinnenreise", "image": "wp-content/uploads/2025/05/Neuanfang-Umbruchphase-1024x1024.jpg"},
    "herzenswunsch-folge-deiner-sehnsucht.html": {"category": "Heldinnenreise", "image": "wp-content/uploads/2020/10/Mirmande-Photographe-Kathrin-Stahl-Photographer-3.jpg"},
    "leben-planen.html": {"category": "Heldinnenreise", "image": "wp-content/uploads/2025/05/Neuanfang-Umbruchphase-1024x1024.jpg"},
    "ueber-gewohnheiten-und-das-verlassen-der-komfortzone.html": {"category": "Heldinnenreise", "image": "wp-content/uploads/2025/05/Neuanfang-Umbruchphase-1024x1024.jpg"},
    "freiheit-ist-niemals-groesser-als-der-kopf-der-sie-denkt.html": {"category": "Heldinnenreise", "image": "wp-content/uploads/2025/05/Neuanfang-Umbruchphase-1024x1024.jpg"},
    "was-ist-wirklich-wichtig.html": {"category": "Heldinnenreise", "image": "wp-content/uploads/2020/10/Mirmande-Photographe-Kathrin-Stahl-Photographer-3.jpg"},
    "wie-fuehlt-sich-ein-erfuelltes-leben-an.html": {"category": "Heldinnenreise", "image": "wp-content/uploads/2020/10/Mirmande-Photographe-Kathrin-Stahl-Photographer-3.jpg"},
    "wo-ich-bin-will-ich-ganz-sein.html": {"category": "Heldinnenreise", "image": "wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg"},
    "wunschlos-gluecklich-schade-eigentlich.html": {"category": "Heldinnenreise", "image": "wp-content/uploads/2020/10/Mirmande-Photographe-Kathrin-Stahl-Photographer-3.jpg"},
    "endlich-innerer-frieden.html": {"category": "Heldinnenreise", "image": "wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg"},
    "deine-vision-noch-schoner-mit-einem-vision-board.html": {"category": "Heldinnenreise", "image": "wp-content/uploads/2020/10/Mirmande-Photographe-Kathrin-Stahl-Photographer-3.jpg"},
    "mein-suedfrankreich-happymefree.html": {"category": "Heldinnenreise", "image": "wp-content/uploads/2020/10/Mirmande-Photographe-Kathrin-Stahl-Photographer-3.jpg"},
    "letzte-male-abschied.html": {"category": "Heldinnenreise", "image": "wp-content/uploads/2020/10/Mirmande-Photographe-Kathrin-Stahl-Photographer-3.jpg"},
    "hochbegabung-hochsensibilitat.html": {"category": "Hochbegabung", "image": "wp-content/uploads/2024/05/hochbegabt-hochsensibel-550x550.jpg"},
    "das-geschenk-deiner-wut.html": {"category": "Körper & Heilung", "image": "wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg"},
    "die-angst-vor-deiner-power.html": {"category": "Körper & Heilung", "image": "wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg"},
    "gedankenkarussell.html": {"category": "Körper & Heilung", "image": "wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg"},
    "glaubenssatzarbeit-hilfe-annehmen.html": {"category": "Körper & Heilung", "image": "wp-content/uploads/2022/07/Coaching-Pferde-Hamburg-KathrinStahl-17-550x550.jpg"},
    "glaubenssatzarbeit-pferdegestuetztescoaching.html": {"category": "Körper & Heilung", "image": "wp-content/uploads/2022/07/Coaching-Pferde-Hamburg-KathrinStahl-17-550x550.jpg"},
    "innere-fuehrung.html": {"category": "Körper & Heilung", "image": "wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg"},
    "klossgefuehl-im-hals-wie-eine-aufstellung-hilft.html": {"category": "Körper & Heilung", "image": "wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg"},
    "nackenschmerzen-symptome-als-wegweiser.html": {"category": "Körper & Heilung", "image": "wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg"},
    "wen-ziehst-du-hinter-dir-her.html": {"category": "Körper & Heilung", "image": "wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg"},
    "wie-du-achtsam-mit-deinen-gefuehlen-umgehen-kannst-und-dabei-jede-menge-ueber-dich-erfaehrst.html": {"category": "Körper & Heilung", "image": "wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg"},
    "die-liebe-der-pferde.html": {"category": "Körper & Heilung", "image": "wp-content/uploads/2022/07/Coaching-Pferde-Hamburg-KathrinStahl-17-550x550.jpg"},
    "mit-pferden-sein-und-heilen.html": {"category": "Körper & Heilung", "image": "wp-content/uploads/2022/07/Coaching-Pferde-Hamburg-KathrinStahl-17-550x550.jpg"},
}

def extract_title(html):
    """Extrahiert den Titel aus dem HTML."""
    # Versuche meta og:title
    match = re.search(r'<meta\s+property="og:title"\s+content="([^"]+)"', html)
    if match:
        title = match.group(1)
        # Entferne " - KATHRIN STAHL" Suffix
        title = re.sub(r'\s*[-–]\s*KATHRIN STAHL.*$', '', title)
        return unescape(title.strip())

    # Fallback: <title> Tag
    match = re.search(r'<title>([^<]+)</title>', html)
    if match:
        title = match.group(1)
        title = re.sub(r'\s*[-–]\s*KATHRIN STAHL.*$', '', title)
        return unescape(title.strip())

    return "Untitled"

def extract_description(html):
    """Extrahiert die Beschreibung aus dem HTML."""
    match = re.search(r'<meta\s+name="description"\s+content="([^"]+)"', html)
    if match:
        return unescape(match.group(1).strip())

    match = re.search(r'<meta\s+property="og:description"\s+content="([^"]+)"', html)
    if match:
        return unescape(match.group(1).strip())

    return ""

def extract_content(html):
    """Extrahiert den Hauptinhalt aus WordPress/Elementor HTML."""
    content_parts = []

    # Entferne Script und Style Tags
    html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL | re.IGNORECASE)

    # Finde Elementor Text-Editor Widgets (Hauptinhalt)
    text_widgets = re.findall(
        r'<div class="elementor-widget-container">\s*(.*?)\s*</div>\s*</div>',
        html, flags=re.DOTALL
    )

    for widget in text_widgets:
        # Bereinige den Inhalt
        text = widget.strip()
        if not text or len(text) < 50:
            continue

        # Entferne Elementor-spezifische Wrapper
        text = re.sub(r'<div[^>]*class="[^"]*elementor[^"]*"[^>]*>', '', text)
        text = re.sub(r'</div>', '', text)

        # Behalte nur sinnvolle HTML-Tags
        # Entferne inline styles aber behalte Tags
        text = re.sub(r'\s*style="[^"]*"', '', text)
        text = re.sub(r'\s*class="[^"]*"', '', text)
        text = re.sub(r'\s*data-[a-z-]+="[^"]*"', '', text)

        # Konvertiere span mit bold zu strong
        text = re.sub(r'<span[^>]*font-weight:\s*bold[^>]*>(.*?)</span>', r'<strong>\1</strong>', text, flags=re.DOTALL)
        text = re.sub(r'<b>(.*?)</b>', r'<strong>\1</strong>', text, flags=re.DOTALL)

        # Entferne leere Tags
        text = re.sub(r'<span[^>]*>\s*</span>', '', text)
        text = re.sub(r'<p>\s*</p>', '', text)
        text = re.sub(r'<h[1-6]>\s*</h[1-6]>', '', text)

        # Bereinige mehrfache Leerzeichen/Newlines
        text = re.sub(r'\n\s*\n', '\n\n', text)
        text = re.sub(r'  +', ' ', text)

        if len(text.strip()) > 100:
            content_parts.append(text.strip())

    # Fallback: Suche nach article oder main content
    if not content_parts:
        match = re.search(r'<article[^>]*>(.*?)</article>', html, flags=re.DOTALL)
        if match:
            content_parts.append(match.group(1))

    return '\n\n'.join(content_parts)

def clean_content(content):
    """Bereinigt extrahierten Content für sauberes HTML."""
    # Entferne Farb-Styles
    content = re.sub(r'<span[^>]*color:[^>]*>(.*?)</span>', r'\1', content, flags=re.DOTALL)

    # Konvertiere h1 in Inhalt zu h2 (h1 ist für Titel reserviert)
    content = re.sub(r'<h1[^>]*>(.*?)</h1>', r'<h2>\1</h2>', content, flags=re.DOTALL)

    # Entferne &nbsp;
    content = content.replace('&nbsp;', ' ')
    content = content.replace('\xa0', ' ')

    # Entferne leere Paragraphen
    content = re.sub(r'<p>\s*</p>', '', content)
    content = re.sub(r'<p>\s*<br\s*/?>\s*</p>', '', content)

    # Bereinige Whitespace
    content = re.sub(r'\n{3,}', '\n\n', content)

    # HTML-Entities dekodieren
    content = unescape(content)

    return content.strip()

def estimate_read_time(content):
    """Schätzt die Lesezeit basierend auf Wortanzahl."""
    # Entferne HTML-Tags für Wortzählung
    text = re.sub(r'<[^>]+>', '', content)
    words = len(text.split())
    minutes = max(1, round(words / 200))  # 200 Wörter pro Minute
    return minutes

def generate_new_html(filename, title, description, content, category, image):
    """Generiert das neue saubere HTML."""
    read_time = estimate_read_time(content)

    template = f'''<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | Kathrin Stahl</title>
    <meta name="description" content="{description}">
    <link rel="canonical" href="https://nickheymann.github.io/kathrin-coaching/{filename}">
    <meta property="og:title" content="{title} | Kathrin Stahl">
    <meta property="og:description" content="{description}">
    <meta property="og:type" content="article">
    <meta property="og:image" content="https://nickheymann.github.io/kathrin-coaching/{image}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        *,*::before,*::after{{box-sizing:border-box;margin:0;padding:0}}
        :root{{--color-primary:#2C4A47;--color-primary-light:#3D6B66;--color-accent:#C4A962;--color-cream:#FAF8F5;--color-white:#FFFFFF;--color-text:#2D2D2D;--color-text-light:#5A5A5A;--font-heading:'Cormorant Garamond',Georgia,serif;--font-body:'Montserrat',-apple-system,sans-serif}}
        html{{scroll-behavior:smooth}}
        body{{font-family:var(--font-body);font-size:16px;line-height:1.8;color:var(--color-text);background:var(--color-white)}}
        img{{max-width:100%;height:auto;display:block}}
        a{{color:var(--color-primary);text-decoration:none}}
        a:hover{{text-decoration:underline}}
        h1,h2,h3{{font-family:var(--font-heading);font-weight:500;color:var(--color-primary);line-height:1.3}}
        h1{{font-size:clamp(2rem,4vw,3rem);margin-bottom:1.5rem}}
        h2{{font-size:clamp(1.5rem,3vw,2rem);margin:2.5rem 0 1rem}}
        h3{{font-size:clamp(1.25rem,2.5vw,1.5rem);margin:2rem 0 .75rem}}
        p{{margin-bottom:1.5rem}}
        .container{{max-width:800px;margin:0 auto;padding:0 24px}}
        .container-wide{{max-width:1200px;margin:0 auto;padding:0 24px}}
        header{{position:fixed;top:0;left:0;right:0;z-index:1000;background:rgba(255,255,255,.95);backdrop-filter:blur(10px);border-bottom:1px solid rgba(0,0,0,.05)}}
        .header-inner{{display:flex;justify-content:space-between;align-items:center;height:80px;max-width:1200px;margin:0 auto;padding:0 24px}}
        .logo{{font-family:var(--font-heading);font-size:1.5rem;font-weight:500;color:var(--color-primary);text-decoration:none}}
        nav{{display:flex;align-items:center;gap:35px}}
        nav a{{font-size:.9rem;font-weight:500;color:var(--color-text);text-decoration:none}}
        nav a:hover{{color:var(--color-primary)}}
        .nav-cta{{background:var(--color-accent);color:white!important;padding:12px 24px;border-radius:4px}}
        .menu-toggle{{display:none;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer}}
        .menu-toggle span{{width:24px;height:2px;background:var(--color-primary)}}
        .article-hero{{padding:140px 0 60px;background:linear-gradient(135deg,var(--color-primary) 0%,var(--color-primary-light) 100%);text-align:center;color:white}}
        .article-hero h1{{color:white;max-width:800px;margin:0 auto 1rem}}
        .article-meta{{display:flex;justify-content:center;gap:20px;font-size:.9rem;opacity:.9;flex-wrap:wrap}}
        .article-category{{background:var(--color-accent);padding:5px 15px;border-radius:20px;font-size:.8rem;text-transform:uppercase;font-weight:600;margin-bottom:1rem;display:inline-block}}
        .featured-image{{margin:-40px auto 0;max-width:900px;padding:0 24px}}
        .featured-image img{{border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.15);width:100%}}
        .article-content{{padding:60px 0 80px}}
        .article-content p{{font-size:1.1rem}}
        .article-content blockquote{{border-left:4px solid var(--color-accent);padding-left:24px;margin:2rem 0;font-style:italic;color:var(--color-text-light);font-size:1.2rem}}
        .article-content ul,.article-content ol{{margin:1.5rem 0;padding-left:1.5rem}}
        .article-content li{{margin-bottom:.75rem;font-size:1.1rem}}
        .article-content strong{{color:var(--color-primary)}}
        .article-content em{{color:var(--color-text-light)}}
        .back-link{{padding:20px 0}}
        .back-link a{{display:inline-flex;align-items:center;gap:8px;color:var(--color-text-light);font-size:.9rem}}
        .back-link a:hover{{color:var(--color-primary)}}
        .cta-section{{background:var(--color-cream);padding:80px 0;text-align:center}}
        .cta-section h2{{margin-bottom:1rem}}
        .cta-section p{{max-width:600px;margin:0 auto 2rem;color:var(--color-text-light)}}
        .cta-btn{{display:inline-block;background:var(--color-primary);color:white;padding:16px 32px;border-radius:4px;font-weight:600;text-decoration:none}}
        .cta-btn:hover{{background:var(--color-primary-light);text-decoration:none}}
        footer{{background:var(--color-primary);color:white;padding:60px 0 30px}}
        .footer-content{{display:grid;grid-template-columns:2fr 1fr 1fr;gap:60px;margin-bottom:40px}}
        .footer-brand h3{{font-size:1.5rem;color:white;margin-bottom:1rem}}
        .footer-brand p{{opacity:.8}}
        .footer-links h4{{color:var(--color-accent);margin-bottom:1rem;font-family:var(--font-body);font-weight:600}}
        .footer-links ul{{list-style:none}}
        .footer-links li{{margin-bottom:.5rem}}
        .footer-links a{{color:white;opacity:.8}}
        .footer-bottom{{border-top:1px solid rgba(255,255,255,.1);padding-top:30px;text-align:center;font-size:.85rem;opacity:.7}}
        .footer-bottom a{{color:white}}
        @media(max-width:992px){{nav{{display:none}}nav.mobile-open{{display:flex;position:absolute;top:80px;left:0;right:0;flex-direction:column;background:white;padding:20px;box-shadow:0 10px 30px rgba(0,0,0,.1)}}nav.mobile-open a{{padding:15px 0;border-bottom:1px solid rgba(0,0,0,.05)}}.menu-toggle{{display:flex}}}}
        @media(max-width:768px){{.footer-content{{grid-template-columns:1fr;gap:40px}}}}
    </style>
</head>
<body>
    <header>
        <div class="header-inner">
            <a href="index.html" class="logo">Kathrin Stahl</a>
            <nav id="mainNav">
                <a href="index.html">Start</a>
                <a href="index.html#angebote">Angebote</a>
                <a href="kathrin.html">Über mich</a>
                <a href="blog.html">Blog</a>
                <a href="media.html">Videos</a>
                <a href="https://cal.com/kathrinstahl" target="_blank" class="nav-cta">Erstgespräch</a>
            </nav>
            <button class="menu-toggle" onclick="document.getElementById('mainNav').classList.toggle('mobile-open')">
                <span></span><span></span><span></span>
            </button>
        </div>
    </header>

    <section class="article-hero">
        <div class="container">
            <span class="article-category">{category}</span>
            <h1>{title}</h1>
            <div class="article-meta">
                <span>{read_time} Min. Lesezeit</span>
            </div>
        </div>
    </section>

    <div class="featured-image">
        <img src="{image}" alt="{title}">
    </div>

    <article class="article-content">
        <div class="container">
            <div class="back-link">
                <a href="blog.html">← Zurück zum Blog</a>
            </div>

            {content}
        </div>
    </article>

    <section class="cta-section">
        <div class="container">
            <h2>Bereit für den nächsten Schritt?</h2>
            <p>Lass uns in einem kostenlosen Erstgespräch herausfinden, wie ich dich auf deinem Weg begleiten kann.</p>
            <a href="https://cal.com/kathrinstahl" target="_blank" class="cta-btn">Kostenloses Erstgespräch buchen</a>
        </div>
    </section>

    <footer>
        <div class="container-wide">
            <div class="footer-content">
                <div class="footer-brand">
                    <h3>Kathrin Stahl</h3>
                    <p>Glück über Zweifel – Begleitung auf deinem Weg zu mehr Selbstliebe, Klarheit und einem Leben, das sich richtig anfühlt.</p>
                </div>
                <div class="footer-links">
                    <h4>Navigation</h4>
                    <ul>
                        <li><a href="index.html">Startseite</a></li>
                        <li><a href="blog.html">Blog</a></li>
                        <li><a href="kathrin.html">Über mich</a></li>
                        <li><a href="media.html">Videos</a></li>
                    </ul>
                </div>
                <div class="footer-links">
                    <h4>Kontakt</h4>
                    <ul>
                        <li>Portugal & Online</li>
                        <li><a href="https://cal.com/kathrinstahl">Termin buchen</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>© 2025 Kathrin Stahl | <a href="impressum.html">Impressum</a> | <a href="datenschutzerklaerung.html">Datenschutz</a></p>
            </div>
        </div>
    </footer>
</body>
</html>'''

    return template

def convert_post(filepath, info):
    """Konvertiert einen einzelnen Blog-Post."""
    filename = os.path.basename(filepath)

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            html = f.read()
    except Exception as e:
        print(f"  ✗ Fehler beim Lesen: {e}")
        return False

    # Prüfe ob bereits konvertiert (neues Design hat kein "elementor")
    if 'elementor' not in html.lower() and 'article-hero' in html:
        print(f"  ✓ Bereits konvertiert")
        return True

    title = extract_title(html)
    description = extract_description(html)
    content = extract_content(html)
    content = clean_content(content)

    if not content or len(content) < 200:
        print(f"  ✗ Zu wenig Inhalt extrahiert ({len(content)} Zeichen)")
        return False

    new_html = generate_new_html(
        filename=filename,
        title=title,
        description=description,
        content=content,
        category=info['category'],
        image=info['image']
    )

    # Backup erstellen
    backup_dir = Path(filepath).parent / '_archive' / 'old-blog-posts'
    backup_dir.mkdir(parents=True, exist_ok=True)
    backup_path = backup_dir / filename

    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(html)

    # Neue Version speichern
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_html)

    print(f"  ✓ Konvertiert ({len(content)} Zeichen, {estimate_read_time(content)} Min.)")
    return True

def main():
    """Hauptfunktion."""
    base_dir = Path(__file__).parent.parent

    print("Blog-Post Konvertierung")
    print("=" * 50)

    success = 0
    failed = 0
    skipped = 0

    for filename, info in BLOG_POSTS.items():
        filepath = base_dir / filename
        print(f"\n{filename}:")

        if not filepath.exists():
            print(f"  ✗ Datei nicht gefunden")
            failed += 1
            continue

        if convert_post(filepath, info):
            success += 1
        else:
            failed += 1

    print("\n" + "=" * 50)
    print(f"Ergebnis: {success} konvertiert, {failed} fehlgeschlagen")

if __name__ == "__main__":
    main()
