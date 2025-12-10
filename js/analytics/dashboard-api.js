/* analytics/dashboard-api.js
 * API Client für Analytics Dashboard | ~100 Zeilen
 */

const DashboardAPI = {
    baseUrl: ANALYTICS_CONFIG?.schedulingApiUrl || '/api',

    /**
     * Fetch mit Error Handling
     */
    async fetch(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Dashboard API Error:', error);
            throw error;
        }
    },

    // ==========================================
    // Scheduling API
    // ==========================================

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
     * Neuen Post schedulen
     */
    async schedulePost(postData) {
        return this.fetch('/schedule', {
            method: 'POST',
            body: JSON.stringify(postData)
        });
    },

    /**
     * Post aktualisieren
     */
    async updatePost(id, postData) {
        return this.fetch(`/posts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(postData)
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

    // ==========================================
    // Umami Analytics API
    // ==========================================

    /**
     * Website-Statistiken abrufen
     * (Umami API Proxy - wird serverseitig implementiert)
     */
    async getStats(startDate, endDate) {
        return this.fetch(`/analytics/stats?start=${startDate}&end=${endDate}`);
    },

    /**
     * Top-Seiten abrufen
     */
    async getTopPages(startDate, endDate, limit = 10) {
        return this.fetch(`/analytics/pages?start=${startDate}&end=${endDate}&limit=${limit}`);
    },

    /**
     * Traffic-Quellen abrufen
     */
    async getReferrers(startDate, endDate) {
        return this.fetch(`/analytics/referrers?start=${startDate}&end=${endDate}`);
    },

    /**
     * Custom Events abrufen
     */
    async getEvents(startDate, endDate, eventName = null) {
        let url = `/analytics/events?start=${startDate}&end=${endDate}`;
        if (eventName) url += `&event=${eventName}`;
        return this.fetch(url);
    }
};

console.log('✓ analytics/dashboard-api.js geladen');
