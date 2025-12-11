# Kathrin Coaching Website - LLM Code Context

> **LLM-Optimierung**: Alle Dateien sind modularisiert für Token-effizientes Editing (<300 Zeilen pro Datei)

## Quick Reference

| Task | Dateien | Suche nach |
|------|---------|------------|
| Header/Navigation ändern | `css/components/header.css`, `js/core/navigation.js` | `.header-inner`, `toggleDropdown` |
| **Index Homepage Styling** | `css/pages/index.css`, `css/pages/index/*.css` | `.hero`, `.services-grid` |
| Blog-Artikel Styling | `css/pages/blog.css`, `css/pages/blog/*.css` | `.article-content`, `.blog-card` |
| Related Posts | `js/pages/blog.js`, `data/blog-intelligence.json` | `initRelatedPosts`, `connections` |
| Video-Seite | `css/pages/videos.css`, `js/pages/videos.js`, `data/videos.json` | `loadVideoData`, `.video-card` |
| Quiz-Seiten | `css/pages/quiz.css` | `.quiz-container` |
| Farben/Fonts | `css/core/variables.css` | `--color-`, `--font-` |
| Buttons/CTAs | `css/components/buttons.css` | `.btn-`, `.cta-` |
| Cards | `css/components/cards.css` | `.card-`, `.service-card` |
| **Blog-Editor UI** | `css/blog-editor-*.css` | `.ai-panel`, `.editor-toolbar` |
| **Blog-Editor Logic** | `js/blog-editor-core.js` | `publishPost`, `saveDraft` |
| **Blog-Editor AI** | `js/blog-editor-ai.js` | `groqAPI`, `aiCategorize` |
| **Blog-Editor Config** | `js/blog-editor-config.js` | `CONFIG`, `state`, `BLOG_CATEGORIES` |
| **Blog-Editor Video** | `js/blog-editor-video.js`, `css/blog-editor-video.css` | `openVideoRecordModal`, `silenceRegions` |
| **Blog-Editor Blocks** | `js/blog-editor-blocks.js`, `css/blog-editor-blocks.css` | `createBlock`, `blocksToHtml`, `BLOCK_TYPES` |
| **Website-Editor (MODULAR)** | `/cms/` Ordner | `cms/js/main.js`, `cms/js/recording/*.js`, `cms/css/editor/*.css` |
| **Website-Editor Recording** | `cms/js/recording/` | `core.js` (state, upload), `effects.js` (audio, filters), `pip.js` (drag, resize) |
| **Website-Editor Events** | `cms/js/event-handlers.js`, `cms/js/shared-ui-init.js` | `setupEventHandlers`, `initSharedUI`, `renderRecentItems` |
| **Admin Auth System** | `admin/js/*.js`, `admin/css/admin.css` | `signIn`, `loadGithubToken`, `apiKeys` |

## Projektstruktur

