/**
 * Storage Utilities
 * Safe localStorage/sessionStorage operations with fallbacks
 */

/**
 * Storage wrapper with JSON serialization and error handling
 */
class SafeStorage {
    /**
     * @param {Storage} storage - localStorage or sessionStorage
     */
    constructor(storage) {
        this.storage = storage;
        this.available = this._checkAvailability();
    }

    /**
     * Checks if storage is available
     * @private
     */
    _checkAvailability() {
        try {
            const test = '__storage_test__';
            this.storage.setItem(test, test);
            this.storage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Gets a value from storage
     * @param {string} key - Storage key
     * @param {*} [defaultValue=null] - Default value if not found
     * @returns {*} Parsed value or default
     */
    get(key, defaultValue = null) {
        if (!this.available) return defaultValue;
        try {
            const item = this.storage.getItem(key);
            if (item === null) return defaultValue;
            return JSON.parse(item);
        } catch (e) {
            console.warn(`Storage get error for key "${key}":`, e);
            return defaultValue;
        }
    }

    /**
     * Gets a raw string value from storage
     * @param {string} key - Storage key
     * @param {string} [defaultValue=''] - Default value if not found
     * @returns {string}
     */
    getRaw(key, defaultValue = '') {
        if (!this.available) return defaultValue;
        return this.storage.getItem(key) ?? defaultValue;
    }

    /**
     * Sets a value in storage
     * @param {string} key - Storage key
     * @param {*} value - Value to store (will be JSON serialized)
     * @returns {boolean} Success status
     */
    set(key, value) {
        if (!this.available) return false;
        try {
            this.storage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn(`Storage set error for key "${key}":`, e);
            return false;
        }
    }

    /**
     * Sets a raw string value in storage
     * @param {string} key - Storage key
     * @param {string} value - String value to store
     * @returns {boolean} Success status
     */
    setRaw(key, value) {
        if (!this.available) return false;
        try {
            this.storage.setItem(key, value);
            return true;
        } catch (e) {
            console.warn(`Storage setRaw error for key "${key}":`, e);
            return false;
        }
    }

    /**
     * Removes a value from storage
     * @param {string} key - Storage key
     * @returns {boolean} Success status
     */
    remove(key) {
        if (!this.available) return false;
        try {
            this.storage.removeItem(key);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Clears all values from storage
     * @returns {boolean} Success status
     */
    clear() {
        if (!this.available) return false;
        try {
            this.storage.clear();
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Checks if a key exists in storage
     * @param {string} key - Storage key
     * @returns {boolean}
     */
    has(key) {
        if (!this.available) return false;
        return this.storage.getItem(key) !== null;
    }
}

// Export singleton instances
export const localStore = new SafeStorage(localStorage);
export const sessionStore = new SafeStorage(sessionStorage);

// Token storage (uses sessionStorage for security)
export const tokenStorage = {
    TOKEN_KEY: 'github_token',
    LEGACY_KEY: 'github_token', // Same key, different storage

    /**
     * Gets the stored token, migrating from localStorage if needed
     * @returns {string|null}
     */
    get() {
        // First check sessionStorage
        let token = sessionStore.getRaw(this.TOKEN_KEY);

        // Migrate from localStorage if needed
        if (!token && localStore.has(this.LEGACY_KEY)) {
            token = localStore.getRaw(this.LEGACY_KEY);
            if (token) {
                sessionStore.setRaw(this.TOKEN_KEY, token);
                localStore.remove(this.LEGACY_KEY);
                console.log('Token migrated from localStorage to sessionStorage');
            }
        }

        return token || null;
    },

    /**
     * Stores the token securely
     * @param {string} token - The GitHub token
     */
    set(token) {
        sessionStore.setRaw(this.TOKEN_KEY, token);
        // Ensure no token remains in localStorage
        localStore.remove(this.LEGACY_KEY);
    },

    /**
     * Removes the stored token
     */
    remove() {
        sessionStore.remove(this.TOKEN_KEY);
        localStore.remove(this.LEGACY_KEY);
    }
};
