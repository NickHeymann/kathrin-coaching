# Mailchimp Integration - Einrichtungsanleitung

## 1. Mailchimp Account einrichten

Falls noch nicht vorhanden, erstelle einen kostenlosen Mailchimp Account unter https://mailchimp.com

## 2. Audience (Liste) erstellen

1. Gehe zu **Audience** > **Audience dashboard**
2. Falls du noch keine Liste hast, klicke auf **Create Audience**
3. Name z.B. "Kathrin Stahl Coaching Newsletter"

## 3. Merge Fields (Custom Fields) anlegen

Für die Quiz-Integration brauchst du zusätzliche Felder:

1. Gehe zu **Audience** > **Settings** > **Audience fields and *|MERGE|* tags**
2. Klicke auf **Add A Field**
3. Erstelle diese Felder:
   - **QUIZ** (Text) - Quiz-Ergebnis-Typ
   - **SCORE** (Number) - Punktzahl
   - **SOURCE** (Text) - Quelle der Anmeldung

## 4. Embedded Form URL holen

1. Gehe zu **Audience** > **Signup forms** > **Embedded forms**
2. Wähle "Classic" oder "Unstyled"
3. Kopiere die **action URL** aus dem generierten HTML-Code

Die URL sieht etwa so aus:
```
https://xyz.us1.list-manage.com/subscribe/post?u=XXXXXXXX&id=XXXXXXXX
```

## 5. Werte in mailchimp-integration.js eintragen

Öffne `mailchimp-integration.js` und ersetze die Platzhalter:

```javascript
const MailchimpConfig = {
    formActionUrl: 'https://DEIN_ACCOUNT.us1.list-manage.com/subscribe/post',
    u: 'DEIN_U_WERT',      // Der Teil nach u= in der URL
    id: 'DEIN_ID_WERT',    // Der Teil nach id= in der URL
    // ...
};
```

### Beispiel:

Wenn deine URL so aussieht:
```
https://kathrinstahl.us21.list-manage.com/subscribe/post?u=abc123def456&id=xyz789
```

Dann trage ein:
```javascript
const MailchimpConfig = {
    formActionUrl: 'https://kathrinstahl.us21.list-manage.com/subscribe/post',
    u: 'abc123def456',
    id: 'xyz789',
    // ...
};
```

## 6. Testen

1. Öffne eine Quiz-Seite (z.B. quiz-paar-kompass.html)
2. Beantworte alle Fragen
3. Im Ergebnis siehst du das E-Mail-Formular
4. Teste mit einer Testadresse
5. Prüfe in Mailchimp, ob der Kontakt mit allen Daten erscheint

## 7. Newsletter-Sektion auf der Homepage (optional)

Um ein Newsletter-Formular auf der Homepage einzubinden, füge diesen Code ein:

```html
<!-- Newsletter Section -->
<section class="newsletter-section">
    <div class="container">
        <div id="homepage-newsletter"></div>
    </div>
</section>

<script>
document.addEventListener('DOMContentLoaded', function() {
    createNewsletterForm('homepage-newsletter', {
        headline: 'Bleib in Verbindung',
        subheadline: 'Erhalte regelmäßig Impulse für deinen Weg zu dir selbst.',
        buttonText: 'Ja, ich möchte dabei sein',
        source: 'Homepage Newsletter'
    });
});
</script>
```

## 8. Lead Magnet Popup (optional)

Um ein Exit-Intent Popup zu aktivieren, füge diesen Code ein:

```html
<script>
document.addEventListener('DOMContentLoaded', function() {
    createLeadMagnetPopup({
        headline: 'Bevor du gehst...',
        subheadline: 'Erhalte gratis Impulse für Beziehung und Selbstfindung.',
        buttonText: 'Ja, bitte!',
        delay: 45000,        // Nach 45 Sekunden zeigen
        scrollTrigger: 60,   // Nach 60% Scrollen zeigen
        source: 'Exit Popup'
    });
});
</script>
```

## Fehlerbehebung

### "Fehler bei der Anmeldung"
- Prüfe, ob die Mailchimp-URL korrekt ist
- Prüfe, ob Double-Opt-In aktiviert ist (Benutzer muss E-Mail bestätigen)

### E-Mail erscheint nicht in Mailchimp
- Prüfe Spam-Ordner für Bestätigungs-E-Mail
- Prüfe, ob die E-Mail bereits in der Liste ist

### Formular wird nicht angezeigt
- Prüfe, ob mailchimp-styles.css und mailchimp-integration.js geladen werden
- Öffne die Browser-Konsole (F12) auf Fehler prüfen

## Automatisierung (optional)

In Mailchimp kannst du automatische E-Mails basierend auf Merge Fields senden:

1. Gehe zu **Automations** > **Create**
2. Wähle "Welcome new subscribers"
3. Unter **Trigger** wähle "Tag is applied" oder nutze Segmente
4. Erstelle verschiedene Willkommens-E-Mails je nach Quiz-Ergebnis

### Beispiel-Segmente:
- Quiz = "Die Verbundenen" → E-Mail: "Euer Fundament ist stark"
- Quiz = "Am Wendepunkt" → E-Mail: "Jetzt ist der richtige Moment"

---

Bei Fragen: kathrin@kathrinstahl.com