```
kathrin-coaching/
├── index.html                    # Hauptseite (modularisiert, ~1960 Z.)
├── blog.html                     # Blog-Übersicht
├── blog-editor-modular.html      # Blog-Editor (LLM-optimiert, modular)
├── *.html                        # Weitere Seiten
│
├── admin/                        # Admin Auth System (Supabase)
│   ├── index.html                # Login-Seite
│   ├── dashboard.html            # Admin-Dashboard
│   ├── reset-password.html       # Passwort-Reset
│   ├── css/admin.css             # Admin Styles (~420 Z.)
│   └── js/
│       ├── supabase-config.js    # Supabase Client
│       ├── auth.js               # Auth-Funktionen
│       ├── api-keys.js           # API Key Management
│       └── auth-check.js         # Token-Loader für Editoren
│
├── cms/                          # Website-Editor v2.0 (MODULAR - AKTIV!)
│   ├── index.html                # Editor UI (~280 Z.)
│   ├── css/
│   │   ├── editor.css            # Import-Datei (35 Z.) ✅
│   │   └── editor/               # Modulare CSS (alle <300 Z.) ✅
│   │       ├── editor-base.css           # (284 Z.) Reset, Variables, Layout
│   │       ├── editor-toolbar.css        # (278 Z.) Toolbar, Buttons, Badges
│   │       ├── editor-frame.css          # (219 Z.) Sidebars, Panels
│   │       ├── editor-modals.css         # (646 Z.) Modals, Setup, Previews
│   │       ├── editor-context-menu.css   # (131 Z.) Context Menu, Format
│   │       └── editor-responsive.css     # (130 Z.) Media Queries
│   └── js/                       # Modulare JS-Dateien (alle <300 Z.) ✅
│       ├── main.js               # (256 Z.) Entry Point, CMS global ✅
│       ├── event-handlers.js     # (131 Z.) DOM Event Setup ✅
│       ├── shared-ui-init.js     # (132 Z.) Recent Items, SharedUI ✅
│       ├── config.js             # CONFIG Konstanten
│       ├── state.js              # Reactive State Management
│       ├── storage.js            # LocalStorage, Token (+ loadAsync)
│       ├── github-api.js         # GitHub API Client
│       ├── page-loader.js        # Seiten laden
│       ├── frame-setup.js        # iFrame Editing Setup
│       ├── text-editor.js        # Text Editing, Undo/Redo
│       ├── image-editor.js       # Bild Upload/Bearbeitung
│       ├── video-editor.js       # Video Embed Bearbeitung
│       ├── video-recording.js    # (28 Z.) Barrel Export ✅
│       ├── recording/            # Video Recording Module ✅
│       │   ├── core.js           # (281 Z.) Recording Logic, State, Upload
│       │   ├── effects.js        # (205 Z.) Audio Processing, Filters
│       │   └── pip.js            # (240 Z.) Picture-in-Picture, Drag/Resize
│       ├── autosave.js           # Autosave zu GitHub
│       ├── versions.js           # Versionsverlauf
│       ├── notes.js              # Sticky Notes
│       ├── format-toolbar.js     # Text Formatting
│       ├── context-menu.js       # Rechtsklick-Menü
│       ├── keyboard.js           # Shortcuts
│       ├── security.js           # Token Validation
│       └── ui.js                 # Toast, Loading, Status
│
├── _archive/                     # VERALTET - NICHT VERWENDEN!
│   └── legacy-editors/           # Alte monolithische Editoren
│       ├── cms-editor.html       # Alt: ~4330 Zeilen
│       ├── blog-editor.html      # Alt: ~3500 Zeilen
│       └── css/cms-editor-*.css  # Alte CSS Dateien
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
│   │   ├── index.css             # Index Page Import (importiert index/*)
│   │   ├── index/                # Index Page Module (<300 Z. pro Datei)
│   │   │   ├── hero.css          # Hero & Trust Bar (117 Z.)
│   │   │   ├── sections.css      # Problem & Solution (160 Z.)
│   │   │   ├── services.css      # Service Cards (156 Z.)
│   │   │   ├── modals.css        # Service Modals (285 Z.)
│   │   │   ├── quiz.css          # Quiz & Self-Tests (234 Z.)
│   │   │   ├── testimonials.css  # Testimonials (223 Z.)
│   │   │   ├── video.css         # Video, About, CTA (311 Z.)
│   │   │   ├── transformation.css # Slider (532 Z.)
│   │   │   ├── methods.css       # Methods & Guarantee (309 Z.)
│   │   │   ├── faq.css           # FAQ & Images (270 Z.)
│   │   │   ├── blog-section.css  # Blog Preview (392 Z.)
│   │   │   └── responsive.css    # Responsive & Footer (401 Z.)
│   │   ├── blog.css              # Blog-Artikel & Listing
│   │   ├── videos.css            # Video-Galerie
│   │   ├── quiz.css              # Quiz-Seiten
│   │   └── kontakt.css           # Kontakt
│   │
│   ├── blog-editor-base.css      # Blog-Editor: Layout, Buttons, Forms (~350 Z.)
│   ├── blog-editor-panels.css    # Blog-Editor: Modals, Queue, Toast (~200 Z.)
│   ├── blog-editor-ai.css        # Blog-Editor: AI Panel, Voice (~180 Z.)
│   ├── blog-editor-video.css     # Blog-Editor: Video Recording UI (~200 Z.)
│   ├── blog-editor-blocks.css    # Blog-Editor: Block-System UI (~280 Z.)
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
│   ├── blog-editor-ai.js         # Blog-Editor: Groq API, Voice, AI (~350 Z.)
│   ├── blog-editor-video.js      # Blog-Editor: Video Recording, Silence Detection (~280 Z.)
│   └── blog-editor-blocks.js     # Blog-Editor: Modulares Block-System (~350 Z.)
│
├── data/
│   ├── blog-intelligence.json    # LLM-Analysen der Blog-Artikel
│   ├── videos.json               # Video-Daten (149 Videos, extrahiert aus JS)
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
    ├── index.css            # Index Import (44 Z.) ✅
    ├── index/               # Index Page Module (12 Dateien, alle <300 Z.) ✅
    │   ├── hero.css         # (117 Z.) ✅
    │   ├── sections.css     # (160 Z.) ✅
    │   ├── services.css     # (156 Z.) ✅
    │   ├── modals.css       # (285 Z.) ✅
    │   ├── quiz.css         # (234 Z.) ✅
    │   ├── testimonials.css # (223 Z.) ✅
    │   ├── video.css        # (311 Z.) - leicht über Limit
    │   ├── transformation.css # (532 Z.) - große Komponente
    │   ├── methods.css      # (309 Z.) - leicht über Limit
    │   ├── faq.css          # (270 Z.) ✅
    │   ├── blog-section.css # (392 Z.) - über Limit
    │   └── responsive.css   # (401 Z.) - über Limit
    ├── blog.css             # Blog Import Wrapper → blog/ (5 Module, alle ≤422 Z.) ✅
    ├── blog/                # Blog-Artikel Module
    │   ├── typography.css   # (291 Z.) Text, Listen ✅
    │   ├── callouts.css     # (388 Z.) Boxen, Zitate ✅
    │   ├── ui-components.css # (380 Z.) TOC, Author, Accordion ✅
    │   ├── related-posts.css # (422 Z.) Carousel & Cards ✅
    │   └── sidebar.css      # (244 Z.) Floating UI ✅
    ├── videos.css           # Videos Import Wrapper → videos/ (4 Module, alle ≤182 Z.) ✅
    ├── videos/              # Video-Galerie Module
    │   ├── base.css         # (92 Z.) Reset, Variables, Hero ✅
    │   ├── grid.css         # (182 Z.) Stats, Filter, Grid ✅
    │   ├── ui.css           # (116 Z.) CTA, Footer, Modal ✅
    │   └── responsive.css   # (174 Z.) Media Queries, Loading ✅
    ├── quiz.css             # Quiz Import Wrapper → quiz/ (7 Module, alle ≤244 Z.) ✅
    ├── quiz/                # Quiz-Seiten Module
    │   ├── base.css         # (84 Z.) Reset, Variables ✅
    │   ├── components.css   # (244 Z.) Science Box, Progress ✅
    │   ├── questions.css    # (168 Z.) Questions, Scales ✅
    │   ├── results.css      # (178 Z.) Results, Meter ✅
    │   ├── cta.css          # (125 Z.) CTA, Source ✅
    │   ├── footer.css       # (147 Z.) Footer, Score Circle ✅
    │   └── responsive.css   # (139 Z.) Mobile/Tablet ✅
    └── kontakt.css          # Kontakt (325 Z.) ✅
```

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

