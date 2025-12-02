/* ============================================
   Cal.com Booking Integration - Kathrin Coaching

   SETUP:
   1. Create a Cal.com account at https://cal.com
   2. Connect Stripe for payments
   3. Create event types (Erstgespräch, 1:1 Coaching, etc.)
   4. Replace CAL_USERNAME below with your Cal.com username
   5. Replace event type slugs with your actual event slugs
   ============================================ */

// Configuration - UPDATE THESE VALUES
const CAL_CONFIG = {
    // Your Cal.com username (e.g., "kathrin-stahl" or your custom URL)
    username: "kathrin-stahl", // CHANGE THIS

    // Event types - create these in Cal.com dashboard
    events: {
        erstgespraech: "erstgespraech",      // Free discovery call
        einzelcoaching: "einzelcoaching",    // 1:1 coaching session
        paarcoaching: "paarcoaching",        // Couples coaching
        retreat: "retreat-beratung"          // Retreat consultation
    },

    // Styling to match website
    theme: "light",
    brandColor: "#D2AB74", // Kathrin's brand color (gold/beige)

    // Language
    language: "de"
};

// Load Cal.com embed script
(function() {
    // Create and load the Cal.com script
    const script = document.createElement('script');
    script.src = 'https://app.cal.com/embed/embed.js';
    script.async = true;
    script.onload = function() {
        // Initialize Cal after script loads
        if (typeof Cal !== 'undefined') {
            Cal("init", {
                origin: "https://app.cal.com"
            });

            // Apply custom styling
            Cal("ui", {
                theme: CAL_CONFIG.theme,
                styles: {
                    branding: {
                        brandColor: CAL_CONFIG.brandColor
                    }
                },
                hideEventTypeDetails: false,
                layout: "month_view"
            });
        }
    };
    document.head.appendChild(script);
})();

/* ============================================
   Booking Button Functions
   Use these in onclick handlers or call directly
   ============================================ */

// Open booking popup for free discovery call (Erstgespräch)
function bookErstgespraech() {
    if (typeof Cal !== 'undefined') {
        Cal("openModal", {
            calLink: `${CAL_CONFIG.username}/${CAL_CONFIG.events.erstgespraech}`,
            config: {
                layout: "month_view",
                theme: CAL_CONFIG.theme
            }
        });
    } else {
        // Fallback: open Cal.com in new tab
        window.open(`https://cal.com/${CAL_CONFIG.username}/${CAL_CONFIG.events.erstgespraech}`, '_blank');
    }
}

// Open booking popup for 1:1 coaching
function bookEinzelcoaching() {
    if (typeof Cal !== 'undefined') {
        Cal("openModal", {
            calLink: `${CAL_CONFIG.username}/${CAL_CONFIG.events.einzelcoaching}`,
            config: {
                layout: "month_view",
                theme: CAL_CONFIG.theme
            }
        });
    } else {
        window.open(`https://cal.com/${CAL_CONFIG.username}/${CAL_CONFIG.events.einzelcoaching}`, '_blank');
    }
}

// Open booking popup for couples coaching
function bookPaarcoaching() {
    if (typeof Cal !== 'undefined') {
        Cal("openModal", {
            calLink: `${CAL_CONFIG.username}/${CAL_CONFIG.events.paarcoaching}`,
            config: {
                layout: "month_view",
                theme: CAL_CONFIG.theme
            }
        });
    } else {
        window.open(`https://cal.com/${CAL_CONFIG.username}/${CAL_CONFIG.events.paarcoaching}`, '_blank');
    }
}

// Open booking popup for retreat consultation
function bookRetreatBeratung() {
    if (typeof Cal !== 'undefined') {
        Cal("openModal", {
            calLink: `${CAL_CONFIG.username}/${CAL_CONFIG.events.retreat}`,
            config: {
                layout: "month_view",
                theme: CAL_CONFIG.theme
            }
        });
    } else {
        window.open(`https://cal.com/${CAL_CONFIG.username}/${CAL_CONFIG.events.retreat}`, '_blank');
    }
}

// Generic booking function - pass event type as parameter
function openBooking(eventType) {
    const eventSlug = CAL_CONFIG.events[eventType] || eventType;

    if (typeof Cal !== 'undefined') {
        Cal("openModal", {
            calLink: `${CAL_CONFIG.username}/${eventSlug}`,
            config: {
                layout: "month_view",
                theme: CAL_CONFIG.theme
            }
        });
    } else {
        window.open(`https://cal.com/${CAL_CONFIG.username}/${eventSlug}`, '_blank');
    }
}

/* ============================================
   Auto-attach to existing booking buttons
   Looks for elements with data-cal-booking attribute
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    // Find all elements with data-cal-booking attribute
    const bookingButtons = document.querySelectorAll('[data-cal-booking]');

    bookingButtons.forEach(function(button) {
        const eventType = button.getAttribute('data-cal-booking');

        button.addEventListener('click', function(e) {
            e.preventDefault();
            openBooking(eventType);
        });

        // Add visual indicator that this is a booking button
        button.style.cursor = 'pointer';
    });

    // Also look for links containing "Gespräch" or "buchen" and offer to convert them
    const bookingLinks = document.querySelectorAll('a[href*="contact"], a[href*="kontakt"]');

    bookingLinks.forEach(function(link) {
        // Check if the link text suggests it's for booking
        const text = link.textContent.toLowerCase();
        if (text.includes('gespräch') || text.includes('buchen') || text.includes('termin')) {
            // Add Cal.com popup functionality
            link.addEventListener('click', function(e) {
                // Only intercept if Cal is loaded
                if (typeof Cal !== 'undefined') {
                    e.preventDefault();
                    bookErstgespraech();
                }
                // Otherwise let the link work normally
            });
        }
    });
});

/* ============================================
   Floating Booking Button (Optional)
   Uncomment to add a persistent booking button
   ============================================ */

/*
function createFloatingBookingButton() {
    const button = document.createElement('button');
    button.innerHTML = '📅 Termin buchen';
    button.id = 'floating-booking-btn';
    button.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: ${CAL_CONFIG.brandColor};
        color: white;
        border: none;
        padding: 15px 25px;
        border-radius: 50px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 9999;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    `;

    button.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-3px)';
        this.style.boxShadow = '0 6px 25px rgba(0,0,0,0.3)';
    });

    button.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
    });

    button.addEventListener('click', bookErstgespraech);

    document.body.appendChild(button);
}

// Uncomment to enable floating button:
// document.addEventListener('DOMContentLoaded', createFloatingBookingButton);
*/

console.log('Cal.com Booking Integration loaded. Available functions: bookErstgespraech(), bookEinzelcoaching(), bookPaarcoaching(), bookRetreatBeratung(), openBooking(eventType)');
