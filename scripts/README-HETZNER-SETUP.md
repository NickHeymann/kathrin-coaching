# Hetzner Server Setup für automatische Video-Kategorisierung

## TODO: Dieses Setup durchführen wenn Hetzner Server eingerichtet ist

### Übersicht
Dieses Setup ermöglicht:
1. Automatisches Scrapen neuer YouTube-Videos
2. LLM-basierte Kategorisierung (kostenlos mit Groq oder Ollama)
3. Automatisches Update der Website

---

## Option A: Groq API (empfohlen für Anfang)

### 1. Groq API Key holen (kostenlos)
```bash
# Gehe zu: https://console.groq.com
# Erstelle Account und generiere API Key
```

### 2. Server einrichten
```bash
# Python und Dependencies installieren
sudo apt update
sudo apt install python3 python3-pip git

# Repository klonen
git clone https://github.com/NickHeymann/kathrin-coaching.git
cd kathrin-coaching

# Dependencies installieren
pip3 install youtube-transcript-api groq

# API Key setzen (in ~/.bashrc einfügen für Persistenz)
export GROQ_API_KEY="dein-groq-api-key"
```

### 3. Cron Job einrichten
```bash
# Crontab öffnen
crontab -e

# Diese Zeile hinzufügen (läuft täglich um 7:00 Uhr):
0 7 * * * cd /pfad/zu/kathrin-coaching && export GROQ_API_KEY="dein-key" && python3 scripts/scrape-youtube.py && python3 scripts/categorize-with-llm.py && git add -A && git commit -m "Auto-Update Videos" && git push origin main
```

---

## Option B: Ollama (komplett kostenlos, lokal)

### 1. Ollama installieren
```bash
curl -fsSL https://ollama.com/install.sh | sh

# Modell herunterladen (ca. 4GB)
ollama pull llama3.2
```

### 2. Script anpassen
```python
# In scripts/categorize-with-llm.py ändern:
USE_OLLAMA = True
```

### 3. Cron Job einrichten
```bash
0 7 * * * cd /pfad/zu/kathrin-coaching && python3 scripts/scrape-youtube.py && python3 scripts/categorize-with-llm.py && git add -A && git commit -m "Auto-Update Videos" && git push origin main
```

---

## Server-Anforderungen

| Option | RAM | CPU | Kosten |
|--------|-----|-----|--------|
| Groq API | 1GB | 1 vCPU | ~3€/Monat (CX11) |
| Ollama | 8GB+ | 2+ vCPU | ~15€/Monat (CX31) |

---

## Dateien

- `scripts/scrape-youtube.py` - Scraped neue Videos von YouTube
- `scripts/categorize-with-llm.py` - Kategorisiert Videos mit LLM
- `data/video-categories.json` - Gespeicherte Kategorien (wird automatisch erstellt)

---

## Troubleshooting

### Groq Rate Limit
- Kostenlos: 30 Requests/Minute
- Script hat automatische Pausen eingebaut

### Ollama zu langsam
- Kleineres Modell nutzen: `ollama pull llama3.2:1b`
- Oder: Groq API verwenden

### Git Push fehlgeschlagen
```bash
# SSH Key für GitHub einrichten
ssh-keygen -t ed25519 -C "deine-email@example.com"
cat ~/.ssh/id_ed25519.pub
# Diesen Key in GitHub Settings → SSH Keys hinzufügen
```

---

## Kontakt
Bei Fragen: Claude Code Session fortsetzen oder GitHub Issues erstellen.
