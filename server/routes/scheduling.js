/* Scheduling API Routes
 * ~150 Zeilen | Endpoints für Kalender & Scheduling
 */

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const cron = require('node-cron');
const { publishToGitHub } = require('../services/publisher');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// GET: Kalender-Events für Monat
router.get('/calendar', async (req, res) => {
    try {
        const { month, year } = req.query;
        const result = await pool.query(`
            SELECT id, title, slug, scheduled_for, status, categories, excerpt
            FROM scheduled_posts
            WHERE EXTRACT(MONTH FROM scheduled_for) = $1
              AND EXTRACT(YEAR FROM scheduled_for) = $2
            ORDER BY scheduled_for
        `, [month, year]);

        res.json(result.rows);
    } catch (error) {
        console.error('Calendar fetch error:', error);
        res.status(500).json({ error: 'Kalender konnte nicht geladen werden' });
    }
});

// GET: Einzelner Post
router.get('/posts/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM scheduled_posts WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Post nicht gefunden' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Post fetch error:', error);
        res.status(500).json({ error: 'Post konnte nicht geladen werden' });
    }
});

// POST: Neuen Post schedulen
router.post('/schedule', async (req, res) => {
    try {
        const { title, slug, content, excerpt, categories, featuredImage, scheduledFor, authorNotes } = req.body;

        const result = await pool.query(`
            INSERT INTO scheduled_posts
                (title, slug, content, excerpt, categories, featured_image, scheduled_for, status, author_notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [
            title,
            slug,
            JSON.stringify(content),
            excerpt,
            categories || [],
            featuredImage,
            scheduledFor,
            scheduledFor ? 'scheduled' : 'draft',
            authorNotes
        ]);

        res.json({ success: true, post: result.rows[0] });
    } catch (error) {
        console.error('Schedule error:', error);
        res.status(500).json({ error: 'Scheduling fehlgeschlagen' });
    }
});

// PUT: Post aktualisieren
router.put('/posts/:id', async (req, res) => {
    try {
        const { title, slug, content, excerpt, categories, featuredImage, scheduledFor, status, authorNotes } = req.body;

        const result = await pool.query(`
            UPDATE scheduled_posts SET
                title = COALESCE($1, title),
                slug = COALESCE($2, slug),
                content = COALESCE($3, content),
                excerpt = COALESCE($4, excerpt),
                categories = COALESCE($5, categories),
                featured_image = COALESCE($6, featured_image),
                scheduled_for = $7,
                status = COALESCE($8, status),
                author_notes = $9
            WHERE id = $10
            RETURNING *
        `, [
            title,
            slug,
            content ? JSON.stringify(content) : null,
            excerpt,
            categories,
            featuredImage,
            scheduledFor,
            status,
            authorNotes,
            req.params.id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Post nicht gefunden' });
        }

        res.json({ success: true, post: result.rows[0] });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: 'Update fehlgeschlagen' });
    }
});

// DELETE: Post löschen
router.delete('/posts/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM scheduled_posts WHERE id = $1 RETURNING id',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Post nicht gefunden' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Löschen fehlgeschlagen' });
    }
});

// Cron Job: Täglich um 09:00 Uhr veröffentlichen
cron.schedule('0 9 * * *', async () => {
    console.log('Checking for scheduled posts...');

    try {
        const due = await pool.query(`
            SELECT * FROM scheduled_posts
            WHERE status = 'scheduled'
              AND scheduled_for <= NOW()
        `);

        for (const post of due.rows) {
            await publishToGitHub(post, pool);
        }

        if (due.rows.length > 0) {
            console.log(`Published ${due.rows.length} posts`);
        }
    } catch (error) {
        console.error('Cron job error:', error);
    }
}, {
    timezone: 'Europe/Berlin'
});

module.exports = router;
