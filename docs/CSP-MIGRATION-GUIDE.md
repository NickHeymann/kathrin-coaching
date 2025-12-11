# CSP-Migration Guide: Entfernung von `unsafe-inline`

> **Projektübergreifende Best Practices für Content Security Policy Compliance**

## Übersicht

Diese Dokumentation beschreibt die Migration von inline Event-Handlern (`onclick`, `onchange`, etc.) zu einer CSP-konformen Event-Delegation-Architektur. Das Ziel ist die Entfernung von `unsafe-inline` aus der Content Security Policy.

---

## 1. Architektur-Pattern: Event Delegation

### Warum Event Delegation?

| Inline Handler (unsicher) | Event Delegation (CSP-safe) |
|---------------------------|------------------------------|
| `onclick="doSomething()"` | `data-action="doSomething"` |
| Erfordert `unsafe-inline` | Kein `unsafe-inline` nötig |
| Im HTML verteilt | Zentralisiert in JS |
| Schwer wartbar | Gut testbar |

### Grundprinzip

```javascript
// VORHER: Inline Handler (CSP-Verletzung)
<button onclick="saveData()">Speichern</button>

// NACHHER: Data-Attribute + Event Delegation
<button data-action="saveData">Speichern</button>
```

```javascript
// Event Delegation Handler
document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    if (typeof window[action] === 'function') {
        window[action](btn, e);
    }
});
```

---

## 2. Implementierungs-Strategie

### Phase 1: Analyse

```bash
# Zähle onclick Handler
grep -r "onclick=" --include="*.html" . | wc -l

# Nach Datei gruppiert
grep -r "onclick=" --include="*.html" . | cut -d: -f1 | sort | uniq -c | sort -rn
```

### Phase 2: Event-Delegation-Module erstellen

**Dateistruktur:**
```
js/
├── global.js              # Globale Event Delegation (Navigation, etc.)
├── pages/
│   └── index.js           # Seiten-spezifische Funktionen
├── components/
│   └── bookmark.js        # Komponenten-spezifische Logik
└── [tool]-events.js       # Tool-spezifische Event Handler
```

### Phase 3: Migration Scripts

Automatisierte Migration mit Python/Node Scripts:

```python
# Beispiel: migrate-onclick.py
import re

PATTERNS = [
    # Einfache Funktionsaufrufe
    (r'onclick="(\w+)\(\)"', r'data-action="\1"'),

    # Mit einem Parameter
    (r'onclick="(\w+)\(\'([^\']+)\'\)"',
     r'data-action="\1" data-param="\2"'),

    # Mit this-Referenz
    (r'onclick="(\w+)\(this\)"', r'data-action="\1"'),
]

def migrate_file(filepath):
    content = filepath.read_text()
    for pattern, replacement in PATTERNS:
        content = re.sub(pattern, replacement, content)
    filepath.write_text(content)
```

---

## 3. Event-Delegation-Template

### Basis-Template (global.js)

```javascript
/**
 * Global Event Delegation
 * CSP-safe - no inline handlers needed
 */
(function() {
    'use strict';

    // Action Registry
    const actions = {
        // Navigation
        'toggleMobileNav': () => toggleMobileNav(),
        'toggleDropdown': (btn) => toggleDropdown(btn.closest('.dropdown')),

        // Modals
        'openModal': (btn) => openModal(btn.dataset.modal),
        'closeModal': () => closeModal(),

        // Forms
        'submitForm': (btn) => submitForm(btn.closest('form')),
    };

    // Click Handler
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const action = btn.dataset.action;

        // Ausführen wenn registriert
        if (actions[action]) {
            e.preventDefault();
            actions[action](btn, e);
            return;
        }

        // Fallback: Globale Funktion
        if (typeof window[action] === 'function') {
            e.preventDefault();
            window[action](btn, e);
        }
    });

    // Keyboard Handler (Escape, Enter)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close all modals/menus
            document.querySelectorAll('.modal.active, .menu.open')
                .forEach(el => el.classList.remove('active', 'open'));
        }
    });

    console.log('Event Delegation loaded (CSP-safe)');
})();
```

### Erweitert mit Parameter-Handling

```javascript
document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    e.preventDefault();

    // Parameter aus data-Attributen extrahieren
    const params = {};
    for (const [key, value] of Object.entries(btn.dataset)) {
        if (key !== 'action') {
            params[key] = value;
        }
    }

    // Action mit Parametern ausführen
    switch (action) {
        case 'setBlockType':
            setBlockType(params.type, params.label);
            break;
        case 'setFont':
            setFont(params.font);
            break;
        case 'filterItems':
            filterItems(params.category);
            break;
        default:
            if (typeof window[action] === 'function') {
                window[action](params, btn, e);
            }
    }
});
```

---

## 4. HTML-Transformations-Patterns

### Einfache Handler

```html
<!-- VORHER -->
<button onclick="save()">Speichern</button>

<!-- NACHHER -->
<button data-action="save">Speichern</button>
```

### Handler mit Parametern

```html
<!-- VORHER -->
<button onclick="setTheme('dark')">Dark Mode</button>

<!-- NACHHER -->
<button data-action="setTheme" data-theme="dark">Dark Mode</button>
```

### Handler mit this-Referenz

```html
<!-- VORHER -->
<div onclick="toggleItem(this)">...</div>

<!-- NACHHER -->
<div data-action="toggleItem">...</div>
<!-- JS nutzt e.target.closest('[data-action]') -->
```

