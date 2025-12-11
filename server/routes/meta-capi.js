/**
 * Meta Conversion API Route
 * Server-side event tracking mit Deduplizierung
 * ~120 Zeilen | Verantwortung: Meta CAPI Events
 */

const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// Config
const META_PIXEL_ID = process.env.META_PIXEL_ID;
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_API_VERSION = 'v21.0';
const META_API_URL = `https://graph.facebook.com/${META_API_VERSION}/${META_PIXEL_ID}/events`;

/**
 * SHA-256 Hash für PII (Required by Meta)
 * @param {string} value - Zu hashender Wert
 * @returns {string|null} - SHA-256 Hash oder null
 */
function hashPII(value) {
    if (!value || typeof value !== 'string') return null;
    const normalized = value.toLowerCase().trim();
    return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Generiert event_id für Deduplizierung
 * Format: eventName_timestamp_random
 */
function generateEventId(eventName) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${eventName}_${timestamp}_${random}`;
}

/**
 * POST /api/meta/track
 * Empfängt Events vom Client und sendet sie an Meta CAPI
 *
 * Body:
 * - event_name: string (PageView, Lead, Purchase, etc.)
 * - event_id: string (optional, für Deduplizierung mit Pixel)
 * - event_source_url: string
 * - user_data: { email?, phone?, fn?, ln?, ct?, st?, zp?, country? }
 * - custom_data: { value?, currency?, content_name?, etc. }
 */
router.post('/meta/track', async (req, res) => {
    // Prüfe ob Meta konfiguriert ist
    if (!META_PIXEL_ID || !META_ACCESS_TOKEN) {
        return res.status(503).json({
            error: 'Meta CAPI not configured',
            message: 'Missing META_PIXEL_ID or META_ACCESS_TOKEN'
        });
    }

    try {
        const {
            event_name,
            event_id,
            event_source_url,
            user_data = {},
            custom_data = {}
        } = req.body;

        // Validierung
        if (!event_name) {
            return res.status(400).json({ error: 'event_name is required' });
        }

        // Event-ID: Nutze übergebene oder generiere neue
        const finalEventId = event_id || generateEventId(event_name);

        // User Data hashen (PII)
        const hashedUserData = {
            client_ip_address: req.ip,
            client_user_agent: req.get('User-Agent'),
            ...(user_data.email && { em: hashPII(user_data.email) }),
            ...(user_data.phone && { ph: hashPII(user_data.phone) }),
            ...(user_data.fn && { fn: hashPII(user_data.fn) }),
            ...(user_data.ln && { ln: hashPII(user_data.ln) }),
            ...(user_data.ct && { ct: hashPII(user_data.ct) }),
            ...(user_data.st && { st: hashPII(user_data.st) }),
            ...(user_data.zp && { zp: hashPII(user_data.zp) }),
            ...(user_data.country && { country: hashPII(user_data.country) }),
            ...(user_data.external_id && { external_id: hashPII(user_data.external_id) }),
            ...(user_data.fbc && { fbc: user_data.fbc }), // Click ID - nicht hashen
            ...(user_data.fbp && { fbp: user_data.fbp })  // Browser ID - nicht hashen
        };

        // Event Payload für Meta
        const eventPayload = {
            data: [{
                event_name,
                event_time: Math.floor(Date.now() / 1000),
                event_id: finalEventId,
                event_source_url: event_source_url || req.get('Referer'),
                action_source: 'website',
                user_data: hashedUserData,
                ...(Object.keys(custom_data).length > 0 && { custom_data })
            }],
            access_token: META_ACCESS_TOKEN
        };

        // An Meta senden
        const response = await fetch(META_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventPayload)
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Meta CAPI Error:', result);
            return res.status(response.status).json({
                error: 'Meta API Error',
                details: result.error?.message || 'Unknown error'
            });
        }

        // Erfolg
        res.json({
            success: true,
            event_id: finalEventId,
            events_received: result.events_received || 1
        });

    } catch (error) {
        console.error('Meta CAPI Error:', error.message);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to send event to Meta'
        });
    }
});

/**
 * GET /api/meta/status
 * Prüft ob Meta CAPI konfiguriert ist
 */
router.get('/meta/status', (req, res) => {
    res.json({
        configured: !!(META_PIXEL_ID && META_ACCESS_TOKEN),
        pixel_id: META_PIXEL_ID ? `${META_PIXEL_ID.slice(0, 4)}...` : null
    });
});

module.exports = router;
