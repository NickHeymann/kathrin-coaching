/* api-keys.js
 * API Key Management für Supabase
 * Speichert GitHub Token, Groq API Key, etc.
 * Nutzt CryptoUtils für Verschlüsselung (crypto-utils.js muss zuerst geladen werden)
 */

const apiKeys = {
    // Wrapper für CryptoUtils (Fallback falls nicht geladen)
    encrypt(value) {
        if (window.CryptoUtils) {
            return window.CryptoUtils.encrypt(value);
        }
        // Fallback: unverschlüsselt (sollte nicht passieren)
        console.warn('CryptoUtils nicht geladen, speichere unverschlüsselt');
        return btoa(value);
    },

    decrypt(encoded) {
        if (window.CryptoUtils) {
            return window.CryptoUtils.decrypt(encoded);
        }
        // Fallback
        try {
            return atob(encoded);
        } catch {
            return null;
        }
    },

    // API Key speichern
    async saveKey(name, value) {
        const client = initSupabase();
        const user = await auth.getUser();
        if (!user) throw new Error('Nicht eingeloggt');

        const encryptedValue = this.encrypt(value);

        const { data, error } = await client
            .from('api_keys')
            .upsert({
                user_id: user.id,
                key_name: name,
                key_value: encryptedValue
            }, {
                onConflict: 'user_id,key_name'
            });

        if (error) throw error;

        // Auch lokal cachen für Offline-Nutzung
        this.cacheKey(name, encryptedValue);

        return data;
    },

    // API Key laden
    async getKey(name) {
        const client = initSupabase();
        const user = await auth.getUser();
        if (!user) {
            return this.getCachedKey(name);
        }

        const { data, error } = await client
            .from('api_keys')
            .select('key_value')
            .eq('user_id', user.id)
            .eq('key_name', name)
            .single();

        if (error || !data) {
            return this.getCachedKey(name);
        }

        const decrypted = this.decrypt(data.key_value);
        this.cacheKey(name, data.key_value);

        return decrypted;
    },

    // API Key löschen
    async deleteKey(name) {
        const client = initSupabase();
        const user = await auth.getUser();
        if (!user) throw new Error('Nicht eingeloggt');

        const { error } = await client
            .from('api_keys')
            .delete()
            .eq('user_id', user.id)
            .eq('key_name', name);

        if (error) throw error;
        localStorage.removeItem(`api_key_cache_${name}`);
    },

    // Alle Keys auflisten (nur Namen, nicht Werte)
    async listKeys() {
        const client = initSupabase();
        const user = await auth.getUser();
        if (!user) return [];

        const { data, error } = await client
            .from('api_keys')
            .select('key_name, created_at, updated_at')
            .eq('user_id', user.id);

        if (error) return [];
        return data;
    },

    // Lokaler Cache
    cacheKey(name, encryptedValue) {
        localStorage.setItem(`api_key_cache_${name}`, encryptedValue);
    },

    getCachedKey(name) {
        const cached = localStorage.getItem(`api_key_cache_${name}`);
        if (cached) {
            return this.decrypt(cached);
        }
        return null;
    },

    // Migration alter Keys
    async migrateOldKeys() {
        const oldCmsToken = localStorage.getItem('cms_encrypted_token');
        if (oldCmsToken) {
            try {
                // Nutze CryptoUtils für Entschlüsselung
                const token = window.CryptoUtils
                    ? window.CryptoUtils.decrypt(oldCmsToken)
                    : this.decrypt(oldCmsToken);

                if (token && (token.startsWith('ghp_') || token.startsWith('github_pat_'))) {
                    await this.saveKey('github_token', token);
                    localStorage.removeItem('cms_encrypted_token');
                    console.log('GitHub Token erfolgreich migriert');
                }
            } catch (e) {
                console.warn('Token-Migration fehlgeschlagen:', e);
            }
        }

        localStorage.removeItem('github_token');
        sessionStorage.removeItem('github_token');
    }
};

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = apiKeys;
}
