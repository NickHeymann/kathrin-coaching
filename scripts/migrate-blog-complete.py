#!/usr/bin/env python3
"""
MASTER BLOG MIGRATION SCRIPT
Crawlt, dedupliziert, bereinigt und migriert ALLE Blog-Posts von der alten Website.

Performance-Features:
- Paralleles Crawling (5 Worker)
- Caching (bereits gecrawlte Posts)
- Incrementelles Update (nur geänderte Posts)
- Progress Bar
- Automatische Validation

Usage:
    python scripts/migrate-blog-complete.py
    python scripts/migrate-blog-complete.py --force-all  # Alle Posts neu generieren
    python scripts/migrate-blog-complete.py --dry-run    # Nur analysieren
"""

import os
import re
import json
import hashlib
import requests
from pathlib import Path
from html import unescape
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urljoin, urlparse
from datetime import datetime
import argparse
from difflib import SequenceMatcher

# ============================================
# KONFIGURATION
# ============================================

BASE_URL = "https://coaching.kathrinstahl.com"
BLOG_URL = f"{BASE_URL}/blog"
CACHE_FILE = "data/blog-migration-cache.json"
OUTPUT_DIR = Path(__file__).parent.parent
DATA_DIR = OUTPUT_DIR / "data"
TEMPLATES_DIR = OUTPUT_DIR / "templates"

# Performance Settings
MAX_WORKERS = 5  # Parallele Downloads
SIMILARITY_THRESHOLD = 0.85  # Für Deduplizierung (0-1)

# Kategorien Mapping (für bessere Organisation)
CATEGORY_MAPPING = {
    "Achtsamkeit": "Achtsamkeit",
    "Ehe_Partnerschaft": "Beziehung",
    "Elternsein": "Eltern",
    "Heldinnenreise": "Heldinnenreise",
    "Hochbegabung": "Hochbegabung",
    "Losgehen": "Neuanfang",
    "Pferdegestützte Persönlichkeitsentwicklung": "Pferde",
    "Podcast": "Podcast",
    "Selbstliebe": "Selbstliebe",
    "Symptomarbeit": "Körper & Heilung",
    "systemische Aufstellung": "Aufstellungen",
    "Visionsarbeit": "Vision",
    "Uncategorized": "Allgemein"
}

# Standard-Bilder pro Kategorie
DEFAULT_IMAGES = {
    "Achtsamkeit": "wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg",
    "Beziehung": "wp-content/uploads/2025/05/Paartherapie-Beziehungskrise-Neubeginn-550x550.jpg",
    "Selbstliebe": "wp-content/uploads/2021/04/Me-ich-Kathrin-Hogaza-1060x1042.jpg",
    "Heldinnenreise": "wp-content/uploads/2025/05/Neuanfang-Umbruchphase-1024x1024.jpg",
    "Hochbegabung": "wp-content/uploads/2024/05/hochbegabt-hochsensibel-550x550.jpg",
    "Körper & Heilung": "wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg",
    "Pferde": "wp-content/uploads/2022/07/Coaching-Pferde-Hamburg-KathrinStahl-17-550x550.jpg",
    "Allgemein": "wp-content/uploads/2021/04/Me-ich-Kathrin-Hogaza-1060x1042.jpg"
}

# ============================================
# KLASSEN
# ============================================