## JS Module (Modular Structure - COMPLETE ✅)

### Migration abgeschlossen (Dezember 2024)
```
✅ js/pages/blog.js (650 Z.)         # Blog-Logik, Related Posts
✅ js/pages/videos.js (254 Z.)       # Video-Galerie (Logik)
✅ data/videos.json (149 Videos)     # Video-Daten (extrahiert)
✅ js/pages/kontakt.js (248 Z.)      # Kontaktformular
✅ js/core/utils.js (113 Z.)         # Helper Functions
```

**Erfolge:**
- videos.js: 390→254 Zeilen (-35%), 53KB→8.6KB (-84% JS)
- blog-enhancements.js: Zu js/pages/blog.js migriert (97 HTML-Dateien aktualisiert)
- Legacy-Dateien entfernt: Alte blog-enhancements.js, videos.js gelöscht

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

## Infrastruktur & Integration

- **Hosting**: GitHub Pages (automatisches Deploy bei Push auf `main`)
- **Externe Dienste**:
  - n8n: Self-Hosted auf Hetzner CX32 (Automation/Workflows)
  - Supabase: Self-Hosted Stack (Auth + API Key Storage)
  - Groq API: Für LLM-basierte Blog-Analyse
- **Deployment**:
  - Statische Seite via GitHub Pages
  - GitHub Actions für automatisierte Tasks (Blog-Analyse, Video-Updates)
