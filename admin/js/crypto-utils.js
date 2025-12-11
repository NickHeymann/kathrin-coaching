/* crypto-utils.js
 * Zentrale Verschlüsselungsfunktionen für Token-Storage
 * Wird verwendet von: auth-check.js, api-keys.js, cms/js/storage.js
 *
 * SECURITY NOTE:
 * Die XOR-"Verschlüsselung" ist nur Obfuskation, KEINE echte Sicherheit.
 * Die tatsächliche Sicherheit kommt von:
 * 1. Supabase Row Level Security (RLS) - Server-seitige Zugriffskontrolle
 * 2. HTTPS - Transport-Verschlüsselung
 * 3. GitHub Token Scopes - Begrenzte Berechtigungen
 *
 * Client-seitige Verschlüsselung kann von jedem mit DevTools-Zugang
 * umgangen werden. Die XOR-Obfuskation verhindert nur:
 * - Casual snooping durch andere Browser-Extensions
 * - Versehentliches Logging von Klartext-Tokens
 */

const CryptoUtils = {
    /**
     * Geräte-spezifischer Schlüssel für Verschlüsselung
     * Kombiniert Browser-Fingerprint-Elemente
     */
    getDeviceKey() {
        return [
            navigator.userAgent.slice(0, 50),
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset().toString()
        ].join('|');
    },

    /**
     * XOR-Verschlüsselung mit Base64-Encoding
     * Hinweis: Dies ist keine starke Kryptographie, sondern nur Obfuskation.
     * Die echte Sicherheit kommt von Supabase RLS.
     */
    encrypt(value) {
        if (!value) return null;
        const key = this.getDeviceKey();
        let result = '';
        for (let i = 0; i < value.length; i++) {
            result += String.fromCharCode(
                value.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
        }
        return btoa(result);
    },

    /**
     * XOR-Entschlüsselung
     */
    decrypt(encoded) {
        if (!encoded) return null;
        try {
            const key = this.getDeviceKey();
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

    /**
     * Validiert GitHub Token Format
     */
    isValidGithubToken(token) {
        if (!token) return false;
        return token.startsWith('ghp_') || token.startsWith('github_pat_');
    }
};

// Export für globalen Zugriff
window.CryptoUtils = CryptoUtils;

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CryptoUtils;
}
