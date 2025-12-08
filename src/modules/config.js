/**
 * Configuration Module
 * Centralized configuration with URL parameter overrides
 */

/**
 * Gets URL parameter value
 * @param {string} name - Parameter name
 * @returns {string|null}
 */
function getUrlParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

/**
 * Application configuration
 * Can be overridden via URL parameters
 */
export const CONFIG = {
    // GitHub settings
    github: {
        owner: getUrlParam('owner') || 'NickHeymann',
        repo: getUrlParam('repo') || 'kathrin-coaching',
        branch: getUrlParam('branch') || 'kathrin-edits',
        mainBranch: getUrlParam('main') || 'main',
        apiBase: 'https://api.github.com',
        rawBase: 'https://raw.githubusercontent.com',
        cdnBase: 'https://cdn.jsdelivr.net/gh'
    },

    // Editor settings
    editor: {
        autosaveInterval: parseInt(getUrlParam('autosave')) || 30000,
        backupInterval: 10000,
        maxUndoSteps: 50,
        maxTrashItems: 20,
        maxHistoryPerElement: 10
    },

    // Rate limiting
    rateLimit: {
        maxCalls: 30,
        windowMs: 60000
    },

    // File settings
    files: {
        maxImageSize: 10 * 1024 * 1024, // 10MB
        maxVideoSize: 50 * 1024 * 1024, // 50MB
        allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        allowedVideoTypes: ['video/mp4', 'video/webm', 'video/quicktime']
    },

    // Pages available for editing
    pages: [
        { value: 'index.html', label: 'Startseite' },
        { value: 'about.html', label: 'Über mich' },
        { value: 'coaching.html', label: 'Coaching' },
        { value: 'blog.html', label: 'Blog' },
        { value: 'media.html', label: 'Medien' },
        { value: 'contact.html', label: 'Kontakt' }
    ]
};

/**
 * Gets the raw GitHub URL for a file
 * @param {string} path - File path
 * @param {string} [branch] - Branch name (defaults to editing branch)
 * @returns {string}
 */
export function getRawUrl(path, branch = CONFIG.github.branch) {
    return `${CONFIG.github.rawBase}/${CONFIG.github.owner}/${CONFIG.github.repo}/${branch}/${path}`;
}

/**
 * Gets the CDN URL for a file
 * @param {string} path - File path
 * @param {string} [branch] - Branch name (defaults to editing branch)
 * @returns {string}
 */
export function getCdnUrl(path, branch = CONFIG.github.branch) {
    return `${CONFIG.github.cdnBase}/${CONFIG.github.owner}/${CONFIG.github.repo}@${branch}/${path}`;
}

/**
 * Gets the GitHub API endpoint for a file
 * @param {string} path - File path
 * @param {string} [branch] - Branch name (defaults to editing branch)
 * @returns {string}
 */
export function getApiUrl(path, branch = CONFIG.github.branch) {
    return `/repos/${CONFIG.github.owner}/${CONFIG.github.repo}/contents/${path}?ref=${branch}`;
}

// Freeze config to prevent accidental modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.github);
Object.freeze(CONFIG.editor);
Object.freeze(CONFIG.rateLimit);
Object.freeze(CONFIG.files);