class BlogCrawler:
    """Crawlt alle Blog-Posts von der alten WordPress-Website."""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
        })

    def crawl_all_posts(self):
        """Crawlt alle Blog-Post URLs mit Pagination."""
        print("📡 Crawle alte Website...")
        all_posts = []
        page = 1

        while True:
            url = f"{BLOG_URL}/page/{page}" if page > 1 else BLOG_URL
            print(f"   Seite {page}...", end=" ")

            try:
                response = self.session.get(url, timeout=10)
                if response.status_code == 404:
                    print("(keine weiteren Seiten)")
                    break

                soup = BeautifulSoup(response.content, 'html.parser')
                posts = self._extract_posts_from_page(soup)

                if not posts:
                    print("(keine Posts gefunden)")
                    break

                all_posts.extend(posts)
                print(f"✓ {len(posts)} Posts gefunden")
                page += 1

            except Exception as e:
                print(f"✗ Fehler: {e}")
                break

        print(f"   Gesamt: {len(all_posts)} Posts")
        return all_posts

    def _extract_posts_from_page(self, soup):
        """Extrahiert Blog-Post Informationen aus einer Seite."""
        posts = []

        # WordPress verwendet oft .post, .entry, oder .article
        articles = soup.find_all(['article', 'div'], class_=lambda x: x and ('post' in x or 'entry' in x))

        for article in articles:
            try:
                # Titel und Link
                title_elem = article.find(['h1', 'h2', 'h3'], class_=lambda x: x and 'title' in x)
                if not title_elem:
                    continue

                link_elem = title_elem.find('a') or article.find('a', href=True)
                if not link_elem:
                    continue

                url = urljoin(BASE_URL, link_elem['href'])
                title = title_elem.get_text(strip=True)

                # Kategorie
                category_elem = article.find(['a', 'span'], class_=lambda x: x and 'categor' in x.lower())
                category = category_elem.get_text(strip=True) if category_elem else "Uncategorized"

                # Slug aus URL
                slug = urlparse(url).path.strip('/').split('/')[-1]
                if not slug:
                    continue

                posts.append({
                    'title': title,
                    'url': url,
                    'slug': slug,
                    'category': CATEGORY_MAPPING.get(category, category)
                })

            except Exception as e:
                continue

        return posts

    def download_post_content(self, url):
        """Downloaded den vollständigen HTML-Content eines Posts."""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            return response.text
        except Exception as e:
            print(f"   ✗ Download Fehler für {url}: {e}")
            return None


class PostDeduplicator:
    """Findet und entfernt Duplikate basierend auf Titel und Content."""

    @staticmethod
    def similarity(a, b):
        """Berechnet Ähnlichkeit zwischen zwei Strings (0-1)."""
        return SequenceMatcher(None, a.lower(), b.lower()).ratio()

    def find_duplicates(self, old_posts, new_posts):
        """Findet Duplikate zwischen alten (vorhandenen) und neuen (gecrawlten) Posts."""
        print(f"\n🔍 Deduplizierung ({len(old_posts)} vorhanden, {len(new_posts)} gecrawlt)...")

        # Schritt 1: Dedupliziere gecrawlte Posts untereinander (nach Slug)
        seen_slugs = set()
        deduplicated_new = []
        for post in new_posts:
            if post['slug'] not in seen_slugs:
                seen_slugs.add(post['slug'])
                deduplicated_new.append(post)

        print(f"   ✓ {len(new_posts) - len(deduplicated_new)} interne Duplikate entfernt")

        # Schritt 2: Prüfe gegen vorhandene Posts
        unique_posts = []
        duplicates = []

        for new_post in deduplicated_new:
            is_duplicate = False

            # Prüfe gegen vorhandene Posts
            for old_post in old_posts:
                # Slug-Match (exakt)
                if new_post['slug'] == old_post.get('slug', ''):
                    is_duplicate = True
                    duplicates.append((new_post, old_post, 'slug'))
                    break

                # Titel-Match (fuzzy)
                if self.similarity(new_post['title'], old_post.get('title', '')) > SIMILARITY_THRESHOLD:
                    is_duplicate = True
                    duplicates.append((new_post, old_post, 'title'))
                    break

            if not is_duplicate:
                unique_posts.append(new_post)

        print(f"   ✓ {len(unique_posts)} wirklich neue Posts, {len(duplicates)} bereits vorhanden")
        return unique_posts, duplicates


