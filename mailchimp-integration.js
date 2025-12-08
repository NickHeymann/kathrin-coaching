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
            <p class="mailchimp-subheadline">Ich sende dir dein ${quizData.quizName || 'Quiz'}-Ergebnis mit persönlichen Tipps.</p>
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
 * Verwendet Fetch API mit POST statt unsicheres JSONP
 */
async function submitToMailchimp(form, source) {
    const formData = new FormData(form);
    const submitBtn = form.querySelector('.mc-submit');
    const successDiv = form.parentElement.querySelector('.mc-success');

    // Button deaktivieren
    submitBtn.disabled = true;
    submitBtn.textContent = 'Wird gesendet...';

    // Formulardaten extrahieren
    const email = formData.get('EMAIL');
    const fname = formData.get('FNAME');
    const quiz = formData.get('QUIZ') || '';
    const score = formData.get('SCORE') || '';

    // Input-Validierung
    if (!isValidEmail(email)) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Nochmal versuchen';
        showFormError(form, 'Bitte gib eine gültige E-Mail-Adresse ein.');
        return;
    }

    if (!fname || fname.trim().length < 2) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Nochmal versuchen';
        showFormError(form, 'Bitte gib deinen Vornamen ein.');
        return;
    }

    try {
        // Mailchimp POST URL (standard form submission)
        const url = `${MailchimpConfig.formActionUrl}?u=${MailchimpConfig.u}&id=${MailchimpConfig.id}`;

        // FormData für POST-Request
        const postData = new URLSearchParams();
        postData.append('EMAIL', email);
        postData.append('FNAME', fname);
        postData.append('QUIZ', quiz);
        postData.append('SCORE', score);
        postData.append('SOURCE', source);
        postData.append('subscribe', 'Subscribe');

        // Da Mailchimp kein CORS unterstützt, nutzen wir einen Workaround:
        // Wir senden das Formular als no-cors Request und zeigen sofort Erfolg
        // Alternative: Eigenen Backend-Proxy verwenden
        const response = await fetch(url, {
            method: 'POST',
            mode: 'no-cors', // Mailchimp unterstützt kein CORS
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: postData.toString()
        });

        // Bei no-cors können wir die Response nicht lesen
        // Wir zeigen optimistisch Erfolg an
        form.style.display = 'none';
        successDiv.style.display = 'block';

        // Event für Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'newsletter_signup', {
                'event_category': 'engagement',
                'event_label': source
            });
        }

        // Erfolg in Console loggen (für Debugging)
        console.log('Mailchimp submission sent for:', email);

    } catch (error) {
        console.error('Mailchimp submission error:', error);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Nochmal versuchen';
        showFormError(form, 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    }
}

/**
 * E-Mail-Validierung
 */
function isValidEmail(email) {
    if (!email) return false;
    // Einfache aber effektive E-Mail-Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

/**
 * Fehlermeldung im Formular anzeigen
 */
function showFormError(form, message) {
    // Bestehende Fehlermeldung entfernen
    const existingError = form.querySelector('.mc-error');
    if (existingError) {
        existingError.remove();
    }

    // Neue Fehlermeldung erstellen
    const errorDiv = document.createElement('div');
    errorDiv.className = 'mc-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = 'color: #e74c3c; font-size: 0.9em; margin: 0.5rem 0; padding: 0.5rem; background: #fdf2f2; border-radius: 4px;';

    // Vor dem Submit-Button einfügen
    const submitBtn = form.querySelector('.mc-submit');
    submitBtn.parentNode.insertBefore(errorDiv, submitBtn);

    // Nach 5 Sekunden automatisch ausblenden
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
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

// Cookie Hilfsfunktionen (mit Sicherheitsattributen)
function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    // SameSite=Lax verhindert CSRF, Secure nur bei HTTPS
    const secure = location.protocol === 'https:' ? ';Secure' : '';
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax${secure}`;
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
