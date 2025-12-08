# Kathrin Coaching Website - Claude Code Context

## Projekt-Übersicht
Coaching-Website für Kathrin Stahl (kathrinstahl.com) - statische HTML-Seite gehostet auf GitHub Pages.

## Projektstruktur
```
kathrin-coaching/
├── index.html              # Hauptseite
├── media.html              # Video-Seite (nutzt css/videos.css + js/videos.js)
├── css/
│   └── videos.css          # Styles für Video-Seite
├── js/
│   └── videos.js           # Video-Logik + EMBEDDED_VIDEOS Array
├── data/
│   └── video-categories.json  # LLM-kategorisierte Videos
├── scripts/
│   ├── scrape-youtube.py      # YouTube Scraper
│   ├── categorize-with-llm.py # LLM-Kategorisierung (Groq)
│   └── README-HETZNER-SETUP.md
└── .github/workflows/
    └── update-videos.yml      # Täglicher Auto-Update
```

## Tech Stack
- Statisches HTML/CSS/JS (kein Build-Prozess)
- GitHub Pages Hosting
- GitHub Actions für Automatisierung
- Python für Scraping/Kategorisierung
- Groq API (Llama) für Video-Kategorisierung

## Video-Kategorien
- `selbstfindung` - Persönliche Entwicklung, Lebenssinn
- `beziehung` - Partnerschaft, Liebe, Nähe
- `koerper` - Nervensystem, Körperarbeit, Heilung
- `hochsensibel` - HSP, Hochbegabung, Feinfühligkeit

## Coding-Regeln
1. Keine unnötigen Dependencies hinzufügen
2. CSS/JS modular halten (separate Dateien pro Seite)
3. Vanilla JS verwenden, keine Frameworks
4. Deutsche Kommentare in Code
5. Videos werden LLM-kategorisiert (nicht keyword-basiert)

## API Keys (Secrets)
- `GROQ_API_KEY` - Für Video-Kategorisierung (kostenlos, rate-limited)

## Branches
- `main` - Produktiv (wird auf GitHub Pages deployed)
- `kathrin-edits` - Für Kathrin's direkte Änderungen

## Häufige Aufgaben
- Video-Update: `python scripts/scrape-youtube.py`
- Kategorisierung: `GROQ_API_KEY=xxx python scripts/categorize-with-llm.py`
- Deploy: Push to main → GitHub Pages auto-deploy

## Zukünftig (Hetzner Server)
- Hosting auf Hetzner statt GitHub Pages
- Automatische tägliche Video-Updates mit LLM-Kategorisierung
- Setup-Anleitung: `scripts/README-HETZNER-SETUP.md`
