/* blog-editor-github.js
 * GitHub API Integration: Files, Images, Authentication
 * Zeilen: ~120 | Verantwortung: GitHub API Communication
 * Abhängigkeiten: blog-editor-config.js, blog-editor-utils.js
 */

// GitHub API Wrapper
const github = {
    async request(endpoint, options = {}) {
        const response = await fetch(`https://api.github.com${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `token ${state.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        return response.json();
    },

    async getFile(path) {
        try {
            const data = await this.request(
                `/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${path}?ref=${CONFIG.branch}`
            );
            return {
                content: atob(data.content),
                sha: data.sha
            };
        } catch (e) {
            return null;
        }
    },

    async saveFile(path, content, message) {
        const existing = await this.getFile(path);

        const body = {
            message: message,
            content: utf8ToBase64(content),
            branch: CONFIG.branch
        };

        if (existing) {
            body.sha = existing.sha;
        }

        return this.request(
            `/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${path}`,
            { method: 'PUT', body: JSON.stringify(body) }
        );
    },

    async uploadImage(filename, base64Data) {
        const content = base64Data.split(',')[1];

        const body = {
            message: `Bild hochgeladen: ${filename}`,
            content: content,
            branch: CONFIG.branch
        };

        return this.request(
            `/repos/${CONFIG.owner}/${CONFIG.repo}/contents/wp-content/uploads/blog/${filename}`,
            { method: 'PUT', body: JSON.stringify(body) }
        );
    },

    async listImages() {
        try {
            const data = await this.request(
                `/repos/${CONFIG.owner}/${CONFIG.repo}/contents/wp-content/uploads?ref=${CONFIG.branch}`
            );

            // Rekursiv Bilder suchen
            const images = [];
            for (const item of data) {
                if (item.type === 'dir') {
                    try {
                        const subData = await this.request(
                            `/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${item.path}?ref=${CONFIG.branch}`
                        );
                        for (const subItem of subData) {
                            if (subItem.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                                images.push(subItem);
                            }
                        }
                    } catch (e) {}
                }
            }
            return images.slice(0, 30); // Nur die ersten 30
        } catch (e) {
            return [];
        }
    }
};

// Token Setup & Check
function checkSetup() {
    // sessionStorage zuerst prüfen (sicherer)
    let savedToken = sessionStorage.getItem('github_token');

    // Migration von localStorage (einmalig)
    if (!savedToken) {
        const oldToken = localStorage.getItem('github_token');
        if (oldToken) {
            sessionStorage.setItem('github_token', oldToken);
            localStorage.removeItem('github_token');
            savedToken = oldToken;
        }
    }

    if (savedToken) {
        state.token = savedToken;
        document.getElementById('setupScreen').classList.add('hidden');
        initEditor();
    }
}

async function setupToken() {
    console.log('setupToken() aufgerufen');
    const token = document.getElementById('tokenInput').value.trim();

    if (!token) {
        toast('Bitte Token eingeben', 'error');
        return;
    }

    // Basis-Validierung des Token-Formats (wie im CMS-Editor)
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
        toast('Ungültiges Token-Format. GitHub Tokens beginnen mit ghp_ oder github_pat_', 'error');
        return;
    }

    const btn = document.getElementById('setupBtn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Prüfe Token...';
    }

    try {
        state.token = token;
        console.log('Prüfe Token bei GitHub...');

        // Test API-Zugriff
        await github.request(`/repos/${CONFIG.owner}/${CONFIG.repo}`);
        console.log('Token gültig!');

        // Token in sessionStorage speichern (wird bei Tab-Schließung gelöscht)
        sessionStorage.setItem('github_token', token);
        // Sicherstellen, dass kein Token in localStorage verbleibt
        localStorage.removeItem('github_token');

        document.getElementById('setupScreen').classList.add('hidden');
        toast('Erfolgreich eingerichtet!', 'success');
        initEditor();
    } catch (e) {
        console.error('Token Fehler:', e);
        toast('Token ungültig oder keine Berechtigung', 'error');
        state.token = null;
    }

    if (btn) {
        btn.disabled = false;
        btn.textContent = 'Editor starten';
    }
}
console.log('✓ blog-editor-github.js geladen');
