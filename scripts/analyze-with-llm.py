#!/usr/bin/env python3
"""
LLM Deep Analysis Script - Phase 2
Analysiert Blog-Posts mit LLM für tiefgehendes Verständnis

Verwendung:
    GROQ_API_KEY=xxx python scripts/analyze-with-llm.py

    Optional mit OpenAI:
    OPENAI_API_KEY=xxx python scripts/analyze-with-llm.py --provider openai

Output:
    data/blog-intelligence.json
"""

import os
import sys
import json
import time
import argparse
from pathlib import Path
from datetime import datetime

# Konfiguration
PROJECT_ROOT = Path(__file__).parent.parent
INPUT_FILE = PROJECT_ROOT / "data" / "blog-content-raw.json"
OUTPUT_FILE = PROJECT_ROOT / "data" / "blog-intelligence.json"

# Rate Limiting (Groq: 30 req/min, OpenAI: 60 req/min)
RATE_LIMIT_DELAY = 2.5  # Sekunden zwischen Requests


def get_analysis_prompt(article):
    """Generiert den Analyse-Prompt für einen Artikel"""
    return f"""Du bist ein einfühlsamer Content-Analyst für eine Coaching-Website.
Die Website gehört Kathrin Stahl, einer Coachin die Menschen durch Lebenskrisen, Selbstfindung und persönliches Wachstum begleitet. Sie arbeitet viel mit Pferden, Meditation und systemischen Aufstellungen.

Analysiere diesen Blog-Post TIEFGEHEND. Erfasse nicht nur die Oberfläche, sondern die emotionale und transformative Tiefe.

---
TITEL: {article['title']}

KATEGORIE: {article.get('category', 'unbekannt')}

KERNAUSSAGEN (Blockquotes):
{chr(10).join(['- ' + bq for bq in article.get('blockquotes', [])][:5]) or '(keine)'}

INHALT:
{article['content'][:4000]}
---

Antworte NUR mit einem validen JSON-Objekt (keine Erklärungen, kein Markdown):

{{
  "kernbotschaft": "Die zentrale Erkenntnis in 1-2 Sätzen. Was soll der Leser wirklich verstehen?",

  "emotionaleTonalitaet": "EINE von: troestend | aktivierend | reflektierend | heilend | ermutigend | konfrontierend | liebevoll | transformierend",

  "transformation": {{
    "von": "Ausgangszustand des Lesers (z.B. 'Selbstzweifel', 'innerer Kampf')",
    "zu": "Zielzustand (z.B. 'Selbstakzeptanz', 'innere Ruhe')"
  }},

  "tiefenthemen": [
    "Spezifische Themen, NICHT generisch!",
    "NICHT: 'angst', 'selbstliebe'",
    "SONDERN: 'angst-vor-eigener-groesse', 'koerper-als-verbuendeter', 'loslassen-durch-annehmen'"
  ],

  "lebensphase": ["Passende aus: midlife | neuanfang | beziehungskrise | burnout | selbstfindung | trauerarbeit | berufliche-neuorientierung | alltag"],

  "coachingMethode": ["Falls erkennbar: pferde | meditation | aufstellung | journaling | koerperarbeit | visualisierung | achtsamkeit"],

  "leserProfil": "Kurze Beschreibung wer diesen Artikel lesen sollte (1 Satz)",

  "empfehlungsBegründungen": [
    "Persönliche Begründung 1: Warum sollte jemand diesen Artikel nach einem ähnlichen lesen? Direkt, 2. Person.",
    "Persönliche Begründung 2: Anderer Aspekt",
    "Persönliche Begründung 3: Noch ein Aspekt"
  ]
}}"""


def analyze_with_groq(article, api_key):
    """Analysiert einen Artikel mit Groq (Llama 3)"""
    from groq import Groq

    client = Groq(api_key=api_key)
    prompt = get_analysis_prompt(article)

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "Du bist ein präziser JSON-Generator. Antworte NUR mit validem JSON, ohne Markdown-Formatierung, ohne Erklärungen."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1500
        )

        result_text = response.choices[0].message.content.strip()

        # Bereinige mögliche Markdown-Wrapper
        if result_text.startswith('```'):
            result_text = result_text.split('```')[1]
            if result_text.startswith('json'):
                result_text = result_text[4:]
        result_text = result_text.strip()

        return json.loads(result_text)

    except json.JSONDecodeError as e:
        print(f"    ⚠️  JSON Parse Error: {e}")
        print(f"    Response: {result_text[:200]}...")
        return None
    except Exception as e:
        print(f"    ❌ API Error: {e}")
        return None


def analyze_with_openai(article, api_key):
    """Analysiert einen Artikel mit OpenAI GPT-4"""
    from openai import OpenAI

    client = OpenAI(api_key=api_key)
    prompt = get_analysis_prompt(article)

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "Du bist ein präziser JSON-Generator. Antworte NUR mit validem JSON."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )

        result_text = response.choices[0].message.content.strip()
        return json.loads(result_text)

    except Exception as e:
        print(f"    ❌ API Error: {e}")
        return None


