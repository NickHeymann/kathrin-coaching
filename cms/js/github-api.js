/**
 * GitHub API Wrapper
 * Sichere GitHub API Kommunikation mit Rate-Limiting
 * @module github-api
 */

import { CONFIG } from './config.js';
import { state } from './state.js';
import { utf8ToBase64, base64ToUtf8 } from './security.js';
import { rateLimiter } from './rate-limiter.js';

/**
 * Basis-Request an GitHub API
 * @param {string} endpoint - API Endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} API Response
 */
async function request(endpoint, options = {}) {
    return rateLimiter.throttle(async () => {
        const url = `https://api.github.com${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `token ${state.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('GitHub API Error:', error.message, response.status);

            const errorMessages = {
                401: 'Nicht autorisiert - Token ungültig',
                403: 'Zugriff verweigert - Rate Limit oder Berechtigungen',
                404: 'Nicht gefunden'
            };
            throw new Error(errorMessages[response.status] || 'GitHub API Fehler');
        }

        return response.json();
    });
}

/**
 * Dekodiert Base64 mit UTF-8 Support (für Umlaute)
 * @param {string} base64 - Base64-encoded content
 * @returns {string} Decoded content
 */
function decodeBase64UTF8(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
}

export const github = {
    /**
     * Lädt eine Datei von GitHub
     * @param {string} path - Dateipfad
     * @returns {Promise<string>} Dateiinhalt
     */
    async getFile(path) {
        try {
            const data = await request(
                `/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${path}?ref=${CONFIG.branch}`
            );
            state.fileSha[path] = data.sha;
            return decodeBase64UTF8(data.content);
        } catch (e) {
            // Fallback: Von main branch laden
            try {
                const data = await request(
                    `/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${path}?ref=${CONFIG.mainBranch}`
                );
                return decodeBase64UTF8(data.content);
            } catch (e2) {
                throw new Error('Datei nicht gefunden');
            }
        }
    },

    /**
     * Speichert eine Datei auf GitHub
     * @param {string} path - Dateipfad
     * @param {string} content - Dateiinhalt
     * @param {string} message - Commit message
     * @returns {Promise<Object>} API Response
     */
    async saveFile(path, content, message) {
        const body = {
            message,
            content: utf8ToBase64(content),
            branch: CONFIG.branch
        };

        if (state.fileSha[path]) {
            body.sha = state.fileSha[path];
        }

        const data = await request(
            `/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${path}`,
            { method: 'PUT', body: JSON.stringify(body) }
        );

        state.fileSha[path] = data.content.sha;
        return data;
    },

    /**
     * Lädt Commit-History
     * @param {string} path - Optional: Pfad für spezifische Datei
     * @returns {Promise<Array>} Commits
     */
    async getCommits(path = null) {
        let endpoint = `/repos/${CONFIG.owner}/${CONFIG.repo}/commits?sha=${CONFIG.branch}&per_page=10`;
        if (path) endpoint += `&path=${path}`;
        return request(endpoint);
    },

    /**
     * Lädt Datei bei spezifischem Commit
     * @param {string} path - Dateipfad
     * @param {string} sha - Commit SHA
     * @returns {Promise<string>} Dateiinhalt
     */
    async getFileAtCommit(path, sha) {
        const data = await request(
            `/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${path}?ref=${sha}`
        );
        return decodeBase64UTF8(data.content);
    },

    /**
     * Lädt ein Bild hoch
     * @param {string} filename - Dateiname
     * @param {string} base64Data - Base64-encoded Bilddaten
     * @returns {Promise<Object>} API Response
     */
    async uploadImage(filename, base64Data) {
        const content = base64Data.split(',')[1];
        return request(
            `/repos/${CONFIG.owner}/${CONFIG.repo}/contents/images/${filename}`,
            {
                method: 'PUT',
                body: JSON.stringify({
                    message: `Bild hochgeladen: ${filename}`,
                    content,
                    branch: CONFIG.branch
                })
            }
        );
    },

    /**
     * Lädt ein Video hoch
     * @param {string} filename - Dateiname
     * @param {string} base64Data - Base64-encoded Videodaten
     * @returns {Promise<Object>} API Response
     */
    async uploadVideo(filename, base64Data) {
        const content = base64Data.split(',')[1];
        return request(
            `/repos/${CONFIG.owner}/${CONFIG.repo}/contents/videos/${filename}`,
            {
                method: 'PUT',
                body: JSON.stringify({
                    message: `Video hochgeladen: ${filename}`,
                    content,
                    branch: CONFIG.branch
                })
            }
        );
    },

    /**
     * Validiert API-Zugang
     * @returns {Promise<boolean>}
     */
    async validateAccess() {
        try {
            await request(`/repos/${CONFIG.owner}/${CONFIG.repo}`);
            return true;
        } catch (e) {
            return false;
        }
    }
};