### Komplexe Handler (mehrere Aktionen)

```html
<!-- VORHER -->
<button onclick="save(); closeModal(); showToast('Gespeichert')">OK</button>

<!-- NACHHER -->
<button data-action="saveAndClose" data-toast="Gespeichert">OK</button>
```

```javascript
// Im JS
case 'saveAndClose':
    save();
    closeModal();
    showToast(params.toast);
    break;
```

---

## 5. Quiz/Formular-Spezifische Patterns

### Likert-Skala / Auswahl-Optionen

```html
<!-- VORHER -->
<div class="option" onclick="selectOption(this, 3)">
    <span>3</span>
</div>

<!-- NACHHER -->
<div class="option" data-value="3">
    <span>3</span>
</div>
```

```javascript
// Event Delegation für Quiz
document.addEventListener('click', function(e) {
    const option = e.target.closest('.option[data-value]');
    if (option) {
        const value = parseInt(option.dataset.value);
        selectOption(option, value);
    }
});
```

### Toggle-Elemente (Accordion, FAQ)

```html
<!-- VORHER -->
<div class="faq-header" onclick="toggleFaq(this)">Frage?</div>

<!-- NACHHER -->
<div class="faq-header" data-action="toggleFaq">Frage?</div>
```

---

## 6. ARIA-Integration

CSP-Migration ist eine gute Gelegenheit, ARIA-Attribute hinzuzufügen:

```javascript
// Bei Initialisierung ARIA setzen
document.querySelectorAll('.dropdown').forEach((dropdown, i) => {
    const trigger = dropdown.querySelector('.trigger');
    const menu = dropdown.querySelector('.menu');

    trigger.setAttribute('role', 'button');
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', `menu-${i}`);

    menu.setAttribute('id', `menu-${i}`);
    menu.setAttribute('aria-hidden', 'true');
});

// Bei Toggle ARIA aktualisieren
function toggleDropdown(dropdown) {
    const trigger = dropdown.querySelector('.trigger');
    const menu = dropdown.querySelector('.menu');
    const isOpen = menu.classList.toggle('open');

    trigger.setAttribute('aria-expanded', isOpen);
    menu.setAttribute('aria-hidden', !isOpen);
}
```

---

## 7. Migration-Checkliste

### Vor der Migration

- [ ] Backup erstellen / Git-Branch anlegen
- [ ] onclick Handler zählen und kategorisieren
- [ ] Event-Delegation-Struktur planen
- [ ] Test-Seite identifizieren

### Während der Migration

- [ ] `js/global.js` mit Event Delegation erstellen
- [ ] Seiten-spezifische JS-Dateien erstellen
- [ ] Migration-Script schreiben und testen
- [ ] Batch-Migration durchführen
- [ ] JS Syntax-Check: `node --check *.js`

### Nach der Migration

- [ ] onclick Handler erneut zählen
- [ ] Alle Funktionen manuell testen
- [ ] ARIA-Attribute verifizieren
- [ ] CSP-Header aktualisieren (unsafe-inline entfernen)
- [ ] Dokumentation aktualisieren

---

## 8. CSP-Header Konfiguration

### Netlify (_headers)

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.example.com
```

### Apache (.htaccess)

```apache
Header set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
```

### Nginx

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'";
```

---

## 9. Troubleshooting

### Problem: Funktion wird nicht gefunden

```javascript
// Debug: Prüfe ob Funktion existiert
document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (btn) {
        const action = btn.dataset.action;
        console.log('Action:', action, 'Exists:', typeof window[action]);
    }
});
```

### Problem: Parameter nicht übergeben

```javascript
// Debug: Alle data-Attribute ausgeben
console.log('Dataset:', {...btn.dataset});
```

### Problem: Event bubbling issues

```javascript
// Stoppt Event bei verschachtelten Elementen
if (e.target.closest('.nested-ignore')) {
    return;
}
```

---

## 10. Projekt-Statistiken (Kathrin Coaching)

| Metrik | Vorher | Nachher |
|--------|--------|---------|
| onclick in HTML | 450+ | 13 |
| onclick in JS Templates | ~100 | 50 |
| Öffentliche Seiten | 450+ | 0 |
| Event-Delegation-Dateien | 0 | 5 |
| CSP unsafe-inline | erforderlich | **entfernbar** |

### Erstellte Dateien

| Datei | Zweck | Größe |
|-------|-------|-------|
| `js/global.js` | Navigation, Quiz, Buttons | 11 KB |
| `js/pages/index.js` | Index-Seite Funktionen | 20 KB |
| `js/components/bookmark.js` | Blog-Leseliste | 2 KB |
| `js/blog-editor-events.js` | Blog-Editor | 9 KB |
| `cms/js/events.js` | CMS-Editor | 2 KB |

---

## Fazit

Event Delegation ist der moderne, CSP-konforme Ansatz für JavaScript-Interaktivität:

1. **Sicherheit**: Kein `unsafe-inline` in CSP nötig
2. **Wartbarkeit**: Zentralisierte Event-Logik
3. **Performance**: Ein Event-Listener statt hunderte
4. **Testbarkeit**: Funktionen können isoliert getestet werden
5. **Accessibility**: Einfachere ARIA-Integration

Die Migration erfordert initiale Arbeit, zahlt sich aber durch verbesserte Sicherheit und Codequalität aus.
