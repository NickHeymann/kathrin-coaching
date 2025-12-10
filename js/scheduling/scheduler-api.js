/* scheduling/scheduler-api.js
 * API Client für Scheduling | ~100 Zeilen
 */

const SchedulerAPI = {
    /**
     * API URL ermitteln (lokal oder remote)
     */
    getBaseUrl() {
        if (window.location.hostname === 'localhost') {
            return SCHEDULING_CONFIG.localApiUrl;
        }
        return SCHEDULING_CONFIG.apiUrl;
    },

    /**
     * Fetch mit Error Handling
     */
    async fetch(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || `API Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Scheduler API Error:', error);
            throw error;
        }
    },

    /**
     * Kalender-Events für Monat laden
     */
    async getCalendarEvents(year, month) {
        return this.fetch(`/calendar?year=${year}&month=${month}`);
    },

    /**
     * Einzelnen Post laden
     */
    async getPost(id) {
        return this.fetch(`/posts/${id}`);
    },

    /**
     * Post schedulen oder als Entwurf speichern
     */
    async schedulePost(postData) {
        return this.fetch('/schedule', {
            method: 'POST',
            body: JSON.stringify(postData)
        });
    },

    /**
     * Post aktualisieren (Datum ändern, Status, etc.)
     */
    async updatePost(id, postData) {
        return this.fetch(`/posts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(postData)
        });
    },

    /**
     * Post-Datum ändern (für Drag & Drop)
     */
    async reschedulePost(id, newDate) {
        return this.updatePost(id, {
            scheduledFor: newDate,
            status: 'scheduled'
        });
    },

    /**
     * Post löschen
     */
    async deletePost(id) {
        return this.fetch(`/posts/${id}`, {
            method: 'DELETE'
        });
    },

    /**
     * Health Check
     */
    async checkHealth() {
        try {
            const result = await this.fetch('/health');
            return result.status === 'ok';
        } catch {
            return false;
        }
    }
};

console.log('✓ scheduling/scheduler-api.js geladen');
