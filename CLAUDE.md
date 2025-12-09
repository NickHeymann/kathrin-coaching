# Kathrin Coaching Website - LLM Code Context

> **LLM-Optimierung**: Alle Dateien sind modularisiert für Token-effizientes Editing (<300 Zeilen pro Datei)

## Quick Reference

| Task | Dateien | Suche nach |
|------|---------|------------|
| Header/Navigation ändern | `css/components/header.css`, `js/core/navigation.js` | `.header-inner`, `toggleDropdown` |
| Blog-Artikel Styling | `css/pages/blog.css` | `.article-content`, `.blog-card` |
| Related Posts | `js/pages/blog.js`, `data/blog-intelligence.json` | `initRelatedPosts`, `connections` |
| Video-Seite | `css/pages/videos.css`, `js/pages/videos.js` | `EMBEDDED_VIDEOS`, `.video-card` |
| Quiz-Seiten | `css/pages/quiz.css` | `.quiz-container` |
| Farben/Fonts | `css/core/variables.css` | `--color-`, `--font-` |
| Buttons/CTAs | `css/components/buttons.css` | `.btn-`, `.cta-` |
| Cards | `css/components/cards.css` | `.card-`, `.service-card` |
| **Blog-Editor UI** | `css/blog-editor-*.css` | `.ai-panel`, `.editor-toolbar` |
| **Blog-Editor Logic** | `js/blog-editor-core.js` | `publishPost`, `saveDraft` |
| **Blog-Editor AI** | `js/blog-editor-ai.js` | `groqAPI`, `aiCategorize` |
| **Blog-Editor Config** | `js/blog-editor-config.js` | `CONFIG`, `state`, `BLOG_CATEGORIES` |

## Projektstruktur

```
kathrin-coaching/
├── index.html                    # Hauptseite (hat eigenes inline CSS)
├── blog.html                     # Blog-Übersicht
├── blog-editor-modular.html      # Blog-Editor (LLM-optimiert, modular)
├── blog-editor.html              # Blog-Editor (Legacy, ~3500 Zeilen)
├── cms-editor.html               # CMS-Editor
├── *.html                        # Weitere Seiten
│
├── css/
│   ├── core/                     # Basis-Styles (einmal laden)
│   │   ├── variables.css         # CSS Custom Properties
│   │   ├── reset.css             # Minimal Reset
│   │   ├── typography.css        # Schriften, Größen
│   │   └── layout.css            # Container, Grid
│   │
│   ├── components/               # Wiederverwendbare UI-Elemente
│   │   ├── header.css            # Header & Navigation
│   │   ├── footer.css            # Footer
│   │   ├── buttons.css           # Buttons, CTAs
│   │   ├── cards.css             # Card Components
│   │   ├── forms.css             # Formulare
│   │   └── modals.css            # Dialoge
│   │
│   ├── pages/                    # Seiten-spezifisches CSS
│   │   ├── blog.css              # Blog-Artikel & Listing
│   │   ├── videos.css            # Video-Galerie
│   │   ├── quiz.css              # Quiz-Seiten
│   │   └── kontakt.css           # Kontakt
│   │
│   ├── blog-editor-base.css      # Blog-Editor: Layout, Buttons, Forms (~350 Z.)
│   ├── blog-editor-panels.css    # Blog-Editor: Modals, Queue, Toast (~200 Z.)
│   ├── blog-editor-ai.css        # Blog-Editor: AI Panel, Voice (~180 Z.)
│   │
│   ├── utilities/                # Helper-Klassen
│   │   ├── helpers.css           # .hidden, .text-center, etc.
│   │   └── animations.css        # Keyframes, transitions
│   │
│   └── main.css                  # Import-Datei für alle Module
│
├── js/
│   ├── core/                     # Basis-Funktionen
│   │   ├── utils.js              # Helper Functions
│   │   └── navigation.js         # Header, Mobile Menu, Dropdowns
│   │
│   ├── components/               # UI-Komponenten
│   │   ├── dropdown.js           # Dropdown-Logik
│   │   ├── carousel.js           # Slider/Carousel
│   │   └── modal.js              # Modal-Handler
│   │
│   ├── pages/                    # Seiten-spezifisch
│   │   ├── blog.js               # Related Posts, Blog-Logik
│   │   ├── videos.js             # Video-Galerie
│   │   └── quiz.js               # Quiz-Logik
│   │
│   ├── blog-editor-config.js     # Blog-Editor: Config & State (~55 Z.)
│   ├── blog-editor-utils.js      # Blog-Editor: escapeHtml, sanitize, slug (~100 Z.)
│   ├── blog-editor-github.js     # Blog-Editor: GitHub API (~120 Z.)
│   ├── blog-editor-core.js       # Blog-Editor: Drafts, Publish, Toolbar (~450 Z.)
│   └── blog-editor-ai.js         # Blog-Editor: Groq API, Voice, AI (~350 Z.)
│
├── data/
│   ├── blog-intelligence.json    # LLM-Analysen der Blog-Artikel
│   └── video-categories.json     # Video-Kategorisierung
│
├── scripts/                      # Build/Automation Scripts
│   ├── analyze-with-llm.py       # Blog-Analyse mit Groq
│   ├── generate-smart-connections.py
│   ├── scrape-youtube.py         # YouTube Scraper
│   └── categorize-with-llm.py    # Video-Kategorisierung
│
└── .github/workflows/
    ├── daily-llm-analysis.yml    # Tägliche Blog-Analyse (00:30 UTC)
    └── update-videos.yml         # Video-Updates
```

