/**
 * security/crypto.js
 * Sichere AES-GCM Verschlüsselung für sensible Daten
 * ~100 Zeilen | Verantwortung: Encryption/Decryption
 */

const SecureCrypto = {
    /**
     * Generiert einen deterministischen Key aus Device-Fingerprint
     * @returns {Promise<CryptoKey>}
     */
    async deriveKey() {
        const fingerprint = this.getDeviceFingerprint();
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(fingerprint),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: encoder.encode('kathrin-coaching-salt-v1'),
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    },

    /**
     * Device-spezifischer Fingerprint (nicht perfekt, aber besser als nichts)
     * @returns {string}
     */
    getDeviceFingerprint() {
        const parts = [
            navigator.userAgent.slice(0, 100),
            navigator.language,
            screen.width + 'x' + screen.height,
            screen.colorDepth,
            new Date().getTimezoneOffset().toString(),
            navigator.hardwareConcurrency || 4
        ];
        return parts.join('|');
    },

    /**
     * Verschlüsselt einen String mit AES-GCM
     * @param {string} plaintext
     * @returns {Promise<string>} Base64-encoded ciphertext
     */
    async encrypt(plaintext) {
        if (!plaintext) return '';

        const key = await this.deriveKey();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoder = new TextEncoder();

        const ciphertext = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            encoder.encode(plaintext)
        );

        // Kombiniere IV + Ciphertext für Storage
        const combined = new Uint8Array(iv.length + ciphertext.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(ciphertext), iv.length);

        return btoa(String.fromCharCode(...combined));
    },

    /**
     * Entschlüsselt einen Base64-String
     * @param {string} encrypted Base64-encoded ciphertext
     * @returns {Promise<string>} Plaintext
     */
    async decrypt(encrypted) {
        if (!encrypted) return '';

        try {
            const key = await this.deriveKey();
            const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));

            // Extrahiere IV (erste 12 Bytes) und Ciphertext
            const iv = combined.slice(0, 12);
            const ciphertext = combined.slice(12);

            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                ciphertext
            );

            return new TextDecoder().decode(decrypted);
        } catch (error) {
            console.warn('Decryption failed:', error.message);
            return '';
        }
    }
};

// Export für Module oder Global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecureCrypto;
}
