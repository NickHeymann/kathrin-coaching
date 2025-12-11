/**
 * SharedUI Integration Module
 * Recent Items & SharedUI Components initialisieren
 * @module shared-ui-init
 */

/**
 * Rendert "Zuletzt bearbeitet" Liste
 */
export function renderRecentItems() {
    if (typeof window.SharedUI === 'undefined') return;

    const content = document.getElementById('recentItemsContent');
    if (!content) return;

    const items = window.SharedUI.recentItems.getAll();

    if (items.length === 0) {
        content.innerHTML = '<div class="recent-empty">Keine zuletzt bearbeiteten Seiten</div>';
        return;
    }

    content.innerHTML = items.map(item => `
        <div class="recent-item" data-page="${item.id}">
            <span class="recent-icon">${item.icon}</span>
            <span class="recent-name">${item.name}</span>
        </div>
    `).join('');

    // Klick-Handler
    content.querySelectorAll('.recent-item').forEach(el => {
        el.addEventListener('click', () => {
            const pageId = el.dataset.page;
            if (window.CMS && window.CMS.selectRecentItem) {
                window.CMS.selectRecentItem(pageId);
            }
        });
    });
}

/**
 * Toggle Recent-Dropdown
 */
export function toggleRecentDropdown() {
    const dropdown = document.getElementById('recentDropdown');
    if (dropdown) {
        dropdown.classList.toggle('open');
    }
}

/**
 * Lädt Seite aus Recent Items
 */
export function selectRecentItem(pageId, loadPage) {
    if (loadPage) {
        loadPage(pageId);
    }

    // Dropdown schließen
    document.getElementById('recentDropdown')?.classList.remove('open');

    // Update select
    const select = document.getElementById('pageSelect');
    if (select) select.value = pageId;
}

/**
 * Fügt Seite zu "Zuletzt bearbeitet" hinzu
 */
export function addToRecentItems(page) {
    if (typeof window.SharedUI === 'undefined' || !page) return;

    const pageNames = {
        'index.html': 'Startseite',
        'kathrin.html': 'Über mich',
        'paar-retreat.html': 'Paar-Retreat',
        'pferdegestuetztes-coaching.html': 'Pferdegestütztes Coaching',
        'casinha.html': 'Casinha',
        'quiz-hochsensibel.html': 'Quiz: Hochsensibel',
        'quiz-hochbegabt.html': 'Quiz: Hochbegabt',
        'quiz-beziehung.html': 'Quiz: Beziehung',
        'quiz-lebenskrise.html': 'Quiz: Lebenskrise',
        'quiz-midlife.html': 'Quiz: Midlife',
        'quiz-paar-kompass.html': 'Quiz: Paar-Kompass',
        'impressum.html': 'Impressum',
        'datenschutzerklaerung.html': 'Datenschutz'
    };

    window.SharedUI.recentItems.add({
        id: page,
        name: pageNames[page] || page,
        icon: page.startsWith('quiz-') ? '📝' : '📄'
    });
}

/**
 * Initialisiert SharedUI Komponenten
 */
export function initSharedUI() {
    if (typeof window.SharedUI === 'undefined') {
        return;
    }

    // Recent Items Storage-Key für CMS
    if (window.SharedUI.recentItems) {
        window.SharedUI.recentItems.storageKey = 'cms_recent_pages';
    }

    // Füge "Zuletzt bearbeitet" Bereich zur Toolbar hinzu
    const pageSelect = document.getElementById('pageSelect');
    if (pageSelect) {
        const recentContainer = document.createElement('div');
        recentContainer.className = 'recent-items-dropdown';
        recentContainer.innerHTML = `
            <button class="btn btn-ghost recent-trigger" onclick="CMS.toggleRecentDropdown()">
                🕐 Zuletzt
            </button>
            <div class="recent-dropdown-menu" id="recentDropdown">
                <div class="recent-dropdown-content" id="recentItemsContent"></div>
            </div>
        `;
        pageSelect.parentNode.insertBefore(recentContainer, pageSelect.nextSibling);

        // Render recent items
        renderRecentItems();
    }

    // History Panel initialisieren
    window.SharedUI.historyPanel.init();
}
