/* analytics/dashboard.js
 * Analytics Dashboard Logic | ~250 Zeilen
 */

const Dashboard = {
    apiUrl: 'https://analytics.kathrinstahl.com/api',
    charts: {},
    data: null,

    /**
     * Dashboard initialisieren
     */
    async init() {
        // API URL für lokale Entwicklung
        if (window.location.hostname === 'localhost') {
            this.apiUrl = 'http://localhost:3001/api';
        }

        await this.loadData();
        this.initCharts();
    },

    /**
     * Alle Daten laden
     */
    async loadData() {
        const days = document.getElementById('dateRange').value;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        try {
            // Parallel laden
            const [stats, pages, referrers, events] = await Promise.all([
                this.fetchAPI(`/analytics/stats?start=${this.formatDate(startDate)}&end=${this.formatDate(endDate)}`),
                this.fetchAPI(`/analytics/pages?start=${this.formatDate(startDate)}&end=${this.formatDate(endDate)}`),
                this.fetchAPI(`/analytics/referrers?start=${this.formatDate(startDate)}&end=${this.formatDate(endDate)}`),
                this.fetchAPI(`/analytics/events?start=${this.formatDate(startDate)}&end=${this.formatDate(endDate)}`)
            ]);

            this.data = { stats, pages, referrers, events };
            this.updateKPIs();
            this.updateTopArticles();
            this.updateSources();
            this.updateFunnel();
            this.updateBlogTable();

        } catch (error) {
            console.error('Fehler beim Laden:', error);
            this.showDemoData();
        }
    },

    /**
     * API Fetch mit Error Handling
     */
    async fetchAPI(endpoint) {
        const response = await fetch(`${this.apiUrl}${endpoint}`);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return response.json();
    },

    /**
     * KPI Cards aktualisieren
     */
    updateKPIs() {
        const stats = this.data?.stats || {};

        document.getElementById('kpiVisitors').textContent = this.formatNumber(stats.visitors || 0);
        document.getElementById('kpiPageviews').textContent = this.formatNumber(stats.pageviews || 0);
        document.getElementById('kpiReadTime').textContent = this.formatTime(stats.avgReadTime || 0);
        document.getElementById('kpiScrollDepth').textContent = `${stats.scrollDepth75 || 0}%`;

        // Changes (Mock für Demo)
        document.getElementById('kpiVisitorsChange').textContent = '+12%';
        document.getElementById('kpiPageviewsChange').textContent = '+8%';
    },

    /**
     * Top Artikel aktualisieren
     */
    updateTopArticles() {
        const pages = this.data?.pages || [];
        const blogPages = pages.filter(p => p.url?.includes('/blog/'));

        const container = document.getElementById('topArticles');
        if (blogPages.length === 0) {
            container.innerHTML = '<div class="loading-placeholder">Keine Blog-Daten verfügbar</div>';
            return;
        }

        container.innerHTML = blogPages.slice(0, 5).map((page, i) => `
            <div class="article-item">
                <span class="article-rank">${i + 1}</span>
                <div class="article-info">
                    <div class="article-title">${this.extractTitle(page.url)}</div>
                    <div class="article-stats">${page.visitors} Besucher, ${page.scrollDepth || '-'}% Scroll</div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Traffic-Quellen aktualisieren
     */
    updateSources() {
        const referrers = this.data?.referrers || [];
        const total = referrers.reduce((sum, r) => sum + r.visitors, 0) || 1;

        const sourceIcons = {
            'google': '🔍',
            'instagram': '📱',
            'facebook': '👤',
            'direct': '🔗',
            'newsletter': '📧'
        };

        const container = document.getElementById('trafficSources');
        container.innerHTML = referrers.slice(0, 5).map(ref => {
            const percent = Math.round((ref.visitors / total) * 100);
            const icon = Object.entries(sourceIcons).find(([k]) =>
                ref.referrer?.toLowerCase().includes(k)
            )?.[1] || '🌐';

            return `
                <div class="source-item">
                    <span class="source-icon">${icon}</span>
                    <span class="source-name">${ref.referrer || 'Direkt'}</span>
                    <div class="source-bar-bg">
                        <div class="source-bar" style="width: ${percent}%"></div>
                    </div>
                    <span class="source-percent">${percent}%</span>
                </div>
            `;
        }).join('');
    },

    /**
     * Lead Funnel aktualisieren
     */
    updateFunnel() {
        const events = this.data?.events || [];

        const getEventCount = (name) => events.find(e => e.event_name === name)?.count || 0;

        const blogReads = getEventCount('article_read') || this.data?.stats?.pageviews || 0;
        const ctaClicks = getEventCount('cta_click');
        const quizStarts = getEventCount('quiz_started');
        const contacts = getEventCount('booking_started');

        document.getElementById('funnelBlog').textContent = this.formatNumber(blogReads);
        document.getElementById('funnelCta').textContent = `${ctaClicks} (${this.calcPercent(ctaClicks, blogReads)}%)`;
        document.getElementById('funnelQuiz').textContent = `${quizStarts} (${this.calcPercent(quizStarts, ctaClicks)}%)`;
        document.getElementById('funnelContact').textContent = `${contacts} (${this.calcPercent(contacts, quizStarts)}%)`;

        const conversionRate = blogReads > 0 ? ((contacts / blogReads) * 100).toFixed(1) : '0';
        document.getElementById('conversionRate').textContent = `${conversionRate}%`;
    },

    /**
     * Blog Analytics Tabelle
     */
    updateBlogTable() {
        const pages = this.data?.pages || [];
        const events = this.data?.events || [];
        const blogPages = pages.filter(p => p.url?.includes('/blog/'));

        const tbody = document.getElementById('blogAnalyticsTable');

        if (blogPages.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="loading-placeholder">Keine Daten</td></tr>';
            return;
        }

        tbody.innerHTML = blogPages.slice(0, 10).map(page => {
            const slug = page.url?.split('/').pop()?.replace('.html', '');
            return `
                <tr>
                    <td>${this.extractTitle(page.url)}</td>
                    <td>${page.visitors || 0}</td>
                    <td>${this.formatTime(page.avgReadTime || 0)}</td>
                    <td>${page.scrollDepth75 || '-'}%</td>
                    <td>${page.ctaClicks || '-'}</td>
                </tr>
            `;
        }).join('');
    },

    /**
     * Charts initialisieren
     */
    initCharts() {
        this.initTrafficChart();
        this.initDevicesChart();
    },

    /**
     * Traffic Chart
     */
    initTrafficChart() {
        const ctx = document.getElementById('trafficChart');
        if (!ctx) return;

        // Demo-Daten
        const days = parseInt(document.getElementById('dateRange').value);
        const labels = Array.from({ length: days }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (days - 1 - i));
            return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
        });

        const data = Array.from({ length: days }, () =>
            Math.floor(Math.random() * 100) + 50
        );

        this.charts.traffic = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Besucher',
                    data,
                    borderColor: '#2C4A47',
                    backgroundColor: 'rgba(44, 74, 71, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    },

    /**
     * Devices Chart
     */
    initDevicesChart() {
        const ctx = document.getElementById('devicesChart');
        if (!ctx) return;

        this.charts.devices = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Desktop', 'Mobile', 'Tablet'],
                datasets: [{
                    data: [52, 41, 7],
                    backgroundColor: ['#2C4A47', '#D4A574', '#8B7355']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    },

    /**
     * Demo-Daten anzeigen (wenn API nicht erreichbar)
     */
    showDemoData() {
        this.data = {
            stats: { visitors: 2847, pageviews: 4523, avgReadTime: 263, scrollDepth75: 67 },
            pages: [
                { url: '/blog/warum-loslassen-so-schwer-ist.html', visitors: 432, scrollDepth: 78 },
                { url: '/blog/die-angst-vor-power.html', visitors: 387, scrollDepth: 65 },
                { url: '/blog/gehen-oder-bleiben.html', visitors: 298, scrollDepth: 82 }
            ],
            referrers: [
                { referrer: 'google.com', visitors: 1281 },
                { referrer: 'instagram.com', visitors: 655 },
                { referrer: null, visitors: 512 },
                { referrer: 'newsletter', visitors: 342 }
            ],
            events: [
                { event_name: 'article_read', count: 2847 },
                { event_name: 'cta_click', count: 423 },
                { event_name: 'quiz_started', count: 156 },
                { event_name: 'booking_started', count: 23 }
            ]
        };

        this.updateKPIs();
        this.updateTopArticles();
        this.updateSources();
        this.updateFunnel();
        this.updateBlogTable();
    },

    /**
     * Refresh
     */
    refresh() {
        if (this.charts.traffic) this.charts.traffic.destroy();
        if (this.charts.devices) this.charts.devices.destroy();
        this.loadData().then(() => this.initCharts());
    },

    // ==========================================
    // Helper
    // ==========================================

    formatDate(date) {
        return date.toISOString().split('T')[0];
    },

    formatNumber(num) {
        return num.toLocaleString('de-DE');
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    calcPercent(part, total) {
        if (!total) return '0';
        return ((part / total) * 100).toFixed(1);
    },

    extractTitle(url) {
        if (!url) return 'Unbekannt';
        const slug = url.split('/').pop()?.replace('.html', '') || url;
        return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
};

console.log('✓ Analytics Dashboard geladen');