## CSS Module (Modular Structure - DONE)

### Modulare CSS Dateien (Stand: Dezember 2024)
```
css/
├── main.css                 # Import-Datei (42 Zeilen)
│
├── core/                    # Basis-Styles
│   ├── variables.css        # CSS Custom Properties (51 Z.) ✅
│   ├── reset.css            # Minimal Reset (44 Z.) ✅
│   ├── typography.css       # Schriften (80 Z.) ✅
│   └── layout.css           # Container, Grid (163 Z.) ✅
│
├── components/              # UI-Elemente
│   ├── header.css           # Header & Nav (402 Z.) ✅
│   ├── footer.css           # Footer (97 Z.) ✅
│   ├── buttons.css          # Buttons, CTAs (177 Z.) ✅
│   ├── cards.css            # Card Components (196 Z.) ✅
│   └── forms.css            # Formulare (108 Z.) ✅
│
├── utilities/               # Helper-Klassen
│   ├── helpers.css          # Utility Classes (121 Z.) ✅
│   └── animations.css       # Keyframes (141 Z.) ✅
│
└── pages/                   # Seiten-spezifisch
    ├── blog.css             # Blog-Artikel (1738 Z.) - well-organized
    ├── videos.css           # Video-Galerie (806 Z.)
    ├── quiz.css             # Quiz-Seiten (1189 Z.)
    └── kontakt.css          # Kontakt (325 Z.) ✅
```

### Legacy Dateien (können später entfernt werden)
- `modern-design.css` - Ursprungsdatei, Module extrahiert
- `css/blog-enhancements.css` - Kopiert nach css/pages/blog.css

### CSS Custom Properties (variables.css)
```css
/* Farben */
--color-primary: #D2AB74;         /* Gold/Bronze - Hauptfarbe */
--color-secondary: #2c3e50;       /* Dunkelblau - Text, Headlines */
--color-accent: #8B7355;          /* Braun - Akzente */
--color-text: #2d2d2d;            /* Haupttext */
--color-text-light: #555555;      /* Sekundärtext */

/* Fonts */
--font-heading: 'Gilda Display';   /* Überschriften */
--font-body: 'Montserrat';         /* Fließtext */

/* Spacing */
--spacing-sm: 1rem;
--spacing-md: 2rem;
--spacing-lg: 4rem;
```

## JS Module (Zielstruktur)

### Aktueller Stand → Migration nötig
```
AKTUELL:                             ZIEL:
js/blog-enhancements.js (650)    →   js/pages/blog.js
js/videos.js (54KB mit Daten!)   →   js/pages/videos.js + data/videos.json
js/kontakt.js (248)              →   js/pages/kontakt.js (OK)
js/global.js (113)               →   js/core/utils.js (OK)
```

## Automation (GitHub Actions)

### Tägliche Blog-Analyse
- **Workflow**: `.github/workflows/daily-llm-analysis.yml`
- **Zeitplan**: 00:30 UTC (nach Groq Rate-Limit Reset)
- **API Key**: `secrets.GROQ_API_KEY` (GitHub Secret)
- **Ausgabe**: `data/blog-intelligence.json`

### Video-Updates
- **Workflow**: `.github/workflows/update-videos.yml`
- **Quelle**: YouTube Channel `@glueckueberzweifel`

## Wichtige Konventionen

### Coding-Regeln
1. **Vanilla JS** - Keine Frameworks (jQuery nur für Legacy)
2. **CSS Custom Properties** - Farben/Fonts nur über Variablen
3. **Deutsche Kommentare** - Im Code
4. **Modulare Dateien** - Max. 300 Zeilen pro Datei

### Datei-Größen für LLM-Editing
- **Optimal**: 100-200 Zeilen
- **Akzeptabel**: 200-300 Zeilen
- **Zu groß**: >300 Zeilen (aufteilen!)

### Namenskonventionen
- CSS-Klassen: `kebab-case` (.blog-card, .nav-dropdown)
- JS-Funktionen: `camelCase` (toggleDropdown, initRelatedPosts)
- Dateien: `kebab-case` (blog-enhancements.js)

## Häufige Aufgaben

### Neue Seite erstellen
1. HTML: Kopiere `templates/page-template.html`
2. CSS: Erstelle `css/pages/neue-seite.css` (falls nötig)
3. Verlinke: `<link href="css/core/variables.css">` etc.

### Blog-Artikel bearbeiten
- Datei: `artikel-name.html`
- Related Posts: Automatisch via `data/blog-intelligence.json`

### Farben ändern
- Nur in `css/core/variables.css` ändern
- Alle Seiten nutzen CSS Custom Properties

## API Keys & Secrets

| Secret | Wo gespeichert | Verwendung |
|--------|----------------|------------|
| `GROQ_API_KEY` | GitHub Secrets | Blog-Analyse, Video-Kategorisierung |

**Lokal**: `.env` Datei (in .gitignore, nicht committen!)

## Branches
- `main` - Produktion (GitHub Pages)
- `kathrin-edits` - Für Kathrin's direkte Änderungen
