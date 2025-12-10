/**
 * __tests__/rate-limit.test.js
 * Unit Tests für Rate Limiting
 */

const { createRateLimiter } = require('../middleware/rate-limit');

describe('Rate Limiter', () => {
    const mockReq = (ip = '127.0.0.1', path = '/test') => ({
        ip,
        path
    });

    const mockRes = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        res.setHeader = jest.fn();
        return res;
    };

    it('allows requests under limit', () => {
        const limiter = createRateLimiter({ windowMs: 1000, max: 5 });
        const req = mockReq('192.168.1.1', '/api/test');
        const res = mockRes();
        const next = jest.fn();

        // 5 Requests sollten durchgehen
        for (let i = 0; i < 5; i++) {
            limiter(req, res, next);
        }

        expect(next).toHaveBeenCalledTimes(5);
        expect(res.status).not.toHaveBeenCalledWith(429);
    });

    it('blocks requests over limit', () => {
        const limiter = createRateLimiter({ windowMs: 60000, max: 3 });
        const req = mockReq('192.168.1.2', '/api/blocked');
        const res = mockRes();
        const next = jest.fn();

        // 3 erlaubt, 4. blockiert
        for (let i = 0; i < 4; i++) {
            limiter(req, res, next);
        }

        expect(next).toHaveBeenCalledTimes(3);
        expect(res.status).toHaveBeenCalledWith(429);
    });

    it('sets rate limit headers', () => {
        const limiter = createRateLimiter({ windowMs: 1000, max: 10 });
        const req = mockReq('192.168.1.3', '/api/headers');
        const res = mockRes();
        const next = jest.fn();

        limiter(req, res, next);

        expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 10);
        expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(Number));
        expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(Number));
    });

    it('tracks different IPs separately', () => {
        const limiter = createRateLimiter({ windowMs: 60000, max: 2 });
        const next = jest.fn();

        // IP 1: 2 requests
        const req1 = mockReq('10.0.0.1', '/api/separate');
        const res1 = mockRes();
        limiter(req1, res1, next);
        limiter(req1, res1, next);

        // IP 2: auch 2 requests (sollte auch durchgehen)
        const req2 = mockReq('10.0.0.2', '/api/separate');
        const res2 = mockRes();
        limiter(req2, res2, next);
        limiter(req2, res2, next);

        // Alle 4 sollten durchgehen
        expect(next).toHaveBeenCalledTimes(4);
    });

    it('tracks different paths separately', () => {
        const limiter = createRateLimiter({ windowMs: 60000, max: 2 });
        const req1 = mockReq('10.0.0.3', '/api/path1');
        const req2 = mockReq('10.0.0.3', '/api/path2');
        const res = mockRes();
        const next = jest.fn();

        // Path 1: 2 requests
        limiter(req1, res, next);
        limiter(req1, res, next);

        // Path 2: auch 2 requests (separate counter)
        limiter(req2, res, next);
        limiter(req2, res, next);

        expect(next).toHaveBeenCalledTimes(4);
    });

    it('returns custom error message', () => {
        const customMessage = 'Bitte warten Sie einen Moment.';
        const limiter = createRateLimiter({ windowMs: 60000, max: 1, message: customMessage });
        const req = mockReq('10.0.0.4', '/api/custom');
        const res = mockRes();
        const next = jest.fn();

        limiter(req, res, next);
        limiter(req, res, next); // Über Limit

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: customMessage })
        );
    });
});
