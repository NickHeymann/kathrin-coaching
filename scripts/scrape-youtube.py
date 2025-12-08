#!/usr/bin/env python3
"""
YouTube Video Scraper für Kathrin Stahl's Kanal
Scraped alle Videos und aktualisiert media.html automatisch
Nutzt YouTube's interne API für vollständige Video-Liste
"""

import subprocess
import json
import re
from datetime import datetime, timedelta

CHANNEL_ID = 'UCxjysqaDv62bNh5bwaHLIbQ'
CHANNEL_URL = f'https://www.youtube.com/channel/{CHANNEL_ID}/videos'

def parse_relative_date(relative_str):
    """Konvertiert 'vor X Tagen/Wochen/Monaten/Jahren' zu ISO-Datum"""
    now = datetime.now()

    if not relative_str:
        return now.strftime('%Y-%m-%d')

    relative_str = relative_str.lower()

    patterns = [
        (r'(\d+) tag', 'days'),
        (r'(\d+) woche', 'weeks'),
        (r'(\d+) monat', 'months'),
        (r'(\d+) jahr', 'years'),
        (r'(\d+) day', 'days'),
        (r'(\d+) week', 'weeks'),
        (r'(\d+) month', 'months'),
        (r'(\d+) year', 'years'),
    ]

    for pattern, unit in patterns:
        match = re.search(pattern, relative_str)
        if match:
            value = int(match.group(1))
            if unit == 'days':
                delta = timedelta(days=value)
            elif unit == 'weeks':
                delta = timedelta(weeks=value)
            elif unit == 'months':
                delta = timedelta(days=value * 30)
            elif unit == 'years':
                delta = timedelta(days=value * 365)
            return (now - delta).strftime('%Y-%m-%d')

    return now.strftime('%Y-%m-%d')

def extract_videos_from_contents(contents):
    """Extrahiert Videos aus YouTube API Response"""
    videos = []
    for item in contents:
        video = item.get('richItemRenderer', {}).get('content', {}).get('videoRenderer', {})
        if video:
            vid = video.get('videoId', '')
            title = video.get('title', {}).get('runs', [{}])[0].get('text', '')
            published = video.get('publishedTimeText', {}).get('simpleText', '')
            desc_runs = video.get('descriptionSnippet', {}).get('runs', [])
            desc = ''.join([r.get('text', '') for r in desc_runs])[:150]
            if vid and title:
                videos.append({
                    'id': vid,
                    'title': title,
                    'published': published,
                    'description': desc.replace('"', "'").replace('\n', ' ').replace('\\', '')
                })
    return videos

def scrape_youtube_videos():
    """Scraped alle Videos von YouTube Kanal über Continuation API"""
    try:
        # Erste Seite laden mit curl
        result = subprocess.run([
            'curl', '-sL', CHANNEL_URL,
            '--user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            '-H', 'Accept-Language: de-DE,de;q=0.9,en;q=0.8'
        ], capture_output=True, text=True, timeout=60)

        html = result.stdout

        if not html or len(html) < 10000:
            print(f"Ungültige Antwort erhalten (Länge: {len(html) if html else 0})")
            return []

        # API Key extrahieren
        api_key_match = re.search(r'"INNERTUBE_API_KEY":"([^"]+)"', html)
        if not api_key_match:
            print("Konnte API Key nicht finden")
            return []
        api_key = api_key_match.group(1)

        # ytInitialData JSON extrahieren
        start_marker = 'ytInitialData = '
        start_idx = html.find(start_marker)

        if start_idx == -1:
            print("Konnte ytInitialData nicht finden")
            return []

        start_idx += len(start_marker)

        # Finde schließende Klammer durch Zählen
        brace_count = 0
        end_idx = start_idx
        in_string = False
        escape_next = False

        for i, char in enumerate(html[start_idx:start_idx+500000], start_idx):
            if escape_next:
                escape_next = False
                continue
            if char == '\\':
                escape_next = True
                continue
            if char == '"' and not escape_next:
                in_string = not in_string
                continue
            if in_string:
                continue
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_idx = i + 1
                    break

        data = json.loads(html[start_idx:end_idx])

        all_videos = []
        continuation_token = None

        # Videos von erster Seite extrahieren
        tabs = data.get('contents', {}).get('twoColumnBrowseResultsRenderer', {}).get('tabs', [])
        for tab in tabs:
            tab_content = tab.get('tabRenderer', {}).get('content', {})
            contents = tab_content.get('richGridRenderer', {}).get('contents', [])
            all_videos.extend(extract_videos_from_contents(contents))

            # Continuation Token finden
            for item in contents:
                cont = item.get('continuationItemRenderer', {}).get('continuationEndpoint', {}).get('continuationCommand', {}).get('token')
                if cont:
                    continuation_token = cont

        print(f"Erste Seite: {len(all_videos)} Videos")

        # Weitere Seiten laden
        page = 2
        while continuation_token and page < 20:
            continuation_url = f"https://www.youtube.com/youtubei/v1/browse?key={api_key}"

            payload = {
                "context": {
                    "client": {
                        "clientName": "WEB",
                        "clientVersion": "2.20231208.01.00",
                        "hl": "de",
                        "gl": "DE"
                    }
                },
                "continuation": continuation_token
            }

            result = subprocess.run([
                'curl', '-sL', continuation_url,
                '-H', 'Content-Type: application/json',
                '-d', json.dumps(payload)
            ], capture_output=True, text=True, timeout=30)

            try:
                data = json.loads(result.stdout)
                actions = data.get('onResponseReceivedActions', [])

                if not actions:
                    break

                items = actions[0].get('appendContinuationItemsAction', {}).get('continuationItems', [])

                page_videos = extract_videos_from_contents(items)
                all_videos.extend(page_videos)

                print(f"Seite {page}: {len(page_videos)} Videos (Gesamt: {len(all_videos)})")

                # Nächsten Token finden
                continuation_token = None
                for item in items:
                    cont = item.get('continuationItemRenderer', {}).get('continuationEndpoint', {}).get('continuationCommand', {}).get('token')
                    if cont:
                        continuation_token = cont
                        break

                page += 1

            except Exception as e:
                print(f"Fehler auf Seite {page}: {e}")
                break

        print(f"Gesamt: {len(all_videos)} Videos gefunden")
        return all_videos

    except Exception as e:
        print(f"Fehler beim Scrapen: {e}")
        return []

