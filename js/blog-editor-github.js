/* blog-editor-github.js
 * GitHub API Integration: Files, Images, Authentication
 * Zeilen: ~180 | Verantwortung: GitHub API Communication + Secure Token Storage
 * Abhängigkeiten: blog-editor-config.js, blog-editor-utils.js
 */

// ============================================
// SECURE TOKEN STORAGE (XOR-Verschlüsselung)
// ============================================
const TOKEN_KEY = 'blog_encrypted_token';
const TOKEN_KEY_OLD = 'github_token';

const tokenCrypto = {
    /**
     * Generiert einen geräte-spezifischen Schlüssel
     */
    getDeviceKey() {
        const parts = [
            navigator.userAgent.slice(0, 50),
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset().toString()
        ];
        return parts.join('|');
    },

    /**
     * XOR-Verschlüsselung
     */
    xorEncrypt(text, key) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(
                text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
        }
        return btoa(result);
    },

    /**
     * XOR-Entschlüsselung
     */
    xorDecrypt(encoded, key) {
        try {
            const text = atob(encoded);
            let result = '';
            for (let i = 0; i < text.length; i++) {
                result += String.fromCharCode(
                    text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
                );
            }
            return result;
        } catch {
            return null;
        }
    }
};

const tokenStorage = {
    /**
     * Speichert Token verschlüsselt in localStorage
     */
    save(token) {
        const key = tokenCrypto.getDeviceKey();
        const encrypted = tokenCrypto.xorEncrypt(token, key);
        localStorage.setItem(TOKEN_KEY, encrypted);

        // Alte Schlüssel aufräumen
        sessionStorage.removeItem(TOKEN_KEY_OLD);
        localStorage.removeItem(TOKEN_KEY_OLD);
    },

    /**
     * Lädt und entschlüsselt Token
     */
    load() {
        const key = tokenCrypto.getDeviceKey();

        // Versuche verschlüsselten Token zu laden
        const encrypted = localStorage.getItem(TOKEN_KEY);
        if (encrypted) {
            const token = tokenCrypto.xorDecrypt(encrypted, key);
            if (token && (token.startsWith('ghp_') || token.startsWith('github_pat_'))) {
                return token;
            }
        }

        // Migration von alten Speicherorten
        const oldTokenSession = sessionStorage.getItem(TOKEN_KEY_OLD);
        const oldTokenLocal = localStorage.getItem(TOKEN_KEY_OLD);
        const oldToken = oldTokenSession || oldTokenLocal;

        if (oldToken && (oldToken.startsWith('ghp_') || oldToken.startsWith('github_pat_'))) {
            this.save(oldToken);
            sessionStorage.removeItem(TOKEN_KEY_OLD);
            localStorage.removeItem(TOKEN_KEY_OLD);
            console.log('Token zur verschlüsselten Speicherung migriert');
            return oldToken;
        }

        return null;
    },

    /**
     * Entfernt Token
     */
    clear() {
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY_OLD);
        localStorage.removeItem(TOKEN_KEY_OLD);
    }
};

// ============================================
// GITHUB API WRAPPER
// ============================================
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

// Shared Token Storage (kompatibel mit CMS-Editor)
const tokenStorage = {
    TOKEN_KEY: 'cms_encrypted_token',

    getDeviceKey() {
        const parts = [
            navigator.userAgent.slice(0, 50),
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset().toString()
        ];
        return parts.join('|');
    },

    xorDecrypt(encoded, key) {
        try {
            const text = atob(encoded);
            let result = '';
            for (let i = 0; i < text.length; i++) {
                result += String.fromCharCode(
                    text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
                );
            }
            return result;
        } catch {
            return null;
        }
    },

    xorEncrypt(text, key) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(
                text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
        }
        return btoa(result);
    },

    load() {
        const key = this.getDeviceKey();
        const encrypted = localStorage.getItem(this.TOKEN_KEY);
        if (encrypted) {
            const token = this.xorDecrypt(encrypted, key);
            if (token && (token.startsWith('ghp_') || token.startsWith('github_pat_'))) {
                return token;
            }
        }
        // Fallback: alte Speicherorte
        return sessionStorage.getItem('github_token') || localStorage.getItem('github_token');
    },

    save(token) {
        const key = this.getDeviceKey();
        const encrypted = this.xorEncrypt(token, key);
        localStorage.setItem(this.TOKEN_KEY, encrypted);
        // Alte Speicherorte aufräumen
        sessionStorage.removeItem('github_token');
        localStorage.removeItem('github_token');
    }
};

// Token Setup & Check
function checkSetup() {
    // Lade Token aus sicherer verschlüsselter Speicherung
    const savedToken = tokenStorage.load();

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

    // Basis-Validierung des Token-Formats
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

        // Token sicher verschlüsselt speichern (kompatibel mit CMS-Editor)
        tokenStorage.save(token);

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
