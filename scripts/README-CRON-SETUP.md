# Automatische LLM-Analyse - Cron Setup

Das Script `daily-analysis-cron.sh` führt täglich die LLM-Analyse für noch nicht analysierte Blog-Posts durch.

## Funktionsweise

1. Prüft ob noch Fallback-Analysen existieren
2. Führt LLM-Analyse mit Groq durch (nur für Fallbacks)
3. Generiert Smart Connections neu
4. Committed und pusht Änderungen automatisch

**Wichtig:** Echte LLM-Analysen werden NIEMALS überschrieben. Nur Fallback-Analysen werden ersetzt.

## Installation auf macOS (empfohlen)

```bash
# 1. Logs-Verzeichnis erstellen
mkdir -p ~/Desktop/kathrin-coaching-github/logs

# 2. .env Datei mit API Key erstellen
cp .env.example .env
# Dann .env bearbeiten und GROQ_API_KEY eintragen

# 3. LaunchAgent installieren
cp scripts/com.kathrin-coaching.daily-analysis.plist ~/Library/LaunchAgents/

# 4. LaunchAgent laden
launchctl load ~/Library/LaunchAgents/com.kathrin-coaching.daily-analysis.plist

# Status prüfen
launchctl list | grep kathrin
```

### LaunchAgent deaktivieren

```bash
launchctl unload ~/Library/LaunchAgents/com.kathrin-coaching.daily-analysis.plist
```

## Installation mit Cron (Linux/Alternative)

```bash
# Crontab öffnen
crontab -e

# Folgende Zeile hinzufügen (01:30 Uhr, nach Rate-Limit Reset um Mitternacht UTC):
30 1 * * * GROQ_API_KEY=dein_key /path/to/kathrin-coaching-github/scripts/daily-analysis-cron.sh >> /path/to/logs/cron.log 2>&1
```

## Manuell ausführen

```bash
cd ~/Desktop/kathrin-coaching-github
GROQ_API_KEY=xxx ./scripts/daily-analysis-cron.sh
```

## Groq Rate-Limits

- **Free Tier:** 100.000 Tokens/Tag
- **Reset:** Täglich um Mitternacht UTC (01:00 MEZ / 02:00 MESZ)
- **Pro Artikel:** ~1.500 Tokens

Das bedeutet: ~60-70 Artikel können pro Tag analysiert werden.

## Logs prüfen

```bash
# Aktuelle Logs ansehen
tail -f ~/Desktop/kathrin-coaching-github/logs/analysis-$(date +%Y-%m-%d).log

# LaunchAgent Logs
tail -f ~/Desktop/kathrin-coaching-github/logs/launchd-stdout.log
```

## Troubleshooting

### "Lock-File existiert"
Ein vorheriger Durchlauf wurde unterbrochen. Lösung:
```bash
rm ~/Desktop/kathrin-coaching-github/.analysis-running.lock
```

### "GROQ_API_KEY nicht gesetzt"
API Key in `.env` Datei eintragen oder als Umgebungsvariable setzen.

### Rate-Limit erreicht
Normal - das Script bricht ab und versucht es am nächsten Tag erneut.
Bereits erfolgreich analysierte Artikel bleiben erhalten.
