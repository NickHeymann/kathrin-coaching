/**
 * Mailchimp Integration für Kathrin Stahl Coaching
 *
 * Dieses Script ermöglicht:
 * 1. Newsletter-Anmeldungen
 * 2. Quiz-Ergebnisse per E-Mail versenden
 * 3. Lead-Generierung für Angebote
 *
 * WICHTIG: Ersetze die Platzhalter mit deinen echten Mailchimp-Daten:
 * - MAILCHIMP_FORM_ACTION_URL: Die Action-URL aus deinem Mailchimp Embedded Form
 * - MAILCHIMP_U: Der "u" Parameter aus der Mailchimp Form URL
 * - MAILCHIMP_ID: Der "id" Parameter aus der Mailchimp Form URL
 */

const MailchimpConfig = {
    // Diese Werte findest du in Mailchimp unter:
    // Audience > Signup forms > Embedded forms
    // Kopiere die action URL und extrahiere u und id
    formActionUrl: 'https://DEIN_ACCOUNT.us1.list-manage.com/subscribe/post',
    u: 'DEIN_U_WERT',
    id: 'DEIN_ID_WERT',

    // Merge Fields (passe diese an deine Mailchimp-Liste an)
    fields: {
        email: 'EMAIL',
        firstName: 'FNAME',
        lastName: 'LNAME',
        quizResult: 'QUIZ',       // Custom Field für Quiz-Ergebnis
        quizScore: 'SCORE',       // Custom Field für Punktzahl
        source: 'SOURCE'          // Woher kam die Anmeldung
    }
};

/**
 * Newsletter-Formular erstellen
 * @param {string} containerId - ID des Container-Elements
 * @param {object} options - Konfigurationsoptionen
 */
function createNewsletterForm(containerId, options = {}) {
    const defaults = {
        headline: 'Bleib in Verbindung',
        subheadline: 'Erhalte Impulse für deinen Weg zu dir selbst',
        buttonText: 'Anmelden',
        successMessage: 'Danke! Bitte bestätige deine Anmeldung in deiner E-Mail.',
        source: 'Website Newsletter'
    };

    const config = { ...defaults, ...options };
    const container = document.getElementById(containerId);

    if (!container) {
        console.error('Newsletter container not found:', containerId);
        return;
    }

    container.innerHTML = `
        <div class="mailchimp-form newsletter-form">
            <h3 class="mailchimp-headline">${config.headline}</h3>
            <p class="mailchimp-subheadline">${config.subheadline}</p>
            <form id="mc-form-${containerId}" class="mc-form" onsubmit="handleMailchimpSubmit(event, '${config.source}')">
                <div class="mc-field-group">
                    <input type="text" name="FNAME" placeholder="Dein Vorname" class="mc-input" required>
                </div>
                <div class="mc-field-group">
                    <input type="email" name="EMAIL" placeholder="Deine E-Mail-Adresse" class="mc-input" required>
                </div>
                <input type="hidden" name="SOURCE" value="${config.source}">
                <button type="submit" class="mc-submit btn btn-primary">${config.buttonText}</button>
            </form>
            <p class="mc-privacy">Deine Daten sind sicher. <a href="datenschutzerklaerung.html">Datenschutz</a></p>
            <div class="mc-success" style="display:none;">
                <span class="mc-success-icon">✓</span>
                <p>${config.successMessage}</p>
            </div>
        </div>
    `;
}

/**
 * Quiz-Ergebnis E-Mail-Formular erstellen
 * @param {string} containerId - ID des Container-Elements
 * @param {object} quizData - Quiz-Ergebnis-Daten
 */
function createQuizResultForm(containerId, quizData) {
    const container = document.getElementById(containerId);

    if (!container) {
        console.error('Quiz result container not found:', containerId);
        return;
    }

    container.innerHTML = `
        <div class="mailchimp-form quiz-result-form">
            <h3 class="mailchimp-headline">Dein Ergebnis per E-Mail erhalten</h3>
            <p class="mailchimp-subheadline">Wir senden dir dein ${quizData.quizName || 'Quiz'}-Ergebnis mit persönlichen Tipps.</p>
            <form id="mc-quiz-form" class="mc-form" onsubmit="handleQuizSubmit(event)">
                <div class="mc-field-group">
                    <input type="text" name="FNAME" placeholder="Dein Vorname" class="mc-input" required>
                </div>
                <div class="mc-field-group">
                    <input type="email" name="EMAIL" placeholder="Deine E-Mail-Adresse" class="mc-input" required>
                </div>
                <input type="hidden" name="QUIZ" value="${quizData.resultType || ''}">
                <input type="hidden" name="SCORE" value="${quizData.score || ''}">
                <input type="hidden" name="SOURCE" value="Quiz: ${quizData.quizName || 'Unbekannt'}">
                <button type="submit" class="mc-submit btn btn-primary">Ergebnis senden</button>
            </form>
            <p class="mc-privacy">Deine Daten sind sicher. Kein Spam. <a href="datenschutzerklaerung.html">Datenschutz</a></p>
            <div class="mc-success" style="display:none;">
                <span class="mc-success-icon">✓</span>
                <p>Super! Dein Ergebnis ist unterwegs. Schau in dein Postfach.</p>
            </div>
        </div>
    `;
}

/**
 * Formular absenden (Newsletter)
 */