- **Secrets-Management**:
  - GitHub Secrets für CI/CD (GROQ_API_KEY)
  - Supabase: API Keys pro User (verschlüsselt)
  - Lokale `.env` für Entwicklung (in .gitignore)

## Admin Auth System (Supabase)

### Struktur
```
admin/
├── index.html          # Login-Seite
├── dashboard.html      # Admin-Dashboard mit Tool-Cards
├── reset-password.html # Passwort-Reset-Formular
├── css/admin.css       # Admin-spezifische Styles
└── js/
    ├── supabase-config.js  # Supabase Client Init
    ├── auth.js             # Auth-Funktionen (signIn, signOut, etc.)
    ├── api-keys.js         # API Key CRUD (verschlüsselt)
    └── auth-check.js       # Token-Loader für Editoren
```

### Token-Speicherung
- **Supabase (primär)**: API Keys pro User in `api_keys` Tabelle
- **localStorage (Fallback)**: XOR-verschlüsselt mit Device-Key
- **WICHTIG**: Alle Editoren nutzen dieselbe `getDeviceKey()`-Implementierung:
  ```javascript
  // userAgent.slice(0, 50) + language + screen + timezoneOffset
  const parts = [
      navigator.userAgent.slice(0, 50),
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset().toString()
  ];
  return parts.join('|');
  ```

### Supabase Tabelle
```sql
CREATE TABLE api_keys (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    key_name text NOT NULL,
    key_value text NOT NULL,  -- XOR-verschlüsselter Wert
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, key_name)
);

-- RLS aktivieren
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own keys" ON api_keys
    FOR ALL USING (auth.uid() = user_id);
```

### Integration in Editoren
CMS und Blog-Editor laden den Token async:
1. Prüfe ob `window.loadGithubToken()` existiert (aus auth-check.js)
2. Falls ja: Lade von Supabase
3. Falls nein/Fehler: Fallback zu localStorage

## Deployment-Standards (Backend auf Hetzner)

### Docker-Architektur
```
/opt/kathrin-analytics/
├── docker-compose.yml        # Production Compose
├── .env                      # Secrets (nicht im Repo!)
├── server/
│   ├── Dockerfile
│   └── ...
└── nginx/
    └── kathrin.conf          # Reverse Proxy Config
```

### CI/CD via GitHub Actions
- Bei Push auf `main` → Docker Image bauen → Registry → Hetzner
- Workflow: `.github/workflows/deploy-api.yml`
- **Kein manuelles SSH-Deployment im Regelfall**

### Befehle (nur Notfall/Initial)
```bash
scp -r server/ root@91.99.177.238:/opt/kathrin-analytics/
ssh root@91.99.177.238 "cd /opt/kathrin-analytics && docker-compose pull && docker-compose up -d"
```

## Safety-Regeln für Git-Operationen durch LLM

- Arbeite NIEMALS direkt auf dem Branch `main`, sondern immer auf Feature-/Fix-Branches (z.B. `feature/...`, `fix/...`, `refactor/...`).
- Führe KEIN `git reset --hard`, KEIN `git push --force` und KEIN Löschen von Branches oder Tags aus, außer es wird explizit und eindeutig vom Nutzer angeordnet.
- Vor größeren Refactorings oder riskanten Änderungen:
  - Erstelle einen neuen Branch (z.B. `refactor/<kurze-beschreibung>`).
  - Setze einen Snapshot-Tag (z.B. `snapshot-YYYYMMDD-HHMM`) auf den letzten stabilen Commit.
  - Pushe den aktuellen Stand des Branches auf `origin`.
- Beschreibe im Commit-Text klar, was geändert wurde (z.B. „refactor: split monolithic file into modules"), damit der Verlauf nachvollziehbar bleibt.
