/* analytics/dashboard.js
 * Analytics Dashboard Logic | ~250 Zeilen
 * WICHTIG: Zeigt nur echte Daten - keine Demo/Fake-Daten!
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

        } catch (error) {
            console.warn('Analytics API nicht erreichbar:', error.message);
            // Leere Daten statt Demo-Daten
            this.data = {
                stats: {},
                pages: [],
                referrers: [],
                events: []
            };
        }

        this.updateKPIs();
        this.updateTopArticles();
        this.updateSources();
        this.updateFunnel();
        this.updateBlogTable();
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

        // Changes nur anzeigen wenn echte Daten vorhanden
        const visitorsChange = stats.visitorsChange;
        const pageviewsChange = stats.pageviewsChange;

        document.getElementById('kpiVisitorsChange').textContent = visitorsChange ? `${visitorsChange > 0 ? '+' : ''}${visitorsChange}%` : '-';
        document.getElementById('kpiPageviewsChange').textContent = pageviewsChange ? `${pageviewsChange > 0 ? '+' : ''}${pageviewsChange}%` : '-';
    },

    /**
     * Top Artikel aktualisieren
     */
    updateTopArticles() {
        const pages = this.data?.pages || [];
        const blogPages = pages.filter(p => p.url?.includes('/blog/') || p.url?.includes('.html'));

        const container = document.getElementById('topArticles');
        if (blogPages.length === 0) {
            container.innerHTML = '<div class="empty-state">Noch keine Blog-Daten vorhanden</div>';
            return;
        }

        container.innerHTML = blogPages.slice(0, 5).map((page, i) => `
            <div class="article-item">
                <span class="article-rank">${i + 1}</span>
                <div class="article-info">
                    <div class="article-title">${this.extractTitle(page.url)}</div>
                    <div class="article-stats">${page.visitors || 0} Besucher, ${page.scrollDepth || 0}% Scroll</div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Traffic-Quellen aktualisieren
     */
    updateSources() {
        const referrers = this.data?.referrers || [];

        const container = document.getElementById('trafficSources');

        if (referrers.length === 0) {
            container.innerHTML = '<div class="empty-state">Noch keine Traffic-Daten</div>';
            return;
        }

        const total = referrers.reduce((sum, r) => sum + (r.visitors || 0), 0) || 1;

        const sourceIcons = {
            'google': '🔍',
            'instagram': '📱',
            'facebook': '👤',
            'direct': '🔗',
            'newsletter': '📧'
        };

        container.innerHTML = referrers.slice(0, 5).map(ref => {
            const percent = Math.round(((ref.visitors || 0) / total) * 100);
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

        const blogReads = getEventCount('article_read');
        const ctaClicks = getEventCount('cta_click');
        const quizStarts = getEventCount('quiz_started');
        const contacts = getEventCount('booking_started');

        document.getElementById('funnelBlog').textContent = this.formatNumber(blogReads);
        document.getElementById('funnelCta').textContent = blogReads > 0 ? `${ctaClicks} (${this.calcPercent(ctaClicks, blogReads)}%)` : '0';
        document.getElementById('funnelQuiz').textContent = ctaClicks > 0 ? `${quizStarts} (${this.calcPercent(quizStarts, ctaClicks)}%)` : '0';
        document.getElementById('funnelContact').textContent = quizStarts > 0 ? `${contacts} (${this.calcPercent(contacts, quizStarts)}%)` : '0';

        const conversionRate = blogReads > 0 ? ((contacts / blogReads) * 100).toFixed(1) : '0';
        document.getElementById('conversionRate').textContent = `${conversionRate}%`;
    },

    /**
     * Blog Analytics Tabelle
     */
    updateBlogTable() {
        const pages = this.data?.pages || [];
        const blogPages = pages.filter(p => p.url?.includes('/blog/') || p.url?.includes('.html'));

        const tbody = document.getElementById('blogAnalyticsTable');

        if (blogPages.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Noch keine Blog-Analytics vorhanden</td></tr>';
            return;
        }

        tbody.innerHTML = blogPages.slice(0, 10).map(page => {
            return `
                <tr>
                    <td>${this.extractTitle(page.url)}</td>
                    <td>${page.visitors || 0}</td>
                    <td>${this.formatTime(page.avgReadTime || 0)}</td>
                    <td>${page.scrollDepth75 || 0}%</td>
                    <td>${page.ctaClicks || 0}</td>
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
     * Traffic Chart - zeigt echte Daten oder leeres Chart
     */
    initTrafficChart() {
        const ctx = document.getElementById('trafficChart');
        if (!ctx) return;

        const days = parseInt(document.getElementById('dateRange').value);
        const labels = Array.from({ length: days }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (days - 1 - i));
            return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
        });

        // Echte Daten aus API oder leeres Array mit Nullen
        const trafficData = this.data?.stats?.dailyVisitors || Array(days).fill(0);

        this.charts.traffic = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Besucher',
                    data: trafficData,
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
     * Devices Chart - zeigt echte Daten oder Platzhalter
     */
    initDevicesChart() {
        const ctx = document.getElementById('devicesChart');
        if (!ctx) return;

        // Echte Daten aus API oder leere Werte
        const devices = this.data?.stats?.devices || { desktop: 0, mobile: 0, tablet: 0 };

        this.charts.devices = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Desktop', 'Mobile', 'Tablet'],
                datasets: [{
                    data: [devices.desktop || 0, devices.mobile || 0, devices.tablet || 0],
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
        return (num || 0).toLocaleString('de-DE');
    },

    formatTime(seconds) {
        if (!seconds) return '0:00';
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

// ==========================================
// EVENT LISTENERS (CSP-safe)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Date Range Selector
    const dateRange = document.getElementById('dateRange');
    if (dateRange) {
        dateRange.addEventListener('change', () => {
            Dashboard.loadData();
        });
    }

    // Refresh Button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            Dashboard.refresh();
        });
    }
});

console.log('✓ Analytics Dashboard geladen (nur echte Daten)');
