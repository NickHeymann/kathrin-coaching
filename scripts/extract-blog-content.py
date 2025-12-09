#!/usr/bin/env python3
"""
Content Extraction Script - Phase 1
Extrahiert strukturierte Daten aus allen Blog-Posts

Verwendung:
    python scripts/extract-blog-content.py

Output:
    data/blog-content-raw.json
"""

import os
import json
import re
from pathlib import Path
from bs4 import BeautifulSoup
from datetime import datetime

# Konfiguration
PROJECT_ROOT = Path(__file__).parent.parent
HTML_DIR = PROJECT_ROOT
OUTPUT_FILE = PROJECT_ROOT / "data" / "blog-content-raw.json"

# Seiten die KEINE Blog-Posts sind
EXCLUDE_FILES = {
    'index.html', 'blog.html', 'media.html', 'kathrin.html',
    '404.html', 'contact.html', 'kontakt.html', 'impressum.html',
    'datenschutzerklaerung.html', 'datenschutz.html',
    'ANLEITUNG-EDITOR.html', 'blog-editor.html', 'cms-editor.html',
    'blog-neu.html', 'new-index.html', 'new-navigation.html',
    'studio.html', 'investition.html', 'fuer-wen.html'
}

# Seiten die spezielle Kategorien sind (keine normalen Blog-Posts)
SPECIAL_CATEGORIES = {
    'quiz-': 'quiz',
    'podcast-': 'podcast',
    'retreat': 'retreat',
    'ausbildung': 'angebot',
    'einzelbegleitung': 'angebot',
    'paarbegleitung': 'angebot',
    'gruppenretreats': 'angebot',
    'pferdegestuetztes-coaching': 'angebot'
}


def clean_text(text):
    """Bereinigt Text von überflüssigen Whitespaces"""
    if not text:
        return ""
    # Mehrfache Whitespaces zu einem
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def extract_article_content(soup):
    """Extrahiert den Hauptinhalt des Artikels"""
    # Versuche verschiedene Content-Container
    content_selectors = [
        '.article-content',
        'article',
        '.entry-content',
        '.post-content'
    ]

    for selector in content_selectors:
        content_el = soup.select_one(selector)
        if content_el:
            # Entferne Skripte, Styles und Navigation
            for tag in content_el.find_all(['script', 'style', 'nav', '.back-link', '.author-bio']):
                tag.decompose()
            return clean_text(content_el.get_text())

    return ""


def extract_blockquotes(soup):
    """Extrahiert alle Blockquotes (wichtige Aussagen)"""
    blockquotes = []
    for bq in soup.select('blockquote'):
        text = clean_text(bq.get_text())
        if text and len(text) > 10:
            blockquotes.append(text)
    return blockquotes


def extract_headings(soup):
    """Extrahiert alle Zwischenüberschriften"""
    headings = []
    for heading in soup.select('h2, h3, h4'):
        text = clean_text(heading.get_text())
        if text and len(text) > 3:
            headings.append({
                'level': heading.name,
                'text': text
            })
    return headings


def extract_internal_links(soup, current_file):
    """Extrahiert alle internen Links zu anderen Blog-Posts"""
    links = []
    for a in soup.select('a[href]'):
        href = a.get('href', '')
        # Nur interne .html Links (keine externen, keine Anker)
        if href.endswith('.html') and not href.startswith('http') and not href.startswith('#'):
            # Normalisiere den Pfad
            href = href.split('/')[-1]  # Nur Dateiname
            if href != current_file and href not in EXCLUDE_FILES:
                link_text = clean_text(a.get_text())
                if href not in [l['url'] for l in links]:  # Keine Duplikate
                    links.append({
                        'url': href,
                        'text': link_text
                    })
    return links


def extract_image(soup):
    """Extrahiert das Hauptbild des Artikels"""
    # Featured Image
    featured = soup.select_one('.featured-image img')
    if featured and featured.get('src'):
        return featured.get('src')

    # OG Image
    og_image = soup.select_one('meta[property="og:image"]')
    if og_image and og_image.get('content'):
        content = og_image.get('content')
        # Konvertiere absolute URL zu relativer
        if 'wp-content' in content:
            return 'wp-content' + content.split('wp-content')[-1]
        return content

    # Erstes Bild im Artikel
    first_img = soup.select_one('.article-content img, article img')
    if first_img and first_img.get('src'):
        return first_img.get('src')

    return ""


def extract_category(soup, filename):
    """Extrahiert die Kategorie des Artikels"""
    # Aus dem HTML
    cat_el = soup.select_one('.article-category')
    if cat_el:
        return clean_text(cat_el.get_text()).lower()

    # Aus dem Dateinamen (Spezielle Kategorien)
    for prefix, category in SPECIAL_CATEGORIES.items():
        if filename.startswith(prefix) or prefix in filename:
            return category

    return "allgemein"


