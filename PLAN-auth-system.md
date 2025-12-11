# Plan: Zentrales Auth-System mit Supabase

## Übersicht

Einheitliches Login-System für alle Admin-Tools (CMS-Editor, Blog-Editor, Analytics) mit:
- Email/Passwort-Authentifizierung
- Passwort-Reset per Email
- Zentrale API-Key-Verwaltung (GitHub Token, Groq API, etc.)

---

## Phase 1: Supabase Setup (manuell)

### 1.1 Projekt erstellen
1. Gehe zu [supabase.com](https://supabase.com) → "Start your project"
2. GitHub-Login oder Email-Registrierung
3. Neues Projekt erstellen:
   - Name: `kathrin-coaching-admin`
   - Region: `Frankfurt (eu-central-1)` (am nächsten)
   - Passwort: Sicheres DB-Passwort generieren

### 1.2 Datenbank-Tabelle erstellen
Im SQL-Editor ausführen:

```sql
-- Tabelle für API Keys (pro User)
CREATE TABLE api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  key_name TEXT NOT NULL,
  key_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, key_name)
);

-- Row Level Security aktivieren
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: User kann nur eigene Keys sehen/bearbeiten
CREATE POLICY "Users can manage own keys" ON api_keys
  FOR ALL USING (auth.uid() = user_id);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 1.3 Auth-Einstellungen
1. Authentication → Settings
2. Site URL: `https://nickheymann.github.io/kathrin-coaching`
3. Redirect URLs hinzufügen:
   - `https://nickheymann.github.io/kathrin-coaching/admin/`
   - `http://localhost:*` (für lokales Testen)

### 1.4 API Keys notieren
- Project URL: `https://xxxxx.supabase.co`
- Anon Key: `eyJhbGc...` (öffentlich, sicher für Frontend)

---

## Phase 2: Login-Seite erstellen

### 2.1 Dateistruktur
```
admin/
├── index.html          # Login-Seite (Einstiegspunkt)
├── dashboard.html      # Nach Login: Auswahl CMS/Blog/Analytics
├── css/
│   └── admin.css       # Styles für Admin-Bereich
└── js/
    ├── supabase-config.js  # Supabase Client Config
    ├── auth.js             # Auth-Funktionen
    └── api-keys.js         # API Key Management
```

### 2.2 Login-Seite Features
- Email + Passwort Eingabe
- "Passwort vergessen" Link
- "Angemeldet bleiben" Checkbox
- Nach Login → Dashboard oder letzter Editor

### 2.3 Dashboard Features
- Übersicht: CMS-Editor, Blog-Editor, Analytics
- API Keys verwalten (hinzufügen/ändern/löschen)
- Logout-Button

---

## Phase 3: Auth-Modul implementieren

### 3.1 supabase-config.js
```javascript
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xxxxx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGc...'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

### 3.2 auth.js Funktionen
- `signUp(email, password)` - Registrierung
- `signIn(email, password)` - Login
- `signOut()` - Logout
- `resetPassword(email)` - Passwort-Reset Email senden
- `updatePassword(newPassword)` - Neues Passwort setzen
- `getUser()` - Aktueller User
- `requireAuth()` - Redirect zu Login wenn nicht eingeloggt

### 3.3 api-keys.js Funktionen
- `saveApiKey(name, value)` - Key speichern (verschlüsselt)
- `getApiKey(name)` - Key laden
- `deleteApiKey(name)` - Key löschen
- `listApiKeys()` - Alle Keys auflisten

---

## Phase 4: Editoren anpassen

### 4.1 CMS-Editor (`cms/index.html`)
```javascript
import { requireAuth, getApiKey } from '../admin/js/auth.js'

// Am Anfang prüfen
await requireAuth()

// GitHub Token aus Supabase laden
const githubToken = await getApiKey('github_token')
if (!githubToken) {
  // Redirect zu API Key Setup
  window.location.href = '../admin/dashboard.html#setup-keys'
}
```

### 4.2 Blog-Editor (`blog-editor-modular.html`)
Gleiche Logik wie CMS-Editor

### 4.3 Analytics Board
Gleiche Logik + evtl. weitere API Keys

---

## Phase 5: Migration bestehender Tokens

### 5.1 Einmalige Migration
Beim ersten Login nach Update:
1. Prüfen ob `cms_encrypted_token` in localStorage existiert
2. Falls ja: In Supabase speichern
3. localStorage aufräumen

### 5.2 Fallback
Falls Supabase nicht erreichbar:
- Lokaler Cache der API Keys (verschlüsselt)
- Offline-Modus für Editoren

---

## Sicherheitsaspekte

### Verschlüsselung
- API Keys werden zusätzlich client-seitig verschlüsselt
- Supabase RLS verhindert Zugriff auf fremde Keys
- Anon Key ist sicher (nur mit Auth-Token nutzbar)

### Session Management
- Supabase JWT Tokens (1h Gültigkeit, auto-refresh)
- "Angemeldet bleiben" → Refresh Token in localStorage

---

## Zeitschätzung

| Phase | Aufwand |
|-------|---------|
| Phase 1: Supabase Setup | 15 min (manuell) |
| Phase 2: Login-Seite | ~200 Zeilen |
| Phase 3: Auth-Modul | ~300 Zeilen |
| Phase 4: Editor-Anpassungen | ~50 Zeilen pro Editor |
| Phase 5: Migration | ~100 Zeilen |

**Gesamt:** ~700 Zeilen Code + manuelle Supabase-Einrichtung

---

## Nächste Schritte

1. [ ] Supabase-Projekt erstellen (du)
2. [ ] Datenbank-Tabelle anlegen (du, mit SQL oben)
3. [ ] Auth-Einstellungen konfigurieren (du)
4. [ ] API Keys an mich geben (Project URL + Anon Key)
5. [ ] Ich implementiere Login-Seite + Auth-Modul
6. [ ] Ich passe Editoren an
7. [ ] Testen
