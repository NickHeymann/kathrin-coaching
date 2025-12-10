/**
 * __tests__/api.test.js
 * Integration Tests für API Endpoints
 */

const request = require('supertest');
const express = require('express');

// Mock Environment
process.env.API_SECRET_TOKEN = 'test-secret-token';
process.env.NODE_ENV = 'test';

// Import Routes
const healthRoutes = require('../routes/health');
const { authMiddleware } = require('../middleware/auth');
const { limiters } = require('../middleware/rate-limit');

// Test App Setup
const createTestApp = () => {
    const app = express();
    app.use(express.json());
    app.use('/api', healthRoutes);
    return app;
};

describe('Health Endpoint', () => {
    const app = createTestApp();

    it('GET /api/health returns 200', async () => {
        const res = await request(app).get('/api/health');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status', 'ok');
    });

    it('returns timestamp', async () => {
        const res = await request(app).get('/api/health');

        expect(res.body).toHaveProperty('timestamp');
        expect(new Date(res.body.timestamp)).toBeInstanceOf(Date);
    });
});

describe('Auth Middleware', () => {
    const createAuthApp = () => {
        const app = express();
        app.use(express.json());
        app.get('/protected', authMiddleware, (req, res) => {
            res.json({ message: 'success' });
        });
        return app;
    };

    it('rejects requests without auth header', async () => {
        const app = createAuthApp();
        const res = await request(app).get('/protected');

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error', 'Unauthorized');
    });

    it('rejects requests with invalid token', async () => {
        const app = createAuthApp();
        const res = await request(app)
            .get('/protected')
            .set('Authorization', 'Bearer invalid-token');

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('error', 'Forbidden');
    });

    it('accepts requests with valid token', async () => {
        const app = createAuthApp();
        const res = await request(app)
            .get('/protected')
            .set('Authorization', 'Bearer test-secret-token');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'success');
    });
});

describe('Rate Limiter Integration', () => {
    it('blocks after exceeding limit', async () => {
        const app = express();
        app.use(express.json());

        // Sehr niedriges Limit für Test
        const testLimiter = require('../middleware/rate-limit').createRateLimiter({
            windowMs: 60000,
            max: 2
        });

        app.get('/limited', testLimiter, (req, res) => {
            res.json({ ok: true });
        });

        // Request 1 & 2: OK
        await request(app).get('/limited').expect(200);
        await request(app).get('/limited').expect(200);

        // Request 3: Blocked
        const res = await request(app).get('/limited');
        expect(res.status).toBe(429);
        expect(res.body).toHaveProperty('error', 'Too Many Requests');
    });
});

describe('Input Validation Integration', () => {
    const { validateQuery } = require('../middleware/validate');

    it('validates query parameters', async () => {
        const app = express();
        app.get('/calendar',
            validateQuery({ month: 'month', year: 'year' }),
            (req, res) => res.json({ ok: true })
        );

        // Valid
        const validRes = await request(app).get('/calendar?month=12&year=2024');
        expect(validRes.status).toBe(200);

        // Invalid month
        const invalidRes = await request(app).get('/calendar?month=13&year=2024');
        expect(invalidRes.status).toBe(400);
        expect(invalidRes.body).toHaveProperty('error', 'Validation Error');
    });

    it('validates body parameters', async () => {
        const { validateBody } = require('../middleware/validate');

        const app = express();
        app.use(express.json());
        app.post('/posts',
            validateBody({ title: 'title', slug: 'slug' }),
            (req, res) => res.json({ ok: true })
        );

        // Valid
        const validRes = await request(app)
            .post('/posts')
            .send({ title: 'Test Post', slug: 'test-post' });
        expect(validRes.status).toBe(200);

        // Missing required field
        const invalidRes = await request(app)
            .post('/posts')
            .send({ title: 'Test Post' });
        expect(invalidRes.status).toBe(400);
    });
});

describe('Error Handling', () => {
    it('returns JSON for 404', async () => {
        const app = express();
        app.use((req, res) => {
            res.status(404).json({ error: 'Not Found' });
        });

        const res = await request(app).get('/nonexistent');

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Not Found');
    });
});
