#!/usr/bin/env python3
"""
Smart Connection Engine - Phase 3 & 4
Berechnet semantische Ähnlichkeiten und generiert intelligente Verbindungen

Verwendung:
    OPENAI_API_KEY=xxx python scripts/generate-smart-connections.py

    Oder ohne Embeddings (nur regelbasiert):
    python scripts/generate-smart-connections.py --no-embeddings

Output:
    data/blog-intelligence.json (aktualisiert mit 'related' Feld)
"""

import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime
import random

# Konfiguration
PROJECT_ROOT = Path(__file__).parent.parent
INPUT_FILE = PROJECT_ROOT / "data" / "blog-intelligence.json"
OUTPUT_FILE = PROJECT_ROOT / "data" / "blog-intelligence.json"

# Verbindungstypen mit Begründungen
CONNECTION_TYPES = {
    'vertiefung': [
        "Geht noch tiefer in dieses Thema",
        "Vertieft den Gedanken aus dem aktuellen Artikel",
        "Führt dich weiter auf diesem Weg"
    ],
    'neue-perspektive': [
        "Ein anderer Blickwinkel auf das Gleiche",
        "Eine neue Perspektive, die dich überraschen könnte",
        "Schaut aus einer anderen Richtung auf dieses Thema"
    ],
    'naechster-schritt': [
        "Der logische nächste Schritt auf deiner Reise",
        "Wenn du bereit bist, weiterzugehen...",
        "Baut auf dem auf, was du gerade gelesen hast"
    ],
    'heilungsreise': [
        "Für den nächsten Schritt deiner inneren Arbeit",
        "Wenn du tiefer in deine Heilung gehen möchtest",
        "Begleitet dich weiter auf deinem Weg"
    ],
    'ergaenzung': [
        "Hängt eng damit zusammen",
        "Ein verwandtes Thema, das dich inspirieren könnte",
        "Ergänzt deine aktuelle Lektüre"
    ]
}

# Thematische Reisen (Transformation Maps)
JOURNEY_MAPS = {
    # Angst → Frieden
    "angst-reise": {
        "themes": ["angst", "angst-vor-eigener-groesse", "unsicherheit", "zweifel"],
        "next": ["innere-ruhe", "koerper-als-verbuendeter", "annehmen-statt-kaempfen", "innerer-frieden", "praesenz"],
        "type": "heilungsreise"
    },
    # Selbstzweifel → Selbstliebe
    "selbstwert-reise": {
        "themes": ["selbstzweifel", "innerer-kritiker", "perfektionismus", "nicht-genug-sein"],
        "next": ["selbstmitgefuehl", "fehler-als-lernfeld", "selbstakzeptanz", "eigene-groesse-annehmen"],
        "type": "naechster-schritt"
    },
    # Krise → Klarheit
    "klarheits-reise": {
        "themes": ["beziehungskrise", "lebensentscheidung", "orientierungslos", "unentschlossen"],
        "next": ["klarheit", "intuition", "innere-fuehrung", "entscheidung"],
        "type": "naechster-schritt"
    },
    # Loslassen
    "loslassen-reise": {
        "themes": ["festhalten", "kontrolle", "vergangenheit", "trauer"],
        "next": ["loslassen", "annehmen", "neubeginn", "transformation"],
        "type": "heilungsreise"
    }
}

# Kategorie-Verwandtschaften
RELATED_CATEGORIES = {
    'achtsamkeit': ['selbstliebe', 'koerper', 'hochbegabung'],
    'selbstliebe': ['achtsamkeit', 'heldinnenreise', 'beziehung'],
    'beziehung': ['selbstliebe', 'hochbegabung', 'achtsamkeit'],
    'heldinnenreise': ['selbstliebe', 'hochbegabung', 'achtsamkeit'],
    'hochbegabung': ['selbstliebe', 'achtsamkeit', 'koerper'],
    'koerper': ['achtsamkeit', 'hochbegabung', 'selbstliebe']
}


def calculate_theme_similarity(themes1, themes2):
    """Berechnet Ähnlichkeit basierend auf gemeinsamen Themen"""
    if not themes1 or not themes2:
        return 0

    # Exakte Übereinstimmungen
    common = set(themes1) & set(themes2)
    score = len(common) * 10

    # Partielle Übereinstimmungen (Substring-Match)
    for t1 in themes1:
        for t2 in themes2:
            if t1 != t2:
                if t1 in t2 or t2 in t1:
                    score += 3
                # Wortweise Überlappung
                words1 = set(t1.split('-'))
                words2 = set(t2.split('-'))
                common_words = words1 & words2
                if common_words:
                    score += len(common_words) * 2

    return score


