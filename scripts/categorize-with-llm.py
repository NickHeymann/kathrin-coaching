#!/usr/bin/env python3
"""
LLM-basierte Video-Kategorisierung für Kathrin Stahl's YouTube Kanal

SETUP (für Hetzner Server):
1. Python 3.9+ installieren
2. pip install youtube-transcript-api groq
3. Groq API Key holen: https://console.groq.com (kostenlos)
4. Environment Variable setzen: export GROQ_API_KEY="dein-key"
5. Cron Job einrichten: 0 7 * * * cd /path/to/repo && python3 scripts/categorize-with-llm.py

ALTERNATIVE: Ollama lokal (komplett kostenlos, kein API Key nötig)
1. Ollama installieren: curl -fsSL https://ollama.com/install.sh | sh
2. Modell laden: ollama pull llama3.2
3. USE_OLLAMA=true setzen (unten im Script)
"""

import os
import json
import re
from datetime import datetime

# Konfiguration
USE_OLLAMA = False  # True = Ollama lokal, False = Groq API
OLLAMA_MODEL = "llama3.2"
GROQ_MODEL = "llama-3.1-8b-instant"

# Kathrin's Kategorien mit Beschreibungen für das LLM
CATEGORIES = {
    "beziehung": "Partnerschaft, Ehe, Liebe, Nähe, Paarbeziehung, Trennung, toxische Beziehungen, Intimität",
    "selbstfindung": "Persönliche Entwicklung, Wer bin ich, Lebenssinn, Neuanfang, Veränderung, Entscheidungen, Selbstwert",
    "hochsensibel": "Hochsensibilität, HSP, Feinfühligkeit, Hochbegabung, Reizüberflutung, Anders sein",
    "koerper": "Körperarbeit, Nervensystem, Heilung, Pferde, Atmung, Holotropes Atmen, Trauma, Angst"
}

def get_transcript(video_id):
    """Holt YouTube-Transkript falls verfügbar"""
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=['de', 'en'])
        text = ' '.join([t['text'] for t in transcript_list[:50]])  # Erste 50 Segmente
        return text[:2000]  # Max 2000 Zeichen
    except Exception as e:
        print(f"  Kein Transkript für {video_id}: {e}")
        return None

def categorize_with_groq(title, description, transcript=None):
    """Kategorisiert Video mit Groq API (kostenlos)"""
    try:
        from groq import Groq
        client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

        content = f"Titel: {title}\nBeschreibung: {description}"
        if transcript:
            content += f"\nTranskript-Auszug: {transcript[:1000]}"

        categories_desc = "\n".join([f"- {k}: {v}" for k, v in CATEGORIES.items()])

        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{
                "role": "user",
                "content": f"""Kategorisiere dieses YouTube-Video von Kathrin Stahl (Coaching/Persönlichkeitsentwicklung).

{content}

Verfügbare Kategorien:
{categories_desc}

Antworte NUR mit dem Kategorie-Namen (beziehung, selbstfindung, hochsensibel, oder koerper). Keine Erklärung."""
            }],
            temperature=0.1,
            max_tokens=20
        )

        result = response.choices[0].message.content.strip().lower()
        # Extrahiere Kategorie aus Antwort
        for cat in CATEGORIES.keys():
            if cat in result:
                return cat
        return "selbstfindung"  # Default

    except Exception as e:
        print(f"  Groq Fehler: {e}")
        return None

def categorize_with_ollama(title, description, transcript=None):
    """Kategorisiert Video mit lokalem Ollama (komplett kostenlos)"""
    try:
        import subprocess

        content = f"Titel: {title}\nBeschreibung: {description}"
        if transcript:
            content += f"\nTranskript-Auszug: {transcript[:1000]}"

        categories_desc = "\n".join([f"- {k}: {v}" for k, v in CATEGORIES.items()])

        prompt = f"""Kategorisiere dieses YouTube-Video von Kathrin Stahl (Coaching/Persönlichkeitsentwicklung).

{content}

Verfügbare Kategorien:
{categories_desc}

Antworte NUR mit dem Kategorie-Namen (beziehung, selbstfindung, hochsensibel, oder koerper). Keine Erklärung."""

        result = subprocess.run(
            ['ollama', 'run', OLLAMA_MODEL, prompt],
            capture_output=True,
            text=True,
            timeout=60
        )

        response = result.stdout.strip().lower()
        for cat in CATEGORIES.keys():
            if cat in response:
                return cat
        return "selbstfindung"

    except Exception as e:
        print(f"  Ollama Fehler: {e}")
        return None

