# Kathrin Coaching Website - Setup Guide

## Übersicht

Diese statische Website wurde von coaching.kathrinstahl.com exportiert und für GitHub Pages optimiert.

## Änderungen am Original

### 1. WordPress-Abhängigkeiten entfernt
- Absolute URLs zu relativen Pfaden geändert
- WordPress API-Links entfernt (wp-json, api.w.org)
- AJAX-URLs und jetPopupData bereinigt
- RSS-Feeds, Pingback, XMLrpc entfernt

### 2. UI-Fixes (custom-fixes.css)
- Dropdown-Pfeile für Navigationsmenüs
- Equal-Height Cards für Blog-Posts
- Verbesserte Text-Lesbarkeit auf Bildern
- Optimierte CTA-Buttons
- Mobile Responsiveness Verbesserungen

### 3. Rechtschreibkorrekturen
- "Beziehungsgprobleme" → "Beziehungsprobleme"
- "mehrsteres" → "mehreres"
- "mehr Lebens spüren" → "mehr Leben spüren"
- "Komm setz dich" → "Komm, setz dich"

---

## Cal.com + Stripe Setup

### Schritt 1: Cal.com Account erstellen

1. Gehe zu [cal.com](https://cal.com) und erstelle einen Account
2. Wähle einen Username (z.B. "kathrin-stahl")

### Schritt 2: Event Types erstellen

Erstelle folgende Event Types in Cal.com:

| Event Name | Slug | Dauer | Preis |
|------------|------|-------|-------|
| Kostenloses Erstgespräch | erstgespraech | 30 min | Kostenlos |
| 1:1 Coaching Session | einzelcoaching | 60 min | [Dein Preis] |
| Paar-Coaching Session | paarcoaching | 90 min | [Dein Preis] |
| Retreat-Beratung | retreat-beratung | 45 min | Kostenlos |

### Schritt 3: Stripe verbinden

1. Gehe zu Cal.com → Settings → Billing
2. Klicke "Connect Stripe"
3. Folge den Anweisungen zur Stripe-Verknüpfung
4. Füge Preise zu deinen Event Types hinzu

### Schritt 4: Website konfigurieren

Öffne `cal-booking.js` und ändere:

```javascript
const CAL_CONFIG = {
    username: "kathrin-stahl",  // Dein Cal.com Username
    events: {
        erstgespraech: "erstgespraech",
        einzelcoaching: "einzelcoaching",
        paarcoaching: "paarcoaching",
        retreat: "retreat-beratung"
    },
    brandColor: "#D2AB74"  // Deine Markenfarbe
};
```

### Schritt 5: Booking Buttons verwenden

**Option A: Data-Attribut (empfohlen)**
```html
<button data-cal-booking="erstgespraech">Termin buchen</button>
```

**Option B: JavaScript-Funktion**
```html
<button onclick="bookErstgespraech()">Kostenloses Gespräch</button>
<button onclick="bookEinzelcoaching()">1:1 Coaching buchen</button>
<button onclick="bookPaarcoaching()">Paar-Coaching buchen</button>
```

**Option C: Generische Funktion**
```html
<button onclick="openBooking('einzelcoaching')">Buchen</button>
```

---

## GitHub Pages Deployment

Die Website ist bereits unter folgender URL verfügbar:
**https://nickheymann.github.io/kathrin-coaching/**

### Bei Änderungen neu deployen:

```bash
cd ~/Desktop/kathrin-coaching-github
git add .
git commit -m "Update website"
git push
```

GitHub Pages aktualisiert automatisch innerhalb weniger Minuten.

---

## Dateien im Repository

```
kathrin-coaching-github/
├── index.html                 # Startseite
├── custom-fixes.css           # UI-Verbesserungen
├── cal-booking.js             # Cal.com Integration
├── SETUP.md                   # Diese Anleitung
├── wp-content/                # CSS, JS, Bilder
│   ├── themes/efor/           # Theme-Dateien
│   └── plugins/               # Plugin-Assets
├── [Seiten].html              # Alle Website-Seiten
└── category/                  # Blog-Kategorien
```

---

## Empfohlene nächste Schritte

### Kurzfristig:
1. [ ] Cal.com Account einrichten
2. [ ] Event Types erstellen
3. [ ] Stripe verbinden
4. [ ] Cal-Username in cal-booking.js anpassen

### Mittelfristig:
1. [ ] Custom Domain einrichten (coaching.kathrinstahl.com)
2. [ ] SSL-Zertifikat über GitHub Pages aktivieren
3. [ ] Google Analytics einbinden

### Langfristig (Website-Redesign):
1. [ ] Customer Journey vereinfachen (siehe Analyse)
2. [ ] Menü von 3 auf 2 Ebenen reduzieren
3. [ ] Zielgruppen-Landing-Pages erstellen
4. [ ] Blog-Kategorien konsolidieren

---

## Support

Bei Fragen zur Einrichtung: GitHub Issues erstellen oder Kontakt aufnehmen.

---

*Erstellt mit Claude Code*