def calculate_transformation_similarity(trans1, trans2):
    """Berechnet Ähnlichkeit basierend auf Transformationen"""
    if not trans1 or not trans2:
        return 0

    score = 0

    # Gleicher Ausgangszustand
    if trans1.get('von', '').lower() == trans2.get('von', '').lower():
        score += 8

    # Gleicher Zielzustand
    if trans1.get('zu', '').lower() == trans2.get('zu', '').lower():
        score += 8

    # Zielzustand von einem ist Ausgangszustand vom anderen (Reise!)
    if trans1.get('zu', '').lower() == trans2.get('von', '').lower():
        score += 15  # Sehr hohe Relevanz für "nächster Schritt"

    return score


def find_journey_connection(article, all_articles):
    """Findet Artikel die auf der gleichen Reise weiterführen"""
    connections = []

    analysis = article.get('analysis', {})
    themes = analysis.get('tiefenthemen', [])

    for journey_name, journey in JOURNEY_MAPS.items():
        # Ist dieser Artikel Teil einer Reise?
        if any(t in themes for t in journey['themes']):
            # Finde Artikel mit "next" Themen
            for other in all_articles:
                if other['url'] == article['url']:
                    continue

                other_themes = other.get('analysis', {}).get('tiefenthemen', [])
                if any(t in other_themes for t in journey['next']):
                    connections.append({
                        'url': other['url'],
                        'type': journey['type'],
                        'score': 20,
                        'journey': journey_name
                    })

    return connections


def generate_reason(article, other_article, connection_type):
    """Generiert eine personalisierte Begründung"""
    analysis = article.get('analysis', {})
    other_analysis = other_article.get('analysis', {})

    # Verwende LLM-generierte Begründungen wenn verfügbar
    llm_reasons = other_analysis.get('empfehlungsBegründungen', [])
    if llm_reasons:
        return random.choice(llm_reasons)

    # Fallback: Template-basiert
    templates = CONNECTION_TYPES.get(connection_type, CONNECTION_TYPES['ergaenzung'])
    base_reason = random.choice(templates)

    # Personalisiere mit Themen
    themes = other_analysis.get('tiefenthemen', [])
    if themes:
        theme = themes[0].replace('-', ' ')
        return f"{base_reason} – über {theme}"

    return base_reason


def calculate_connections_with_embeddings(articles, api_key):
    """Berechnet Verbindungen mit OpenAI Embeddings"""
    from openai import OpenAI
    import numpy as np

    print("🧮 Generiere Embeddings...")

    client = OpenAI(api_key=api_key)

    # Erstelle Text für Embedding (Titel + Kernbotschaft + Themes)
    def get_embedding_text(article):
        analysis = article.get('analysis', {})
        parts = [
            article.get('title', ''),
            analysis.get('kernbotschaft', ''),
            ' '.join(analysis.get('tiefenthemen', []))
        ]
        return ' '.join(parts)

    # Batch-Embedding (effizienter)
    texts = [get_embedding_text(a) for a in articles]

    response = client.embeddings.create(
        input=texts,
        model="text-embedding-3-small"
    )

    embeddings = [r.embedding for r in response.data]

    # Cosine Similarity Matrix
    def cosine_similarity(a, b):
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

    print("🔗 Berechne Ähnlichkeiten...")

    similarity_matrix = {}
    for i, article in enumerate(articles):
        url = article['url']
        similarities = []

        for j, other in enumerate(articles):
            if i != j:
                sim = cosine_similarity(embeddings[i], embeddings[j])
                similarities.append({
                    'url': other['url'],
                    'similarity': float(sim)
                })

        # Sortiere nach Ähnlichkeit
        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        similarity_matrix[url] = similarities[:15]  # Top 15

    return similarity_matrix


def calculate_connections_rule_based(articles):
    """Berechnet Verbindungen ohne Embeddings (regelbasiert)"""
    print("🔗 Berechne regelbasierte Verbindungen...")

    connections = {}

    for article in articles:
        url = article['url']
        analysis = article.get('analysis', {})
        category = article.get('category', '')
        themes = analysis.get('tiefenthemen', [])
        transformation = analysis.get('transformation', {})

        scored_connections = []

        for other in articles:
            if other['url'] == url:
                continue

            other_analysis = other.get('analysis', {})
            other_category = other.get('category', '')
            other_themes = other_analysis.get('tiefenthemen', [])
            other_transformation = other_analysis.get('transformation', {})

            score = 0
            conn_type = 'ergaenzung'

            # 1. Gleiche Kategorie
            if category == other_category:
                score += 15
                conn_type = 'vertiefung'

            # 2. Verwandte Kategorie
            elif other_category in RELATED_CATEGORIES.get(category, []):
                score += 8
                conn_type = 'ergaenzung'

            # 3. Themen-Ähnlichkeit
            theme_score = calculate_theme_similarity(themes, other_themes)
            score += theme_score
            if theme_score > 15:
                conn_type = 'vertiefung'

            # 4. Transformations-Ähnlichkeit
            trans_score = calculate_transformation_similarity(transformation, other_transformation)
            score += trans_score
            if trans_score > 10:
                conn_type = 'naechster-schritt'

            # 5. Gleiche emotionale Tonalität
            if analysis.get('emotionaleTonalitaet') == other_analysis.get('emotionaleTonalitaet'):
                score += 5

            # 6. Gleiche Lebensphase
            phases1 = set(analysis.get('lebensphase', []))
            phases2 = set(other_analysis.get('lebensphase', []))
            if phases1 & phases2:
                score += 5

            if score > 0:
                scored_connections.append({
                    'url': other['url'],
                    'score': score,
                    'type': conn_type
                })

        # Journey-Connections hinzufügen
        journey_conns = find_journey_connection(article, articles)
        for jc in journey_conns:
            existing = next((c for c in scored_connections if c['url'] == jc['url']), None)
            if existing:
                existing['score'] += jc['score']
                existing['type'] = jc['type']
            else:
                scored_connections.append(jc)

        # Sortiere und nimm Top 10
        scored_connections.sort(key=lambda x: x['score'], reverse=True)
        connections[url] = scored_connections[:10]

    return connections


