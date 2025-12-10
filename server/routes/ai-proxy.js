/**
 * routes/ai-proxy.js
 * Backend-Proxy für Groq AI API (hält API-Key serverseitig)
 * ~100 Zeilen | Verantwortung: AI API Proxy
 */

const express = require('express');
const router = express.Router();
const { limiters } = require('../middleware/rate-limit');
const { authMiddleware } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * POST /api/ai/chat
 * Proxy für Groq Chat Completions
 */
router.post('/chat',
    limiters.heavy,
    authMiddleware,
    validateBody({
        messages: (v) => Array.isArray(v) && v.length > 0,
        'model?': (v) => !v || typeof v === 'string',
        'temperature?': (v) => !v || (typeof v === 'number' && v >= 0 && v <= 2),
        'max_tokens?': (v) => !v || (Number.isInteger(v) && v > 0 && v <= 4096)
    }),
    async (req, res) => {
        const groqApiKey = process.env.GROQ_API_KEY;

        if (!groqApiKey) {
            return res.status(500).json({
                error: 'Configuration Error',
                message: 'GROQ_API_KEY nicht konfiguriert'
            });
        }

        try {
            const { messages, model = 'llama-3.1-70b-versatile', temperature = 0.7, max_tokens = 2048 } = req.body;

            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model,
                    messages,
                    temperature,
                    max_tokens
                })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                return res.status(response.status).json({
                    error: 'Groq API Error',
                    message: error.error?.message || 'Unbekannter Fehler'
                });
            }

            const data = await response.json();
            res.json(data);

        } catch (error) {
            console.error('AI Proxy Error:', error.message);
            res.status(500).json({
                error: 'Proxy Error',
                message: 'Fehler bei der AI-Anfrage'
            });
        }
    }
);

/**
 * POST /api/ai/transcribe
 * Proxy für Groq Whisper Transcription
 */
router.post('/transcribe',
    limiters.heavy,
    authMiddleware,
    async (req, res) => {
        const groqApiKey = process.env.GROQ_API_KEY;

        if (!groqApiKey) {
            return res.status(500).json({
                error: 'Configuration Error',
                message: 'GROQ_API_KEY nicht konfiguriert'
            });
        }

        try {
            // Forward FormData to Groq
            const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqApiKey}`
                },
                body: req.body
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                return res.status(response.status).json({
                    error: 'Groq API Error',
                    message: error.error?.message || 'Transcription fehlgeschlagen'
                });
            }

            const data = await response.json();
            res.json(data);

        } catch (error) {
            console.error('Transcription Proxy Error:', error.message);
            res.status(500).json({
                error: 'Proxy Error',
                message: 'Fehler bei der Transkription'
            });
        }
    }
);

module.exports = router;