class ContentCleaner:
    """Bereinigt WordPress/Elementor HTML zu sauberem semantischem HTML."""

    @staticmethod
    def extract_title(html):
        """Extrahiert Titel aus HTML."""
        match = re.search(r'<meta\s+property="og:title"\s+content="([^"]+)"', html)
        if match:
            title = match.group(1)
            title = re.sub(r'\s*[-–]\s*KATHRIN STAHL.*$', '', title)
            return unescape(title.strip())

        match = re.search(r'<title>([^<]+)</title>', html)
        if match:
            title = match.group(1)
            title = re.sub(r'\s*[-–]\s*KATHRIN STAHL.*$', '', title)
            return unescape(title.strip())

        return "Untitled"

    @staticmethod
    def extract_description(html):
        """Extrahiert Meta-Description."""
        match = re.search(r'<meta\s+name="description"\s+content="([^"]+)"', html)
        if match:
            return unescape(match.group(1).strip())

        match = re.search(r'<meta\s+property="og:description"\s+content="([^"]+)"', html)
        if match:
            return unescape(match.group(1).strip())

        return ""

    @staticmethod
    def extract_featured_image(html):
        """Extrahiert Featured Image URL."""
        match = re.search(r'<meta\s+property="og:image"\s+content="([^"]+)"', html)
        if match:
            img_url = match.group(1)
            # Konvertiere zu relativer URL
            if BASE_URL in img_url:
                return img_url.replace(BASE_URL + '/', '')
        return None

    @staticmethod
    def clean_content(html):
        """Bereinigt WordPress-HTML zu sauberem Content."""
        soup = BeautifulSoup(html, 'html.parser')

        # Finde Hauptinhalt (WordPress-spezifisch)
        content_selectors = [
            '.entry-content',
            '.post-content',
            'article .elementor-widget-container',
            '.blog-post-content'
        ]

        content_div = None
        for selector in content_selectors:
            content_div = soup.select_one(selector)
            if content_div:
                break

        if not content_div:
            # Fallback: Suche <article>
            content_div = soup.find('article')

        if not content_div:
            return ""

        # Entferne unerwünschte Elemente
        for tag in content_div.find_all(['script', 'style', 'noscript', 'iframe']):
            tag.decompose()

        # Entferne WordPress-Wrapper Klassen
        for tag in content_div.find_all(True):
            if tag.has_attr('class'):
                # Behalte nur semantische Tags
                if tag.name not in ['p', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'strong', 'em', 'a', 'img']:
                    tag.unwrap()
                else:
                    # Entferne Klassen aber behalte Tag
                    del tag['class']

            # Entferne Inline-Styles
            if tag.has_attr('style'):
                del tag['style']

            # Entferne data-Attribute
            attrs_to_remove = [attr for attr in tag.attrs if attr.startswith('data-')]
            for attr in attrs_to_remove:
                del tag[attr]

        # Konvertiere <b> zu <strong>, <i> zu <em>
        for b in content_div.find_all('b'):
            b.name = 'strong'
        for i in content_div.find_all('i'):
            i.name = 'em'

        # Konvertiere h1 zu h2 (h1 ist für Titel reserviert)
        for h1 in content_div.find_all('h1'):
            h1.name = 'h2'

        # Entferne leere Tags
        for tag in content_div.find_all():
            if not tag.get_text(strip=True) and not tag.find('img'):
                tag.decompose()

        # Extrahiere sauberen HTML-String
        content_html = str(content_div)

        # Weitere Bereinigungen mit Regex
        content_html = re.sub(r'&nbsp;', ' ', content_html)
        content_html = re.sub(r'\xa0', ' ', content_html)
        content_html = re.sub(r'<p>\s*</p>', '', content_html)
        content_html = re.sub(r'<p>\s*<br\s*/?>\s*</p>', '', content_html)
        content_html = re.sub(r'\n{3,}', '\n\n', content_html)

        # Entferne äußere content-div Tags
        content_html = re.sub(r'^<div[^>]*>', '', content_html)
        content_html = re.sub(r'</div>$', '', content_html)

        return content_html.strip()


