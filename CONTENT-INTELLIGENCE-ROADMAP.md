# Content Intelligence System - Roadmap

## Die Vision

Ein System, das jeden Blog-Post wirklich **VERSTEHT** - nicht nur oberflächlich kategorisiert, sondern die Tiefe erfasst: die emotionale Reise, die Transformation, die Verbindungen zwischen Gedanken. Die Leser sollen das Gefühl haben, dass jemand ihre innere Welt kennt und ihnen genau den nächsten Artikel zeigt, den sie gerade brauchen.

**"The Times der Coaching-Szene"** - State-of-the-Art Content-Empfehlungen, die sich anfühlen wie ein persönlicher Begleiter.

---

## Aktuelle Probleme

| Problem | Auswirkung |
|---------|------------|
| **135 Blog-Posts, nur 58 in Datenbank** | 77 Artikel haben keine "Weiterlesen"-Empfehlungen |
| **Manuelle, generische Tags** | "angst", "frieden" - zu oberflächlich |
| **Keine semantische Tiefe** | System versteht nicht, WORUM es wirklich geht |
| **Keine Leser-Journey-Logik** | Keine intelligente "nächster Schritt" Führung |
| **Statische Begründungen** | "Mehr zu diesem Thema" - nicht personalisiert |

---

## State-of-the-Art: Was die Forschung zeigt

