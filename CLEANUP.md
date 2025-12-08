# Asset Cleanup Guide

Diese Dokumentation beschreibt welche Dateien/Verzeichnisse wahrscheinlich nicht benötigt werden und sicher gelöscht werden können.

## ⚠️ Wichtig vor dem Löschen

1. **Backup erstellen**: `git stash` oder Branch erstellen
2. **Lokal testen**: Nach dem Löschen alle Seiten prüfen
3. **Schrittweise vorgehen**: Nicht alles auf einmal löschen

## Wahrscheinlich nicht benötigte WordPress-Plugins

Diese Plugins wurden von der ursprünglichen WordPress-Installation übernommen, sind aber auf der statischen Seite nicht mehr aktiv:

### Definitiv entfernbar
```
wp-content/plugins/woocommerce/     # E-Commerce (nicht genutzt)
wp-content/plugins/learnpress/      # Kurse (nicht genutzt)
wp-content/plugins/ameliabooking/   # Buchung (ersetzt durch Cal.com)
```

### Mit Vorsicht prüfen
```
wp-content/plugins/jet-popup/       # Prüfen ob Popups noch funktionieren
wp-content/plugins/insta-gallery/   # Instagram Feed (noch benötigt?)
```

### Behalten
```
wp-content/plugins/elementor/       # Wird für Layout benötigt
wp-content/plugins/jet-elements/    # Wird für Layout benötigt
wp-content/plugins/pixelwars-core/  # Theme-Abhängigkeit
wp-content/themes/efor/             # Haupt-Theme (behalten!)
wp-content/uploads/                 # Alle Bilder (behalten!)
```

## wp-json Verzeichnis

Das `wp-json/` Verzeichnis enthält WordPress REST API Ausgaben die nicht mehr benötigt werden:

```bash
# Komplett entfernbar:
rm -rf wp-json/
```
Größe: ~4.5 MB

## wp-includes Verzeichnis

Prüfen welche JS/CSS davon in HTML-Dateien referenziert werden:

- `wp-includes/js/jquery/` - **Behalten** (wird vielfach genutzt)
- `wp-includes/css/dist/` - Prüfen ob Gutenberg-Styles benötigt

## Cleanup-Befehle

### Schritt 1: Sichere Löschungen
```bash
# WordPress JSON API
rm -rf wp-json/

# WooCommerce (E-Commerce nicht genutzt)
rm -rf wp-content/plugins/woocommerce/

# LearnPress (Kurse nicht genutzt)
rm -rf wp-content/plugins/learnpress/

# Amelia Booking (ersetzt durch Cal.com)
rm -rf wp-content/plugins/ameliabooking/
```

### Schritt 2: Nach Test weitere Bereinigung
```bash
# Nach erfolgreichem Test der Seite:
rm -rf wp-content/plugins/jet-popup/
rm -rf wp-content/plugins/insta-gallery/
```

### Geschätzte Einsparung
- wp-json: ~4.5 MB
- woocommerce: ~15 MB
- learnpress: ~5 MB
- ameliabooking: ~10 MB
- **Gesamt: ~35 MB** (ca. 30% Reduktion)

## Asset-Analyse Script

Für eine detailliertere Analyse:
```bash
node scripts/analyze-assets.js
```

## Nach dem Cleanup

1. Alle HTML-Seiten im Browser testen
2. JavaScript-Konsole auf Fehler prüfen
3. Bilder und Styling prüfen
4. Mobile Version testen
5. `git add -A && git commit -m "Cleanup: Remove unused WordPress assets"`