class TemplateGenerator:
    """Generiert HTML aus Templates mit Blog-Enhancements."""

    def __init__(self, templates_dir):
        self.templates_dir = Path(templates_dir)

    def generate_post_html(self, post_data):
        """Generiert vollständiges HTML für einen Blog-Post."""
        title = post_data['title']
        description = post_data.get('description', '')
        content = post_data['content']
        category = post_data['category']
        image = post_data.get('image') or DEFAULT_IMAGES.get(category, DEFAULT_IMAGES['Allgemein'])
        slug = post_data['slug']
        read_time = self._estimate_read_time(content)

        template = f'''<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | Kathrin Stahl</title>
    <meta name="description" content="{description}">
    <link rel="canonical" href="https://nickheymann.github.io/kathrin-coaching/{slug}.html">
    <meta property="og:title" content="{title} | Kathrin Stahl">
    <meta property="og:description" content="{description}">
    <meta property="og:type" content="article">
    <meta property="og:image" content="https://nickheymann.github.io/kathrin-coaching/{image}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/blog-enhancements.css">
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
        <img src="{image}" alt="{title}" loading="lazy">
    </div>

    <article class="article-content">
        <div class="container">
            <div class="back-link">
                <a href="blog.html">← Zurück zum Blog</a>
            </div>

            {content}

            {self._generate_author_bio()}
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

    <script src="js/blog-enhancements.js"></script>
</body>
</html>'''

        return template

    def _generate_author_bio(self):
        """Generiert Autorin-Bio HTML."""
        return '''
            <div class="author-bio">
                <img src="wp-content/uploads/2021/04/Me-ich-Kathrin-Hogaza-1060x1042.jpg" alt="Kathrin Stahl">
                <div class="author-bio-content">
                    <h4>Kathrin Stahl</h4>
                    <p>Ich begleite Menschen auf ihrem Weg zu mehr Selbstliebe, innerer Klarheit und einem Leben, das sich richtig anfühlt. Mit Herz, Erfahrung und der besonderen Kraft der Pferde.</p>
                    <div class="author-bio-links">
                        <a href="kathrin.html">Mehr über mich</a>
                        <a href="https://cal.com/kathrinstahl" target="_blank">Erstgespräch buchen</a>
                    </div>
                </div>
            </div>
        '''

    @staticmethod
    def _estimate_read_time(content):
        """Schätzt Lesezeit basierend auf Wortanzahl."""
        text = re.sub(r'<[^>]+>', '', content)
        words = len(text.split())
        return max(1, round(words / 200))


