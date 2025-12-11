// Kontaktformular Validierung und Handling
(function() {
    'use strict';

    // DOM Elemente
    const form = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');
    const submitBtn = form.querySelector('.submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    // Validierungs-Regeln
    const validators = {
        name: {
            validate: (value) => {
                if (!value.trim()) {
                    return 'Bitte gib deinen Namen ein.';
                }
                if (value.trim().length < 2) {
                    return 'Der Name muss mindestens 2 Zeichen lang sein.';
                }
                return null;
            }
        },
        email: {
            validate: (value) => {
                if (!value.trim()) {
                    return 'Bitte gib deine E-Mail-Adresse ein.';
                }
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    return 'Bitte gib eine gültige E-Mail-Adresse ein.';
                }
                return null;
            }
        },
        phone: {
            validate: (value) => {
                // Optional - nur validieren wenn ausgefüllt
                if (!value.trim()) {
                    return null;
                }
                const phoneRegex = /^[\d\s\-\+\(\)]+$/;
                if (!phoneRegex.test(value) || value.length < 6) {
                    return 'Bitte gib eine gültige Telefonnummer ein.';
                }
                return null;
            }
        },
        subject: {
            validate: (value) => {
                if (!value) {
                    return 'Bitte wähle einen Betreff aus.';
                }
                return null;
            }
        },
        message: {
            validate: (value) => {
                if (!value.trim()) {
                    return 'Bitte schreibe eine Nachricht.';
                }
                if (value.trim().length < 10) {
                    return 'Die Nachricht muss mindestens 10 Zeichen lang sein.';
                }
                return null;
            }
        },
        privacy: {
            validate: (value, element) => {
                if (!element.checked) {
                    return 'Bitte akzeptiere die Datenschutzerklärung.';
                }
                return null;
            }
        }
    };

    // Einzelnes Feld validieren
    function validateField(fieldName) {
        const field = form.elements[fieldName];
        const errorElement = document.getElementById(fieldName + 'Error');
        const formGroup = field.closest('.form-group');

        if (!validators[fieldName]) return true;

        const error = validators[fieldName].validate(field.value, field);

        if (error) {
            formGroup.classList.add('has-error');
            errorElement.textContent = error;
            field.setAttribute('aria-invalid', 'true');
            return false;
        } else {
            formGroup.classList.remove('has-error');
            errorElement.textContent = '';
            field.setAttribute('aria-invalid', 'false');
            return true;
        }
    }

    // Alle Felder validieren
    function validateForm() {
        let isValid = true;

        Object.keys(validators).forEach(fieldName => {
            if (!validateField(fieldName)) {
                isValid = false;
            }
        });

        return isValid;
    }

    // Echtzeit-Validierung beim Tippen/Ändern
    Object.keys(validators).forEach(fieldName => {
        const field = form.elements[fieldName];

        if (field.type === 'checkbox') {
            field.addEventListener('change', () => validateField(fieldName));
        } else {
            // Bei Blur validieren
            field.addEventListener('blur', () => validateField(fieldName));

            // Fehler entfernen sobald User anfängt zu tippen
            field.addEventListener('input', () => {
                const formGroup = field.closest('.form-group');
                if (formGroup.classList.contains('has-error')) {
                    validateField(fieldName);
                }
            });
        }
    });

    // Formular-Submit Handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Validierung
        if (!validateForm()) {
            showMessage('Bitte fülle alle Pflichtfelder korrekt aus.', 'error');
            // Scroll zum ersten Fehler
            const firstError = form.querySelector('.has-error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // Formular-Daten sammeln
        const formData = {
            name: form.elements.name.value.trim(),
            email: form.elements.email.value.trim(),
            phone: form.elements.phone.value.trim(),
            subject: form.elements.subject.value,
            message: form.elements.message.value.trim(),
            timestamp: new Date().toISOString()
        };

        // Button in Loading-State
        setButtonState(true);

        try {
            // Hier würde normalerweise der API-Call stattfinden
            // Da dies eine statische Seite ist, simulieren wir das:
            await simulateSubmit(formData);

            // Erfolg
            showMessage('Vielen Dank für deine Nachricht! Ich melde mich so schnell wie möglich bei dir.', 'success');
            form.reset();

            // Optional: mailto als Fallback
            openMailtoFallback(formData);

        } catch (error) {
            showMessage('Es ist ein Fehler aufgetreten. Bitte versuche es erneut oder schreibe direkt an kathrin@kathrinstahl.com', 'error');
            console.error('Form submission error:', error);
        } finally {
            setButtonState(false);
        }
    });

    // Simuliert API-Call (für statische Seite)
    async function simulateSubmit(data) {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Form data:', data);
                resolve();
            }, 1000);
        });
    }

    // Mailto als Fallback für statische Seiten
    function openMailtoFallback(data) {
        const subject = encodeURIComponent(`Kontaktanfrage: ${data.subject}`);
        const body = encodeURIComponent(
            `Name: ${data.name}\n` +
            `E-Mail: ${data.email}\n` +
            `Telefon: ${data.phone || 'Nicht angegeben'}\n\n` +
            `Nachricht:\n${data.message}`
        );

        // Optional in neuem Tab öffnen (kommentiere aus wenn nicht gewünscht)
        // window.open(`mailto:kathrin@kathrinstahl.com?subject=${subject}&body=${body}`, '_blank');
    }

    // Button State ändern
    function setButtonState(loading) {
        submitBtn.disabled = loading;
        btnText.style.display = loading ? 'none' : 'inline';
        btnLoader.style.display = loading ? 'inline' : 'none';
    }

    // Nachricht anzeigen
    function showMessage(message, type) {
        formMessage.textContent = message;
        formMessage.className = `form-message ${type}`;
        formMessage.style.display = 'block';

        // Nach 10 Sekunden ausblenden
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 10000);

        // Scroll zur Nachricht
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Optionale Integration mit FormSubmit.co oder ähnlichen Services
    // Uncomment und konfiguriere nach Bedarf:
    /*
    async function submitToFormService(data) {
        const response = await fetch('https://formsubmit.co/ajax/kathrin@kathrinstahl.com', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Submission failed');
        }

        return response.json();
    }
    */

})();