def load_videos_from_media_html():
    """Lädt aktuelle Videos aus media.html"""
    with open('media.html', 'r', encoding='utf-8') as f:
        content = f.read()

    match = re.search(r'const EMBEDDED_VIDEOS = \[(.*?)\];', content, re.DOTALL)
    if not match:
        return []

    videos = []
    for video_match in re.finditer(r'\{[^}]+\}', match.group(1)):
        try:
            # JSON parsen (mit einfachen Anführungszeichen umgehen)
            video_str = video_match.group(0)
            video = json.loads(video_str)
            videos.append(video)
        except:
            continue

    return videos

def save_categories(video_categories):
    """Speichert Kategorien in separate JSON-Datei"""
    with open('data/video-categories.json', 'w', encoding='utf-8') as f:
        json.dump(video_categories, f, indent=2, ensure_ascii=False)
    print(f"Kategorien gespeichert in data/video-categories.json")

def main():
    print("=" * 60)
    print("LLM-basierte Video-Kategorisierung")
    print(f"Methode: {'Ollama (lokal)' if USE_OLLAMA else 'Groq API'}")
    print("=" * 60)

    # API Key prüfen
    if not USE_OLLAMA and not os.environ.get("GROQ_API_KEY"):
        print("FEHLER: GROQ_API_KEY nicht gesetzt!")
        print("Setze: export GROQ_API_KEY='dein-key'")
        print("Hol dir einen kostenlosen Key: https://console.groq.com")
        return

    # Videos laden
    videos = load_videos_from_media_html()
    print(f"\n{len(videos)} Videos gefunden\n")

    # Bestehende Kategorien laden falls vorhanden
    categories_file = 'data/video-categories.json'
    if os.path.exists(categories_file):
        with open(categories_file, 'r') as f:
            video_categories = json.load(f)
    else:
        os.makedirs('data', exist_ok=True)
        video_categories = {}

    # Neue Videos kategorisieren
    new_count = 0
    for i, video in enumerate(videos):
        video_id = video.get('id')
        title = video.get('title', '')
        desc = video.get('description', '')

        # Überspringen wenn bereits kategorisiert
        if video_id in video_categories:
            continue

        new_count += 1
        print(f"[{new_count}] {title[:50]}...")

        # Transkript holen (optional)
        transcript = get_transcript(video_id)

        # Kategorisieren
        if USE_OLLAMA:
            category = categorize_with_ollama(title, desc, transcript)
        else:
            category = categorize_with_groq(title, desc, transcript)

        if category:
            video_categories[video_id] = {
                "category": category,
                "title": title,
                "categorized_at": datetime.now().isoformat()
            }
            print(f"  → {category}")

        # Rate limiting für Groq (30 req/min)
        if not USE_OLLAMA and new_count % 25 == 0:
            import time
            print("  (Pause für Rate Limit...)")
            time.sleep(60)

    if new_count == 0:
        print("Alle Videos sind bereits kategorisiert!")
    else:
        save_categories(video_categories)
        print(f"\n{new_count} neue Videos kategorisiert")

    # Statistik
    print("\n" + "=" * 60)
    print("Kategorie-Verteilung:")
    counts = {}
    for v in video_categories.values():
        cat = v.get('category', 'unbekannt')
        counts[cat] = counts.get(cat, 0) + 1
    for cat, count in sorted(counts.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {count} Videos")

if __name__ == '__main__':
    main()
