/* Analytics API Routes
 * Umami API Proxy | ~120 Zeilen
 */

const express = require('express');
const router = express.Router();

// Umami API Konfiguration
const UMAMI_URL = process.env.UMAMI_URL || 'http://localhost:3000';
const UMAMI_TOKEN = process.env.UMAMI_TOKEN; // API Token für Umami
const WEBSITE_ID = process.env.UMAMI_WEBSITE_ID;

/**
 * Helper: Umami API Request
 */
async function umamiRequest(endpoint) {
    const response = await fetch(`${UMAMI_URL}/api${endpoint}`, {
        headers: {
            'Authorization': `Bearer ${UMAMI_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Umami API Error: ${response.status}`);
    }

    return response.json();
}

/**
 * GET: Website-Statistiken
 */
router.get('/analytics/stats', async (req, res) => {
    try {
        const { start, end } = req.query;

        if (!WEBSITE_ID) {
            return res.status(500).json({ error: 'Website ID nicht konfiguriert' });
        }

        const startAt = new Date(start).getTime();
        const endAt = new Date(end).getTime();

        const stats = await umamiRequest(
            `/websites/${WEBSITE_ID}/stats?startAt=${startAt}&endAt=${endAt}`
        );

        res.json({
            visitors: stats.visitors?.value || 0,
            pageviews: stats.pageviews?.value || 0,
            bounceRate: stats.bounces?.value || 0,
            avgVisitDuration: stats.totaltime?.value || 0
        });

    } catch (error) {
        console.error('Analytics stats error:', error);
        res.status(500).json({ error: 'Statistiken konnten nicht geladen werden' });
    }
});

/**
 * GET: Top-Seiten
 */
router.get('/analytics/pages', async (req, res) => {
    try {
        const { start, end, limit = 10 } = req.query;

        const startAt = new Date(start).getTime();
        const endAt = new Date(end).getTime();

        const pages = await umamiRequest(
            `/websites/${WEBSITE_ID}/metrics?startAt=${startAt}&endAt=${endAt}&type=url`
        );

        res.json(pages.slice(0, parseInt(limit)).map(p => ({
            url: p.x,
            visitors: p.y
        })));

    } catch (error) {
        console.error('Analytics pages error:', error);
        res.status(500).json({ error: 'Seiten konnten nicht geladen werden' });
    }
});

/**
 * GET: Referrer (Traffic-Quellen)
 */
router.get('/analytics/referrers', async (req, res) => {
    try {
        const { start, end } = req.query;

        const startAt = new Date(start).getTime();
        const endAt = new Date(end).getTime();

        const referrers = await umamiRequest(
            `/websites/${WEBSITE_ID}/metrics?startAt=${startAt}&endAt=${endAt}&type=referrer`
        );

        res.json(referrers.map(r => ({
            referrer: r.x || null,
            visitors: r.y
        })));

    } catch (error) {
        console.error('Analytics referrers error:', error);
        res.status(500).json({ error: 'Referrer konnten nicht geladen werden' });
    }
});

/**
 * GET: Custom Events
 */
router.get('/analytics/events', async (req, res) => {
    try {
        const { start, end, event } = req.query;

        const startAt = new Date(start).getTime();
        const endAt = new Date(end).getTime();

        let endpoint = `/websites/${WEBSITE_ID}/events?startAt=${startAt}&endAt=${endAt}`;

        const events = await umamiRequest(endpoint);

        // Filter nach Event-Name falls angegeben
        let result = events;
        if (event) {
            result = events.filter(e => e.event_name === event);
        }

        res.json(result.map(e => ({
            event_name: e.x || e.event_name,
            count: e.y || e.count
        })));

    } catch (error) {
        console.error('Analytics events error:', error);
        res.status(500).json({ error: 'Events konnten nicht geladen werden' });
    }
});

module.exports = router;