function handleMailchimpSubmit(event, source) {
    event.preventDefault();
    const form = event.target;
    submitToMailchimp(form, source);
}

/**
 * Quiz-Formular absenden
 */
function handleQuizSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const source = form.querySelector('input[name="SOURCE"]').value;
    submitToMailchimp(form, source);
}

/**
 * An Mailchimp senden
 */
function submitToMailchimp(form, source) {
    const formData = new FormData(form);
    const submitBtn = form.querySelector('.mc-submit');
    const successDiv = form.parentElement.querySelector('.mc-success');

    // Button deaktivieren
    submitBtn.disabled = true;
    submitBtn.textContent = 'Wird gesendet...';

    // Mailchimp verwendet JSONP für Cross-Origin Requests
    // Wir bauen die URL zusammen
    const email = formData.get('EMAIL');
    const fname = formData.get('FNAME');
    const quiz = formData.get('QUIZ') || '';
    const score = formData.get('SCORE') || '';

    // Mailchimp JSONP URL
    const url = `${MailchimpConfig.formActionUrl}-json?u=${MailchimpConfig.u}&id=${MailchimpConfig.id}&EMAIL=${encodeURIComponent(email)}&FNAME=${encodeURIComponent(fname)}&QUIZ=${encodeURIComponent(quiz)}&SCORE=${encodeURIComponent(score)}&SOURCE=${encodeURIComponent(source)}&c=mailchimpCallback`;

    // JSONP Request
    const script = document.createElement('script');
    script.src = url;

    // Callback für JSONP
    window.mailchimpCallback = function(response) {
        if (response.result === 'success') {
            // Erfolg
            form.style.display = 'none';
            successDiv.style.display = 'block';

            // Event für Analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'newsletter_signup', {
                    'event_category': 'engagement',
                    'event_label': source
                });
            }
        } else {
            // Fehler
            submitBtn.disabled = false;
            submitBtn.textContent = 'Nochmal versuchen';

            // Fehlermeldung anzeigen
            let errorMsg = response.msg || 'Ein Fehler ist aufgetreten.';
            // Mailchimp gibt manchmal HTML zurück
            errorMsg = errorMsg.replace(/<[^>]*>/g, '');

            alert(errorMsg);
        }

        // Script entfernen
        document.body.removeChild(script);
        delete window.mailchimpCallback;
    };

    document.body.appendChild(script);

    // Timeout für langsame Verbindungen
    setTimeout(function() {
        if (window.mailchimpCallback) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Nochmal versuchen';
            alert('Die Verbindung war zu langsam. Bitte versuche es erneut.');
        }
    }, 10000);
}

/**
 * Lead Magnet Popup erstellen
 * @param {object} options - Konfigurationsoptionen
 */
function createLeadMagnetPopup(options = {}) {
    const defaults = {
        headline: 'Gratis Impulse für deinen Neuanfang',
        subheadline: 'Erhalte regelmäßig Inspirationen direkt in dein Postfach.',
        buttonText: 'Ja, ich will dabei sein!',
        delay: 30000, // 30 Sekunden
        scrollTrigger: 50, // 50% gescrollt
        source: 'Popup Lead Magnet'
    };

    const config = { ...defaults, ...options };

    // Popup HTML
    const popupHTML = `
        <div id="lead-magnet-popup" class="lead-popup-overlay" style="display:none;">
            <div class="lead-popup-content">
                <button class="lead-popup-close" onclick="closeLeadPopup()">&times;</button>
                <div class="lead-popup-body">
                    <h2>${config.headline}</h2>
                    <p>${config.subheadline}</p>
                    <div id="popup-newsletter-form"></div>
                </div>
            </div>
        </div>
    `;

    // Popup zum Body hinzufügen
    document.body.insertAdjacentHTML('beforeend', popupHTML);

    // Newsletter-Formular im Popup erstellen
    createNewsletterForm('popup-newsletter-form', {
        headline: '',
        subheadline: '',
        buttonText: config.buttonText,
        source: config.source
    });

    // Cookie prüfen
    if (getCookie('leadPopupClosed')) {
        return;
    }

    // Scroll-Trigger
    let popupShown = false;
    window.addEventListener('scroll', function() {
        if (popupShown) return;

        const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        if (scrollPercent >= config.scrollTrigger) {
            showLeadPopup();
            popupShown = true;
        }
    });

    // Zeit-Trigger als Backup
    setTimeout(function() {
        if (!popupShown) {
            showLeadPopup();
            popupShown = true;
        }
    }, config.delay);
}

function showLeadPopup() {
    const popup = document.getElementById('lead-magnet-popup');
    if (popup) {
        popup.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeLeadPopup() {
    const popup = document.getElementById('lead-magnet-popup');
    if (popup) {
        popup.style.display = 'none';
        document.body.style.overflow = '';
        setCookie('leadPopupClosed', 'true', 7); // 7 Tage nicht mehr zeigen
    }
}

// Cookie Hilfsfunktionen
function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split('=');
        if (cookieName === name) {
            return cookieValue;
        }
    }
    return null;
}

// Click outside to close
document.addEventListener('click', function(event) {
    const popup = document.getElementById('lead-magnet-popup');
    if (popup && event.target === popup) {
        closeLeadPopup();
    }
});

// ESC to close
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeLeadPopup();
    }
});
