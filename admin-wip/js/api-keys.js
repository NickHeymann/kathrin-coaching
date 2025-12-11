/* api-keys.js
 * API Key Management für Supabase
 * Speichert GitHub Token, Groq API Key, etc.
 */

const apiKeys = {
    // Zusätzliche Client-seitige Verschlüsselung
    getEncryptionKey() {
        const parts = [
            navigator.userAgent.slice(0, 30),
            navigator.language,
            screen.width + 'x' + screen.height
        ];
        return parts.join('|');
    },

    encrypt(value) {
        const key = this.getEncryptionKey();
        let result = '';
        for (let i = 0; i < value.length; i++) {
            result += String.fromCharCode(
                value.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
        }
        return btoa(result);
    },

    decrypt(encoded) {
        try {
            const key = this.getEncryptionKey();
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
            // Fallback: Lokaler Cache
            return this.getCachedKey(name);
        }

        const { data, error } = await client
            .from('api_keys')
            .select('key_value')
            .eq('user_id', user.id)
            .eq('key_name', name)
            .single();

        if (error || !data) {
            // Fallback: Lokaler Cache
            return this.getCachedKey(name);
        }

        const decrypted = this.decrypt(data.key_value);

        // Cache aktualisieren
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

        // Aus Cache entfernen
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

    // Lokaler Cache für Offline-Nutzung
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

    // Migration: Alte localStorage Keys zu Supabase
    async migrateOldKeys() {
        // CMS Token
        const oldCmsToken = localStorage.getItem('cms_encrypted_token');
        if (oldCmsToken) {
            // Altes XOR-Decrypt
            const oldKey = [
                navigator.userAgent.slice(0, 50),
                navigator.language,
                screen.width + 'x' + screen.height,
                new Date().getTimezoneOffset().toString()
            ].join('|');

            try {
                const text = atob(oldCmsToken);
                let token = '';
                for (let i = 0; i < text.length; i++) {
                    token += String.fromCharCode(
                        text.charCodeAt(i) ^ oldKey.charCodeAt(i % oldKey.length)
                    );
                }

                if (token.startsWith('ghp_') || token.startsWith('github_pat_')) {
                    await this.saveKey('github_token', token);
                    localStorage.removeItem('cms_encrypted_token');
                    console.log('GitHub Token erfolgreich migriert');
                }
            } catch (e) {
                console.warn('Token-Migration fehlgeschlagen:', e);
            }
        }

        // Weitere alte Keys aufräumen
        localStorage.removeItem('github_token');
        sessionStorage.removeItem('github_token');
    }
};

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = apiKeys;
}
