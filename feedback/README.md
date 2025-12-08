# Feedback System

Dieses Verzeichnis enthält Kathrins Feedback zur Website.

## Struktur

### feedback.json
```json
{
  "version": "1.0",
  "lastUpdated": "2024-01-15T10:30:00Z",
  "modules": {
    "hero-section": { "name": "Hero Section", "active": true },
    "about-section": { "name": "Über mich", "active": true }
  },
  "feedback": [
    {
      "id": "fb-001",
      "moduleId": "hero-section",
      "type": "text",
      "content": "Bild sollte größer sein",
      "timestamp": "2024-01-15T10:30:00Z",
      "status": "pending",
      "resolved": false
    }
  ]
}
```

## Feedback-Typen

- `text` - Textnotizen
- `audio` - Sprachnachrichten (Dateilink in /feedback/audio/)
- `video` - Videoaufnahmen (Dateilink in /feedback/video/)

## Status-Werte

- `pending` - Noch nicht bearbeitet
- `reviewed` - Angeschaut, Entscheidung ausstehend
- `accepted` - Wird umgesetzt
- `rejected` - Wird nicht umgesetzt (mit Begründung)
- `completed` - Umgesetzt

## Non-Destruktiver Workflow

- Feedback wird NIEMALS gelöscht
- Wenn ein Modul entfernt wird: `active: false` im modules-Objekt
- Feedback zu inaktiven Modulen wird im Editor ausgeblendet
- Bei Wiederherstellung des Moduls wird altes Feedback wieder sichtbar