def extract_title(soup):
    """Extrahiert den Titel des Artikels"""
    # H1 im Hero
    h1 = soup.select_one('.article-hero h1, h1')
    if h1:
        return clean_text(h1.get_text())

    # Title Tag
    title = soup.select_one('title')
    if title:
        text = clean_text(title.get_text())
        # Entferne " | Kathrin Stahl" suffix
        return text.split('|')[0].strip()

    return ""


def extract_excerpt(soup):
    """Extrahiert einen Excerpt (erste 2-3 Sätze)"""
    content_el = soup.select_one('.article-content')
    if not content_el:
        return ""

    # Erste Paragraphen
    paragraphs = content_el.select('p')
    text = ""
    for p in paragraphs[:3]:
        p_text = clean_text(p.get_text())
        if p_text and len(p_text) > 20:
            text += p_text + " "
            if len(text) > 200:
                break

    # Kürze auf ca. 200 Zeichen
    if len(text) > 250:
        text = text[:247] + "..."

    return text.strip()


def detect_special_type(filename, soup):
    """Erkennt spezielle Artikeltypen"""
    filename_lower = filename.lower()

    if filename_lower.startswith('podcast-') or 'podcast' in filename_lower:
        return 'podcast'
    if 'retreat' in filename_lower:
        return 'retreat'
    if filename_lower.startswith('quiz-'):
        return 'quiz'
    if any(x in filename_lower for x in ['ausbildung', 'einzelbegleitung', 'paarbegleitung', 'gruppenretreat']):
        return 'angebot'

    return 'blog'


def process_html_file(filepath):
    """Verarbeitet eine einzelne HTML-Datei"""
    filename = filepath.name

    # Überspringe Nicht-Blog-Dateien
    if filename in EXCLUDE_FILES:
        return None

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            html = f.read()

        soup = BeautifulSoup(html, 'html.parser')

        # Extrahiere alle Daten
        title = extract_title(soup)
        content = extract_article_content(soup)

        # Überspringe leere oder sehr kurze Seiten
        if not title or len(content) < 100:
            print(f"  ⚠️  Übersprungen (zu kurz): {filename}")
            return None

        article = {
            'url': filename,
            'title': title,
            'type': detect_special_type(filename, soup),
            'category': extract_category(soup, filename),
            'image': extract_image(soup),
            'excerpt': extract_excerpt(soup),
            'content': content,
            'wordCount': len(content.split()),
            'blockquotes': extract_blockquotes(soup),
            'headings': extract_headings(soup),
            'internalLinks': extract_internal_links(soup, filename)
        }

        return article

    except Exception as e:
        print(f"  ❌ Fehler bei {filename}: {e}")
        return None


def main():
    print("=" * 60)
    print("CONTENT EXTRACTION - Phase 1")
    print("=" * 60)
    print()

    # Erstelle Output-Verzeichnis
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    # Finde alle HTML-Dateien
    html_files = list(HTML_DIR.glob('*.html'))
    print(f"📁 Gefunden: {len(html_files)} HTML-Dateien")
    print()

    # Verarbeite jede Datei
    articles = []
    stats = {
        'total': 0,
        'blog': 0,
        'podcast': 0,
        'retreat': 0,
        'angebot': 0,
        'quiz': 0,
        'skipped': 0
    }

    for filepath in sorted(html_files):
        article = process_html_file(filepath)
        if article:
            articles.append(article)
            stats['total'] += 1
            stats[article['type']] = stats.get(article['type'], 0) + 1
            print(f"  ✓ {article['url'][:40]:<40} [{article['type']}]")
        else:
            stats['skipped'] += 1

    print()
    print("-" * 60)
    print("STATISTIKEN")
    print("-" * 60)
    print(f"  Gesamt extrahiert:  {stats['total']}")
    print(f"  - Blog-Posts:       {stats['blog']}")
    print(f"  - Podcasts:         {stats['podcast']}")
    print(f"  - Retreats:         {stats['retreat']}")
    print(f"  - Angebote:         {stats['angebot']}")
    print(f"  - Quizze:           {stats['quiz']}")
    print(f"  Übersprungen:       {stats['skipped']}")
    print()

    # Speichere Ergebnis
    output_data = {
        'extractedAt': datetime.now().isoformat(),
        'totalArticles': len(articles),
        'articles': articles
    }

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"💾 Gespeichert: {OUTPUT_FILE}")
    print()
    print("✅ Phase 1 abgeschlossen!")
    print("   Nächster Schritt: python scripts/analyze-with-llm.py")


if __name__ == '__main__':
    main()
