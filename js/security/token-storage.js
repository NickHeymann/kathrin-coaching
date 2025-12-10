/**
 * security/token-storage.js
 * Sichere Token-Speicherung mit SessionStorage + AES
 * ~80 Zeilen | Verantwortung: Token CRUD Operations
 * Abhängigkeit: ./crypto.js
 */

const SecureTokenStorage = {
    // Storage Keys
    KEYS: {
        GITHUB: 'ks_gh_token',
        GROQ: 'ks_groq_key',
        SESSION: 'ks_session_id'
    },

    /**
     * Speichert Token verschlüsselt in SessionStorage
     * @param {string} key - Storage Key (aus KEYS)
     * @param {string} token - Der zu speichernde Token
     * @returns {Promise<boolean>}
     */
    async save(key, token) {
        if (!token || !this.KEYS[key.toUpperCase()]) {
            console.warn('SecureTokenStorage: Invalid key or empty token');
            return false;
        }

        try {
            const encrypted = await SecureCrypto.encrypt(token);
            sessionStorage.setItem(this.KEYS[key.toUpperCase()], encrypted);
            return true;
        } catch (error) {
            console.error('SecureTokenStorage save error:', error.message);
            return false;
        }
    },

    /**
     * Lädt und entschlüsselt Token aus SessionStorage
     * @param {string} key - Storage Key (aus KEYS)
     * @returns {Promise<string|null>}
     */
    async load(key) {
        const storageKey = this.KEYS[key.toUpperCase()];
        if (!storageKey) return null;

        try {
            const encrypted = sessionStorage.getItem(storageKey);
            if (!encrypted) return null;

            return await SecureCrypto.decrypt(encrypted);
        } catch (error) {
            console.error('SecureTokenStorage load error:', error.message);
            return null;
        }
    },

    /**
     * Entfernt Token aus Storage
     * @param {string} key - Storage Key (aus KEYS)
     */
    remove(key) {
        const storageKey = this.KEYS[key.toUpperCase()];
        if (storageKey) {
            sessionStorage.removeItem(storageKey);
        }
    },

    /**
     * Entfernt alle Tokens (Logout)
     */
    clearAll() {
        Object.values(this.KEYS).forEach(key => {
            sessionStorage.removeItem(key);
        });
    },

    /**
     * Migriert alte localStorage Tokens zu neuem sicheren Format
     * @returns {Promise<void>}
     */
    async migrateFromLocalStorage() {
        const oldKeys = ['github_token', 'blog_encrypted_token', 'groq_api_key'];

        for (const oldKey of oldKeys) {
            const oldValue = localStorage.getItem(oldKey);
            if (oldValue) {
                // Bestimme neuen Key
                const newKey = oldKey.includes('github') ? 'GITHUB' : 'GROQ';
                await this.save(newKey, oldValue);
                localStorage.removeItem(oldKey);
                console.log(`Migrated ${oldKey} to secure storage`);
            }
        }
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecureTokenStorage;
}