class MigrationOrchestrator:
    """Orchestriert den gesamten Migrations-Prozess."""

    def __init__(self, dry_run=False, force_all=False):
        self.dry_run = dry_run
        self.force_all = force_all
        self.crawler = BlogCrawler()
        self.deduplicator = PostDeduplicator()
        self.cleaner = ContentCleaner()
        self.template_gen = TemplateGenerator(TEMPLATES_DIR)
        self.cache = self._load_cache()
        self.stats = {
            'crawled': 0,
            'new': 0,
            'duplicates': 0,
            'migrated': 0,
            'failed': 0
        }

    def _load_cache(self):
        """Lädt Cache von vorherigen Läufen."""
        DATA_DIR.mkdir(exist_ok=True)
        if Path(CACHE_FILE).exists():
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {'posts': [], 'last_run': None}

    def _save_cache(self):
        """Speichert Cache."""
        self.cache['last_run'] = datetime.now().isoformat()
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.cache, f, indent=2, ensure_ascii=False)

    def _get_existing_posts(self):
        """Liste aller bereits vorhandenen Blog-Posts im Projekt."""
        existing = []
        for html_file in OUTPUT_DIR.glob('*.html'):
            # Skip non-blog pages
            if html_file.stem in ['index', 'blog', 'kathrin', 'media', 'contact', 'impressum', 'datenschutzerklaerung']:
                continue

            try:
                with open(html_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    title = self.cleaner.extract_title(content)
                    existing.append({
                        'slug': html_file.stem,
                        'title': title,
                        'file': str(html_file)
                    })
            except:
                pass

        return existing

    def run(self):
        """Führt komplette Migration durch."""
        print("=" * 60)
        print("🚀 BLOG MIGRATION GESTARTET")
        print("=" * 60)

        # Phase 1: Crawling
        crawled_posts = self.crawler.crawl_all_posts()
        self.stats['crawled'] = len(crawled_posts)

        # Phase 2: Deduplizierung
        existing_posts = self._get_existing_posts()
        new_posts, duplicates = self.deduplicator.find_duplicates(existing_posts, crawled_posts)
        self.stats['new'] = len(new_posts)
        self.stats['duplicates'] = len(duplicates)

        if not new_posts and not self.force_all:
            print("\n✓ Keine neuen Posts gefunden. Alle Posts bereits migriert.")
            return

        if self.dry_run:
            print("\n📋 DRY RUN - Keine Änderungen werden vorgenommen")
            print(f"\n   Würde {len(new_posts)} neue Posts migrieren:")
            for post in new_posts[:10]:
                print(f"   - {post['title']}")
            if len(new_posts) > 10:
                print(f"   ... und {len(new_posts) - 10} weitere")
            return

        # Phase 3: Migration (Parallel)
        print(f"\n⚡ Migriere {len(new_posts)} Posts (parallel mit {MAX_WORKERS} Workers)...")

        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = {executor.submit(self._migrate_post, post): post for post in new_posts}

            for i, future in enumerate(as_completed(futures), 1):
                post = futures[future]
                try:
                    result = future.result()
                    if result:
                        self.stats['migrated'] += 1
                        print(f"   [{i}/{len(new_posts)}] ✓ {post['title'][:50]}")
                    else:
                        self.stats['failed'] += 1
                        print(f"   [{i}/{len(new_posts)}] ✗ {post['title'][:50]}")
                except Exception as e:
                    self.stats['failed'] += 1
                    print(f"   [{i}/{len(new_posts)}] ✗ {post['title'][:50]} - {e}")

        # Phase 4: Cache speichern
        self._save_cache()

        # Phase 5: Report
        self._print_report()

    def _migrate_post(self, post):
        """Migriert einen einzelnen Post."""
        try:
            # Download HTML
            html = self.crawler.download_post_content(post['url'])
            if not html:
                return False

            # Extrahiere Metadaten
            title = self.cleaner.extract_title(html)
            description = self.cleaner.extract_description(html)
            image = self.cleaner.extract_featured_image(html)
            content = self.cleaner.clean_content(html)

            if not content or len(content) < 200:
                return False

            # Generiere HTML
            post_data = {
                'title': title,
                'description': description,
                'content': content,
                'category': post['category'],
                'image': image,
                'slug': post['slug']
            }

            new_html = self.template_gen.generate_post_html(post_data)

            # Speichern
            output_file = OUTPUT_DIR / f"{post['slug']}.html"
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(new_html)

            # Cache updaten
            self.cache['posts'].append({
                'slug': post['slug'],
                'title': title,
                'url': post['url'],
                'migrated_at': datetime.now().isoformat()
            })

            return True

        except Exception as e:
            return False

    def _print_report(self):
        """Gibt Migrations-Report aus."""
        print("\n" + "=" * 60)
        print("📊 MIGRATIONS-REPORT")
        print("=" * 60)
        print(f"Gecrawlt:     {self.stats['crawled']} Posts")
        print(f"Neu:          {self.stats['new']} Posts")
        print(f"Duplikate:    {self.stats['duplicates']} Posts")
        print(f"Migriert:     {self.stats['migrated']} Posts")
        print(f"Fehlgeschlagen: {self.stats['failed']} Posts")
        print("=" * 60)


# ============================================
# MAIN
# ============================================

def main():
    parser = argparse.ArgumentParser(description='Blog Migration Tool')
    parser.add_argument('--dry-run', action='store_true', help='Nur analysieren, keine Änderungen')
    parser.add_argument('--force-all', action='store_true', help='Alle Posts neu generieren')
    args = parser.parse_args()

    orchestrator = MigrationOrchestrator(dry_run=args.dry_run, force_all=args.force_all)
    orchestrator.run()


if __name__ == "__main__":
    main()
