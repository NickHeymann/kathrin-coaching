#!/bin/bash
# =============================================================================
# Daily LLM Analysis Cron Job
# Versucht täglich, noch nicht analysierte Blog-Posts mit Groq zu analysieren
#
# Groq Rate-Limit: 100k Tokens/Tag, resettet um Mitternacht UTC
# Empfohlene Cron-Zeit: 00:30 UTC (mit Buffer)
#
# Installation:
#   chmod +x scripts/daily-analysis-cron.sh
#   crontab -e
#   30 0 * * * /path/to/kathrin-coaching/scripts/daily-analysis-cron.sh >> /path/to/logs/analysis.log 2>&1
#
# Oder mit launchd auf macOS (siehe unten)
# =============================================================================

set -e

# Konfiguration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/logs/analysis-$(date +%Y-%m-%d).log"
LOCK_FILE="$PROJECT_ROOT/.analysis-running.lock"

# Groq API Key (aus Umgebungsvariable oder .env Datei)
if [ -z "$GROQ_API_KEY" ]; then
    if [ -f "$PROJECT_ROOT/.env" ]; then
        export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
    fi
fi

# Logging Setup
mkdir -p "$PROJECT_ROOT/logs"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Verhindere parallele Ausführung
if [ -f "$LOCK_FILE" ]; then
    log "⚠️  Analyse läuft bereits (Lock-File existiert). Abbruch."
    exit 0
fi

trap "rm -f $LOCK_FILE" EXIT
touch "$LOCK_FILE"

log "=============================================="
log "🚀 Starte tägliche LLM-Analyse"
log "=============================================="

cd "$PROJECT_ROOT"

# Prüfe ob API Key gesetzt ist
if [ -z "$GROQ_API_KEY" ]; then
    log "❌ GROQ_API_KEY nicht gesetzt!"
    log "   Setze den Key in .env oder als Umgebungsvariable"
    exit 1
fi

# Prüfe ob es noch Fallback-Analysen gibt
FALLBACK_COUNT=$(python3 -c "
import json
from pathlib import Path

f = Path('data/blog-intelligence.json')
if not f.exists():
    print(999)
else:
    data = json.load(open(f))
    fallbacks = sum(1 for a in data.get('articles', [])
                    if a.get('analysis', {}).get('_isFallback')
                    or a.get('analysis', {}).get('transformation', {}).get('von') == 'Suche')
    print(fallbacks)
" 2>/dev/null || echo "0")

if [ "$FALLBACK_COUNT" -eq 0 ]; then
    log "✅ Alle Artikel bereits mit LLM analysiert. Nichts zu tun."
    exit 0
fi

log "📊 $FALLBACK_COUNT Artikel mit Fallback-Analyse gefunden"

# Führe Analyse aus (ohne --skip-existing, damit Fallbacks überschrieben werden)
log "🔄 Starte LLM-Analyse..."
if python3 scripts/analyze-with-llm.py 2>&1 | tee -a "$LOG_FILE"; then
    log "✅ Analyse abgeschlossen"

    # Generiere Smart Connections neu
    log "🔗 Generiere Smart Connections..."
    if python3 scripts/generate-smart-connections.py --no-embeddings 2>&1 | tee -a "$LOG_FILE"; then
        log "✅ Smart Connections aktualisiert"
    else
        log "⚠️  Smart Connections fehlgeschlagen"
    fi

    # Optional: Git commit und push
    if git diff --quiet data/blog-intelligence.json 2>/dev/null; then
        log "📝 Keine Änderungen zu committen"
    else
        log "📤 Committe Änderungen..."
        git add data/blog-intelligence.json
        git commit -m "Auto-update: LLM analysis for blog posts [cron]

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
        git push
        log "✅ Änderungen gepusht"
    fi
else
    log "⚠️  Analyse mit Fehlern beendet (möglicherweise Rate-Limit)"
fi

log "🏁 Cron Job beendet"
log ""