def update_media_html(videos):
    """Aktualisiert die EMBEDDED_VIDEOS in media.html"""
    if not videos:
        print("Keine Videos zum Aktualisieren")
        return False

    # media.html lesen
    with open('media.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Bestehende Video-IDs extrahieren
    existing_match = re.search(r'const EMBEDDED_VIDEOS = \[(.*?)\];', content, re.DOTALL)
    if not existing_match:
        print("EMBEDDED_VIDEOS nicht gefunden in media.html")
        return False

    # Existierende IDs sammeln
    existing_ids = set(re.findall(r'"id":\s*"([^"]+)"', existing_match.group(1)))
    print(f"Existierende Videos: {len(existing_ids)}")

    # Neue Videos finden
    new_videos = [v for v in videos if v['id'] not in existing_ids]

    if not new_videos:
        print("Keine neuen Videos gefunden")
        return False

    print(f"Neue Videos gefunden: {len(new_videos)}")

    # Neue Video-Einträge formatieren
    new_entries = []
    for v in new_videos:
        title = v['title'].replace('\\', '').replace('"', '\\"')
        desc = v['description'].replace('\\', '').replace('"', '\\"')[:120]
        date = parse_relative_date(v['published'])
        new_entries.append(
            f'{{"id": "{v["id"]}", "title": "{title}", "description": "{desc}", "published": "{date}"}}'
        )

    # Bestehende Einträge extrahieren
    existing_entries = re.findall(r'\{[^}]+\}', existing_match.group(1))

    # Alle Einträge kombinieren (neue zuerst)
    all_entries = new_entries + existing_entries

    # Neuen Block erstellen
    today = datetime.now().strftime('%Y-%m-%d')
    new_block = f'''// Eingebettete Video-Daten (gescraped von YouTube - wird regelmäßig aktualisiert)
        // Letztes Update: {today}
        // Gesamt: {len(all_entries)} Videos
        const EMBEDDED_VIDEOS = [
            {",\n            ".join(all_entries)}
        ];'''

    # Block in Datei ersetzen
    pattern = r'// Eingebettete Video-Daten.*?const EMBEDDED_VIDEOS = \[.*?\];'
    content = re.sub(pattern, new_block, content, flags=re.DOTALL)

    # Datei schreiben
    with open('media.html', 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"media.html aktualisiert mit {len(new_videos)} neuen Videos (Gesamt: {len(all_entries)})")
    return True

def main():
    print(f"Starte YouTube Scraper für Kanal {CHANNEL_ID}")
    print("=" * 50)

    videos = scrape_youtube_videos()

    if videos:
        update_media_html(videos)
    else:
        print("Keine Videos gefunden - behalte existierende Daten")

if __name__ == '__main__':
    main()
