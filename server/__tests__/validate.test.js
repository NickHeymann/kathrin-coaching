/**
 * __tests__/validate.test.js
 * Unit Tests für Input-Validierung
 */

const { validateQuery, validateBody, sanitizeHtml, rules } = require('../middleware/validate');

describe('Validation Rules', () => {
    describe('month', () => {
        it('accepts valid months 1-12', () => {
            expect(rules.month('1')).toBe(true);
            expect(rules.month('6')).toBe(true);
            expect(rules.month('12')).toBe(true);
        });

        it('rejects invalid months', () => {
            expect(rules.month('0')).toBe(false);
            expect(rules.month('13')).toBe(false);
            expect(rules.month('abc')).toBe(false);
        });
    });

    describe('year', () => {
        it('accepts valid years', () => {
            expect(rules.year('2024')).toBe(true);
            expect(rules.year('2025')).toBe(true);
        });

        it('rejects invalid years', () => {
            expect(rules.year('1999')).toBe(false);
            expect(rules.year('2101')).toBe(false);
        });
    });

    describe('postId', () => {
        it('accepts valid post IDs', () => {
            expect(rules.postId('abc-123')).toBe(true);
            expect(rules.postId('my_post_id')).toBe(true);
        });

        it('rejects invalid post IDs', () => {
            expect(rules.postId('')).toBe(false);
            expect(rules.postId('a'.repeat(101))).toBe(false);
            expect(rules.postId('id with spaces')).toBe(false);
        });
    });

    describe('slug', () => {
        it('accepts valid slugs', () => {
            expect(rules.slug('my-blog-post')).toBe(true);
            expect(rules.slug('post123')).toBe(true);
        });

        it('rejects invalid slugs', () => {
            expect(rules.slug('Post_With_Uppercase')).toBe(false);
            expect(rules.slug('')).toBe(false);
        });
    });

    describe('status', () => {
        it('accepts valid statuses', () => {
            expect(rules.status('draft')).toBe(true);
            expect(rules.status('scheduled')).toBe(true);
            expect(rules.status('published')).toBe(true);
        });

        it('rejects invalid statuses', () => {
            expect(rules.status('pending')).toBe(false);
            expect(rules.status('')).toBe(false);
        });
    });

    describe('date format', () => {
        it('accepts ISO date format', () => {
            expect(rules.start('2024-12-01')).toBe(true);
            expect(rules.end('2024-12-31')).toBe(true);
        });

        it('rejects invalid date formats', () => {
            expect(rules.start('12/01/2024')).toBe(false);
            expect(rules.start('2024-1-1')).toBe(false);
        });
    });

    describe('email', () => {
        it('accepts valid emails', () => {
            expect(rules.email('test@example.com')).toBe(true);
            expect(rules.email('name+tag@domain.co.uk')).toBe(true);
        });

        it('rejects invalid emails', () => {
            expect(rules.email('not-an-email')).toBe(false);
            expect(rules.email('@missing-local.com')).toBe(false);
        });
    });
});

describe('sanitizeHtml', () => {
    it('removes script tags', () => {
        const input = '<p>Hello</p><script>alert("xss")</script>';
        expect(sanitizeHtml(input)).toBe('<p>Hello</p>');
    });

    it('removes event handlers', () => {
        const input = '<img src="x" onerror="alert(1)">';
        expect(sanitizeHtml(input)).toBe('<img src="x" >');
    });

    it('removes javascript: URLs', () => {
        const input = '<a href="javascript:alert(1)">click</a>';
        expect(sanitizeHtml(input)).not.toContain('javascript:');
    });

    it('handles non-string input', () => {
        expect(sanitizeHtml(null)).toBe('');
        expect(sanitizeHtml(undefined)).toBe('');
        expect(sanitizeHtml(123)).toBe('');
    });
});

describe('validateQuery Middleware', () => {
    const mockRes = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    it('calls next() for valid query', () => {
        const middleware = validateQuery({ month: 'month', year: 'year' });
        const req = { query: { month: '12', year: '2024' } };
        const res = mockRes();
        const next = jest.fn();

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 400 for missing required param', () => {
        const middleware = validateQuery({ month: 'month', year: 'year' });
        const req = { query: { month: '12' } };
        const res = mockRes();
        const next = jest.fn();

        middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('allows optional params', () => {
        const middleware = validateQuery({ 'limit?': 'limit' });
        const req = { query: {} };
        const res = mockRes();
        const next = jest.fn();

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});
