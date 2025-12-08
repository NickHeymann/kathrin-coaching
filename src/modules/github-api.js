/**
 * GitHub API Module
 * Handles all GitHub API interactions
 */

import { CONFIG } from './config.js';
import { apiRateLimiter } from '../utils/rate-limiter.js';
import { utf8ToBase64, base64ToUtf8 } from '../utils/security.js';

/**
 * GitHub API client
 */
class GitHubAPI {
    constructor() {
        this.token = null;
        this.fileShas = new Map();
    }

    /**
     * Sets the authentication token
     * @param {string} token - GitHub personal access token
     */
    setToken(token) {
        this.token = token;
    }

    /**
     * Makes an authenticated API request
     * @param {string} endpoint - API endpoint (without base URL)
     * @param {Object} [options={}] - Fetch options
     * @returns {Promise<any>} Response data
     */
    async request(endpoint, options = {}) {
        if (!this.token) {
            throw new Error('No GitHub token configured');
        }

        // Respect rate limits
        await apiRateLimiter.waitForSlot();
        apiRateLimiter.recordCall();

        const url = `${CONFIG.github.apiBase}${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `token ${this.token}`,
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
                403: 'Zugriff verweigert - Rate Limit oder fehlende Berechtigungen',
                404: 'Nicht gefunden',
                422: 'Ungültige Anfrage'
            };

            throw new Error(errorMessages[response.status] || 'GitHub API Fehler');
        }

        return response.json();
    }

    /**
     * Gets a file from the repository
     * @param {string} path - File path
     * @param {string} [branch] - Branch name
     * @returns {Promise<string>} File content
     */
    async getFile(path, branch = CONFIG.github.branch) {
        try {
            const data = await this.request(
                `/repos/${CONFIG.github.owner}/${CONFIG.github.repo}/contents/${path}?ref=${branch}`
            );
            this.fileShas.set(path, data.sha);
            return base64ToUtf8(data.content);
        } catch (e) {
            // Try main branch as fallback
            if (branch !== CONFIG.github.mainBranch) {
                try {
                    const data = await this.request(
                        `/repos/${CONFIG.github.owner}/${CONFIG.github.repo}/contents/${path}?ref=${CONFIG.github.mainBranch}`
                    );
                    return base64ToUtf8(data.content);
                } catch {
                    throw new Error('Datei nicht gefunden');
                }
            }
            throw e;
        }
    }

    /**
     * Saves a file to the repository
     * @param {string} path - File path
     * @param {string} content - File content
     * @param {string} message - Commit message
     * @param {string} [branch] - Branch name
     * @returns {Promise<Object>} Commit data
     */
    async saveFile(path, content, message, branch = CONFIG.github.branch) {
        const body = {
            message,
            content: utf8ToBase64(content),
            branch
        };

        // Include SHA if file exists (for updates)
        const sha = this.fileShas.get(path);
        if (sha) {
            body.sha = sha;
        }

        const data = await this.request(
            `/repos/${CONFIG.github.owner}/${CONFIG.github.repo}/contents/${path}`,
            { method: 'PUT', body: JSON.stringify(body) }
        );

        this.fileShas.set(path, data.content.sha);
        return data;
    }

    /**
     * Uploads a binary file (image/video)
     * @param {string} path - File path
     * @param {string} base64Data - Base64 encoded file data (with data URL prefix)
     * @param {string} message - Commit message
     * @param {string} [branch] - Branch name
     * @returns {Promise<Object>} Commit data
     */
    async uploadBinary(path, base64Data, message, branch = CONFIG.github.branch) {
        // Remove data URL prefix if present
        const content = base64Data.includes(',')
            ? base64Data.split(',')[1]
            : base64Data;

        const body = {
            message,
            content,
            branch
        };

        return this.request(
            `/repos/${CONFIG.github.owner}/${CONFIG.github.repo}/contents/${path}`,
            { method: 'PUT', body: JSON.stringify(body) }
        );
    }

    /**
     * Gets recent commits
     * @param {string} [path] - Filter by file path
     * @param {number} [limit=10] - Number of commits to fetch
     * @param {string} [branch] - Branch name
     * @returns {Promise<Array>} List of commits
     */
    async getCommits(path = null, limit = 10, branch = CONFIG.github.branch) {
        let endpoint = `/repos/${CONFIG.github.owner}/${CONFIG.github.repo}/commits?sha=${branch}&per_page=${limit}`;
        if (path) {
            endpoint += `&path=${encodeURIComponent(path)}`;
        }
        return this.request(endpoint);
    }

    /**
     * Gets a file at a specific commit
     * @param {string} path - File path
     * @param {string} sha - Commit SHA
     * @returns {Promise<string>} File content
     */
    async getFileAtCommit(path, sha) {
        const data = await this.request(
            `/repos/${CONFIG.github.owner}/${CONFIG.github.repo}/contents/${path}?ref=${sha}`
        );
        return base64ToUtf8(data.content);
    }

    /**
     * Tests if the token has valid access to the repository
     * @returns {Promise<boolean>}
     */
    async testAccess() {
        try {
            await this.request(`/repos/${CONFIG.github.owner}/${CONFIG.github.repo}`);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Gets the stored SHA for a file
     * @param {string} path - File path
     * @returns {string|undefined}
     */
    getSha(path) {
        return this.fileShas.get(path);
    }

    /**
     * Clears stored SHAs
     */
    clearShas() {
        this.fileShas.clear();
    }
}

// Export singleton instance
export const github = new GitHubAPI();