def create_default_analysis(article):
    """Erstellt eine Fallback-Analyse wenn LLM fehlschlägt"""
    category_themes = {
        'achtsamkeit': ['praesenz', 'innere-ruhe', 'moment'],
        'selbstliebe': ['selbstakzeptanz', 'selbstwert', 'innerer-kritiker'],
        'beziehung': ['kommunikation', 'verbindung', 'grenzen'],
        'heldinnenreise': ['lebenssinn', 'transformation', 'berufung'],
        'hochbegabung': ['anderssein', 'hochsensibilitaet', 'potential'],
        'koerper': ['koerperbewusstsein', 'symptome', 'heilung']
    }

    category = article.get('category', 'allgemein')

    return {
        "kernbotschaft": article.get('excerpt', '')[:150],
        "emotionaleTonalitaet": "reflektierend",
        "transformation": {
            "von": "Suche",
            "zu": "Erkenntnis"
        },
        "tiefenthemen": category_themes.get(category, ['selbsterkenntnis', 'wachstum']),
        "lebensphase": ["selbstfindung"],
        "coachingMethode": [],
        "leserProfil": "Menschen auf der Suche nach Orientierung",
        "empfehlungsBegründungen": [
            "Dieser Artikel könnte dir neue Perspektiven eröffnen.",
            "Hier findest du weitere Impulse zu diesem Thema.",
            "Ein anderer Blickwinkel auf das, was dich beschäftigt."
        ]
    }


def main():
    parser = argparse.ArgumentParser(description='LLM Deep Analysis für Blog-Posts')
    parser.add_argument('--provider', choices=['groq', 'openai'], default='groq',
                        help='LLM Provider (default: groq)')
    parser.add_argument('--limit', type=int, default=None,
                        help='Nur N Artikel analysieren (für Tests)')
    parser.add_argument('--skip-existing', action='store_true',
                        help='Überspringe bereits analysierte Artikel')
    args = parser.parse_args()

    print("=" * 60)
    print("LLM DEEP ANALYSIS - Phase 2")
    print(f"Provider: {args.provider.upper()}")
    print("=" * 60)
    print()

    # API Key prüfen
    if args.provider == 'groq':
        api_key = os.environ.get('GROQ_API_KEY')
        if not api_key:
            print("❌ GROQ_API_KEY nicht gesetzt!")
            print("   Setze: export GROQ_API_KEY=dein_key")
            print("   Oder hol dir einen kostenlosen Key: https://console.groq.com")
            sys.exit(1)
        analyze_fn = lambda a: analyze_with_groq(a, api_key)
    else:
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            print("❌ OPENAI_API_KEY nicht gesetzt!")
            sys.exit(1)
        analyze_fn = lambda a: analyze_with_openai(a, api_key)

    # Lade extrahierte Inhalte
    if not INPUT_FILE.exists():
        print(f"❌ Input-Datei nicht gefunden: {INPUT_FILE}")
        print("   Führe zuerst aus: python scripts/extract-blog-content.py")
        sys.exit(1)

    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    articles = data['articles']

    # Lade bestehende Analysen (falls vorhanden)
    existing_analyses = {}
    if args.skip_existing and OUTPUT_FILE.exists():
        with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
            for art in existing_data.get('articles', []):
                if art.get('analysis'):
                    existing_analyses[art['url']] = art['analysis']
        print(f"📚 {len(existing_analyses)} bestehende Analysen geladen")

    # Filtere nur Blog-Posts (keine Quizze, Angebote etc.)
    blog_articles = [a for a in articles if a.get('type') == 'blog']

    if args.limit:
        blog_articles = blog_articles[:args.limit]

    print(f"📊 {len(blog_articles)} Blog-Posts zu analysieren")
    print()

    # Analysiere jeden Artikel
    results = []
    success_count = 0
    error_count = 0

    for i, article in enumerate(blog_articles):
        url = article['url']
        title = article['title'][:40]

        print(f"[{i+1}/{len(blog_articles)}] {title}...")

        # Überspringe bereits analysierte
        if args.skip_existing and url in existing_analyses:
            article['analysis'] = existing_analyses[url]
            results.append(article)
            print(f"    ⏭️  Übersprungen (bereits analysiert)")
            continue

        # LLM Analyse
        analysis = analyze_fn(article)

        if analysis:
            article['analysis'] = analysis
            success_count += 1
            print(f"    ✓ Analysiert: {analysis.get('emotionaleTonalitaet', '?')}")
        else:
            article['analysis'] = create_default_analysis(article)
            error_count += 1
            print(f"    ⚠️  Fallback verwendet")

        results.append(article)

        # Rate Limiting
        if i < len(blog_articles) - 1:
            time.sleep(RATE_LIMIT_DELAY)

    print()
    print("-" * 60)
    print("STATISTIKEN")
    print("-" * 60)
    print(f"  Erfolgreich:    {success_count}")
    print(f"  Fallback:       {error_count}")
    print(f"  Gesamt:         {len(results)}")
    print()

    # Speichere Ergebnis
    output_data = {
        'analyzedAt': datetime.now().isoformat(),
        'provider': args.provider,
        'totalArticles': len(results),
        'articles': results
    }

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"💾 Gespeichert: {OUTPUT_FILE}")
    print()
    print("✅ Phase 2 abgeschlossen!")
    print("   Nächster Schritt: python scripts/generate-embeddings.py")


if __name__ == '__main__':
    main()