### LLM vs. Traditionelle Methoden
- **LLM-Genauigkeit: 98%** vs. traditionelle Methoden: 58% ([Springer Research](https://link.springer.com/chapter/10.1007/978-3-031-58839-6_3))
- LLMs erfassen Nuancen, Ironie, emotionale Untertöne
- Zero-Shot-Fähigkeit: Keine aufwendige Trainingsphase nötig

### Embeddings für Empfehlungen
- **4x mehr Engagement** durch semantische Ähnlichkeit ([Scott Logic Case Study](https://blog.scottlogic.com/2022/02/23/word-embedding-recommendations.html))
- OpenAI text-embedding-3-small: 1536-dimensionale Vektoren
- Cosine Similarity für Ähnlichkeitsberechnung ([OpenAI Cookbook](https://github.com/openai/openai-cookbook/blob/main/examples/Recommendation_using_embeddings.ipynb))

### Performance-Optimierung
- **Pre-computed Embeddings**: Einmal berechnen, immer nutzen
- **Static Embeddings**: 1.12ms Response Time, 50k RPS ([SwiftEmbed](https://arxiv.org/html/2510.24793))
- JSON-basierte Speicherung für statische Websites

---

## Die Architektur

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CONTENT INTELLIGENCE PIPELINE                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌─────────────────┐    ┌──────────────────┐   │
│  │   135 HTML  │───▶│  Content Parser │───▶│  Structured JSON │   │
│  │  Blog Posts │    │  (Python/BS4)   │    │  (Text + Meta)   │   │
│  └─────────────┘    └─────────────────┘    └────────┬─────────┘   │
│                                                      │             │
│                                                      ▼             │
│                            ┌─────────────────────────────────────┐ │
│                            │         LLM DEEP ANALYSIS           │ │
│                            │            (Groq/GPT-4)             │ │
│                            │                                     │ │
│                            │  • Kernbotschaft                    │ │
│                            │  • Emotionale Tonalität             │ │
│                            │  • Leser-Transformation             │ │
│                            │  • Tiefenthemen                     │ │
│                            │  • Lebensphase                      │ │
│                            │  • Verbindungs-Begründungen         │ │
│                            └──────────────┬──────────────────────┘ │
│                                           │                        │
│                                           ▼                        │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                   SEMANTIC EMBEDDINGS                        │  │
│  │                   (OpenAI text-embedding-3-small)            │  │
│  │                                                              │  │
│  │   Artikel A ──────────────▶ [0.12, -0.34, 0.56, ...]        │  │
│  │   Artikel B ──────────────▶ [0.11, -0.38, 0.51, ...]        │  │
│  │                                                              │  │
│  │   Cosine Similarity Matrix ──▶ Top 10 ähnlichste pro Post   │  │
│  └──────────────────────────────┬───────────────────────────────┘  │
│                                 │                                  │
│                                 ▼                                  │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                   SMART CONNECTION ENGINE                    │  │
│  │                                                              │  │
│  │   Verbindungstypen:                                         │  │
│  │   ├── "Vertiefung" → Geht tiefer ins gleiche Thema         │  │
│  │   ├── "Neue Perspektive" → Anderer Blickwinkel             │  │
│  │   ├── "Nächster Schritt" → Logische Weiterführung          │  │
│  │   ├── "Heilungsreise" → Passt zur emotionalen Phase        │  │
│  │   └── "Ergänzung" → Verwandtes, aber anderes Thema         │  │
│  └──────────────────────────────┬───────────────────────────────┘  │
│                                 │                                  │
│                                 ▼                                  │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    OUTPUT: JSON FILES                        │  │
│  │                                                              │  │
│  │   data/blog-intelligence.json                               │  │
│  │   {                                                          │  │
│  │     "articles": [{                                           │  │
│  │       "url": "warum-loslassen-nicht-funktioniert.html",     │  │
│  │       "title": "Warum Loslassen nicht funktioniert",        │  │
│  │       "image": "wp-content/uploads/...",                    │  │
│  │       "excerpt": "...",                                      │  │
│  │       "analysis": {                                          │  │
│  │         "kernbotschaft": "Kämpfen gegen Gewohnheiten...",   │  │
│  │         "emotionaleTonalitaet": "liebevoll-einladend",      │  │
│  │         "transformation": "von Kampf zu Entspannung",       │  │
│  │         "tiefenthemen": ["systemische-gewohnheiten",        │  │
│  │                          "koerper-als-verbündeter", ...],   │  │
│  │         "lebensphase": ["veraenderung", "stagnation"],      │  │
│  │         "coachingMethode": ["meditation", "visualisierung"] │  │
│  │       },                                                     │  │
│  │       "related": [                                           │  │
│  │         {                                                    │  │
│  │           "url": "komfortzone.html",                        │  │
│  │           "reason": "Führt den Gedanken weiter: Wie du...", │  │
│  │           "type": "naechster-schritt",                      │  │
│  │           "similarity": 0.89                                 │  │
│  │         }, ...                                               │  │
│  │       ]                                                      │  │
│  │     }, ...]                                                  │  │
│  │   }                                                          │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation: 5 Phasen

### Phase 1: Content-Extraktion
**Ziel:** Alle 135 Blog-Posts strukturiert erfassen

**Script:** `scripts/extract-blog-content.py`

```python
# Extrahiert aus jeder HTML-Datei:
{
    "url": "artikel.html",
    "title": "...",                    # aus <h1> oder <title>
    "image": "...",                    # aus .featured-image img
    "content": "...",                  # aus .article-content (bereinigt)
    "category": "...",                 # aus .article-category
    "internalLinks": ["..."],          # alle internen <a href>
    "blockquotes": ["..."],            # Kernaussagen
    "wordCount": 1234
}
```

**Technologie:** Python + BeautifulSoup

---

### Phase 2: LLM Deep Analysis
**Ziel:** Jeder Artikel wird tiefgehend verstanden

**Script:** `scripts/analyze-with-llm.py`

**Prompt-Struktur:**
```
Du bist ein einfühlsamer Content-Analyst für eine Coaching-Website.
Analysiere diesen Blog-Post tiefgehend:

TITEL: {title}
INHALT: {content}

Extrahiere:

1. KERNBOTSCHAFT (1-2 Sätze)
   Was ist die zentrale Erkenntnis, die der Leser mitnehmen soll?

2. EMOTIONALE TONALITÄT
   Wähle aus: tröstend | aktivierend | reflektierend | heilend |
   ermutigend | konfrontierend | liebevoll | transformierend

3. LESER-TRANSFORMATION
   Von welchem Zustand führt der Artikel zu welchem?
   Format: "von {Ausgangszustand} zu {Zielzustand}"
   Beispiel: "von Selbstzweifel zu Selbstakzeptanz"

4. TIEFENTHEMEN (3-5)
   Nicht generisch! Spezifisch.
   NICHT: "angst", "selbstliebe"
   SONDERN: "angst-vor-eigener-groesse", "koerper-als-verbündeter",
            "loslassen-durch-annehmen", "gewohnheiten-als-schutz"

5. LEBENSPHASE
   Wähle passende: midlife | neuanfang | beziehungskrise | burnout |
   selbstfindung | trauerarbeit | berufliche-neuorientierung

6. COACHING-METHODE (falls erkennbar)
   pferde | meditation | aufstellung | journaling | koerperarbeit |
   visualisierung | achtsamkeit

7. EMPFEHLUNGS-BEGRÜNDUNGEN
   Generiere 3 einzigartige, persönliche Begründungen warum dieser
   Artikel nach einem thematisch ähnlichen gelesen werden sollte.
   Format: Kurz, direkt, 2. Person ("Du hast...")
```

**API:** Groq (kostenlos, schnell) oder OpenAI GPT-4 (höhere Qualität)

---

### Phase 3: Semantic Embeddings
**Ziel:** Mathematische Ähnlichkeit zwischen Artikeln

**Script:** `scripts/generate-embeddings.py`

```python
from openai import OpenAI
import numpy as np

def get_embedding(text, model="text-embedding-3-small"):
    response = client.embeddings.create(input=text, model=model)
    return response.data[0].embedding

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# Für jeden Artikel:
# 1. Embedding aus Titel + Excerpt + Kernbotschaft generieren
# 2. Ähnlichkeit zu allen anderen berechnen
# 3. Top 10 speichern
```

**Kosten:** ~$0.02 für alle 135 Artikel (text-embedding-3-small)

---

### Phase 4: Smart Connection Engine
**Ziel:** Intelligente Verbindungslogik mit personalisierten Begründungen

**Verbindungstypen:**

| Typ | Beschreibung | Beispiel-Begründung |
|-----|--------------|---------------------|
| `vertiefung` | Geht tiefer ins gleiche Thema | "Du möchtest noch tiefer in {thema} eintauchen? Dieser Artikel führt dich weiter." |
| `neue-perspektive` | Anderer Blickwinkel | "Ein anderer Blickwinkel auf das, was dich gerade beschäftigt." |
| `naechster-schritt` | Logische Weiterführung | "Der nächste Schritt auf deiner Reise von {von} zu {zu}." |
| `heilungsreise` | Passt zur emotionalen Phase | "Wenn du bereit bist, noch etwas tiefer zu gehen..." |
| `ergaenzung` | Verwandtes Thema | "Dieses Thema hängt eng damit zusammen – und könnte dir neue Türen öffnen." |
| `kontrast` | Bewusst anderer Ansatz | "Eine ganz andere Perspektive, die dich überraschen könnte." |

**Thematische Reisen (Journey Maps):**

```javascript
const journeyMaps = {
    "angst-zu-frieden": [
        "umgang-mit-angst",
        "koerper-als-verbündeter",
        "annehmen-statt-kaempfen",
        "innerer-frieden",
        "praesenz"
    ],
    "selbstzweifel-zu-selbstliebe": [
        "innerer-kritiker",
        "fehler-als-lernfeld",
        "selbstmitgefuehl",
        "eigene-groesse-annehmen",
        "authentisch-sein"
    ],
    "beziehungskrise-zu-klarheit": [
        "kommunikationsmuster",
        "eigene-beduerfnisse",
        "grenzen-setzen",
        "entscheidung-treffen",
        "neuanfang-oder-vertiefung"
    ]
}
```

---

### Phase 5: Integration & Deployment
**Ziel:** Nahtlose Integration in die bestehende Website

**Output-Dateien:**

```
data/
├── blog-intelligence.json     # Alle Artikel mit Deep Analysis
├── blog-embeddings.json       # Ähnlichkeitsmatrix (optional, für Debugging)
└── blog-journeys.json         # Thematische Reisen
```

**JavaScript-Integration:**

```javascript
// js/blog-enhancements.js

// Lade Intelligence-Daten
let blogIntelligence = null;

async function loadBlogIntelligence() {
    const response = await fetch('data/blog-intelligence.json');
    blogIntelligence = await response.json();
}

function getSmartRecommendations(currentUrl) {
    const article = blogIntelligence.articles.find(a => a.url === currentUrl);
    if (!article) return getFallbackRecommendations();

    return article.related.map(rel => ({
        ...blogIntelligence.articles.find(a => a.url === rel.url),
        reason: rel.reason,
        type: rel.type
    }));
}
```

---

## Zeitplan

| Phase | Aufwand | Abhängigkeiten |
|-------|---------|----------------|
| **Phase 1:** Content-Extraktion | 2h | - |
| **Phase 2:** LLM Deep Analysis | 4h + API-Zeit | Phase 1 |
| **Phase 3:** Embeddings | 2h | Phase 1 |
| **Phase 4:** Connection Engine | 3h | Phase 2, 3 |
| **Phase 5:** Integration | 2h | Phase 4 |

**Gesamt:** ~13 Stunden Entwicklung + API-Verarbeitung

---

## API-Kosten (geschätzt)

| Service | Nutzung | Kosten |
|---------|---------|--------|
| **Groq (Llama 3)** | 135 Artikel analysieren | $0 (kostenlos) |
| **OpenAI Embeddings** | 135 × 1536 dim | ~$0.02 |
| **OpenAI GPT-4** (optional) | 135 Artikel | ~$2-5 |

**Gesamt:** $0.02 - $5 (einmalig)

---

## Qualitätssicherung

### Manuelle Review-Stichprobe
- 10 zufällige Artikel prüfen
- Sind die Tiefenthemen wirklich tiefgehend?
- Passen die Empfehlungs-Begründungen?
- Stimmen die Verbindungstypen?

### A/B-Testing (optional)
- Engagement-Tracking für Related Posts
- Click-Through-Rate messen
- Zeit auf Seite nach Empfehlung

---

## Langfristige Vision

### Automatisierung
- GitHub Action: Bei neuem Blog-Post automatisch analysieren
- Webhook bei Änderungen → Re-Analysis

### Personalisierung (Phase 2)
- Leser-Journey tracking (welche Artikel gelesen?)
- Personalisierte "Für dich empfohlen" Sektion
- Newsletter mit individuellen Empfehlungen

### Suche (Phase 3)
- Semantische Suche über alle Artikel
- "Finde Artikel zu meinem Gefühl: ..."
- Chatbot-Integration für Empfehlungen

---

## Nächste Schritte

1. **Sofort:** Content-Extraktion Script erstellen
2. **Dann:** LLM-Analyse mit Groq (kostenlos) testen
3. **Validierung:** 10 Artikel manuell prüfen
4. **Rollout:** Alle 135 Artikel analysieren
5. **Integration:** JSON laden und Empfehlungen rendern

---

## Referenzen

- [OpenAI Cookbook: Recommendations](https://github.com/openai/openai-cookbook/blob/main/examples/Recommendation_using_embeddings.ipynb)
- [Scott Logic: 4x Engagement with Embeddings](https://blog.scottlogic.com/2022/02/23/word-embedding-recommendations.html)
- [LLM Topic Extraction Research](https://link.springer.com/chapter/10.1007/978-3-031-58839-6_3)
- [SwiftEmbed: Static Embeddings](https://arxiv.org/html/2510.24793)
- [Hugging Face: Static Embeddings](https://huggingface.co/blog/static-embeddings)