def main():
    parser = argparse.ArgumentParser(description='Smart Connection Engine')
    parser.add_argument('--no-embeddings', action='store_true',
                        help='Nur regelbasierte Verbindungen (keine API nötig)')
    args = parser.parse_args()

    print("=" * 60)
    print("SMART CONNECTION ENGINE - Phase 3 & 4")
    print("=" * 60)
    print()

    # Lade analysierte Artikel
    if not INPUT_FILE.exists():
        print(f"❌ Input-Datei nicht gefunden: {INPUT_FILE}")
        print("   Führe zuerst aus: python scripts/analyze-with-llm.py")
        sys.exit(1)

    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    articles = [a for a in data['articles'] if a.get('type') == 'blog']
    print(f"📊 {len(articles)} Blog-Posts geladen")
    print()

    # Berechne Verbindungen
    if args.no_embeddings:
        connections = calculate_connections_rule_based(articles)
        embeddings_used = False
    else:
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            print("⚠️  OPENAI_API_KEY nicht gesetzt, verwende regelbasierte Verbindungen")
            connections = calculate_connections_rule_based(articles)
            embeddings_used = False
        else:
            similarity_matrix = calculate_connections_with_embeddings(articles, api_key)
            # Kombiniere mit regelbasierten Verbindungen
            rule_connections = calculate_connections_rule_based(articles)

            connections = {}
            for article in articles:
                url = article['url']

                # Merge: Embedding-Similarity + Rule-Score
                merged = {}

                for sim in similarity_matrix.get(url, []):
                    merged[sim['url']] = {
                        'url': sim['url'],
                        'similarity': sim['similarity'],
                        'score': sim['similarity'] * 50  # Normalisiere auf ~50
                    }

                for rule in rule_connections.get(url, []):
                    if rule['url'] in merged:
                        merged[rule['url']]['score'] += rule['score']
                        merged[rule['url']]['type'] = rule.get('type', 'ergaenzung')
                    else:
                        merged[rule['url']] = {
                            'url': rule['url'],
                            'score': rule['score'],
                            'type': rule.get('type', 'ergaenzung')
                        }

                # Sortiere und nimm Top 10
                sorted_conns = sorted(merged.values(), key=lambda x: x['score'], reverse=True)[:10]
                connections[url] = sorted_conns

            embeddings_used = True

    print()
    print("📝 Generiere Begründungen...")

    # Füge 'related' zu jedem Artikel hinzu
    article_lookup = {a['url']: a for a in articles}

    for article in articles:
        url = article['url']
        article_connections = connections.get(url, [])

        related = []
        for conn in article_connections:
            other_url = conn['url']
            other_article = article_lookup.get(other_url)

            if not other_article:
                continue

            conn_type = conn.get('type', 'ergaenzung')
            reason = generate_reason(article, other_article, conn_type)

            related.append({
                'url': other_url,
                'title': other_article.get('title', ''),
                'image': other_article.get('image', ''),
                'excerpt': other_article.get('excerpt', '')[:150],
                'category': other_article.get('category', ''),
                'reason': reason,
                'type': conn_type,
                'score': round(conn.get('score', 0), 2)
            })

        article['related'] = related

    # Update data
    data['articles'] = data['articles']  # Behält alle Artikel (auch non-blog)
    data['connectionsGeneratedAt'] = datetime.now().isoformat()
    data['embeddingsUsed'] = embeddings_used

    # Speichere
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print()
    print("-" * 60)
    print("STATISTIKEN")
    print("-" * 60)
    print(f"  Artikel mit Verbindungen: {len([a for a in articles if a.get('related')])}")
    print(f"  Durchschnittliche Verbindungen: {sum(len(a.get('related', [])) for a in articles) / len(articles):.1f}")
    print(f"  Embeddings verwendet: {'Ja' if embeddings_used else 'Nein'}")
    print()
    print(f"💾 Gespeichert: {OUTPUT_FILE}")
    print()
    print("✅ Phase 3 & 4 abgeschlossen!")
    print("   Die Daten sind bereit für die JavaScript-Integration.")


if __name__ == '__main__':
    main()
