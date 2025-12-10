/**
 * middleware/validate.js
 * Input-Validierung für API-Requests
 * ~120 Zeilen | Verantwortung: Request Validation
 */

/**
 * Validierungs-Regeln
 */
const rules = {
    // Scheduling
    month: (v) => Number.isInteger(parseInt(v)) && parseInt(v) >= 1 && parseInt(v) <= 12,
    year: (v) => Number.isInteger(parseInt(v)) && parseInt(v) >= 2020 && parseInt(v) <= 2100,
    postId: (v) => typeof v === 'string' && /^[a-zA-Z0-9-_]{1,100}$/.test(v),
    slug: (v) => typeof v === 'string' && /^[a-z0-9-]{1,200}$/.test(v),
    title: (v) => typeof v === 'string' && v.length >= 1 && v.length <= 500,
    status: (v) => ['draft', 'scheduled', 'published'].includes(v),

    // Analytics
    start: (v) => /^\d{4}-\d{2}-\d{2}$/.test(v),
    end: (v) => /^\d{4}-\d{2}-\d{2}$/.test(v),
    limit: (v) => !v || (Number.isInteger(parseInt(v)) && parseInt(v) >= 1 && parseInt(v) <= 100),

    // General
    id: (v) => typeof v === 'string' && /^[a-zA-Z0-9-_]{1,100}$/.test(v),
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    url: (v) => {
        try {
            new URL(v);
            return true;
        } catch {
            return false;
        }
    }
};

/**
 * Erstellt Validierungs-Middleware für Query-Parameter
 * @param {Object} schema - { paramName: 'ruleName' | Function }
 * @returns {Function} Express Middleware
 */
function validateQuery(schema) {
    return (req, res, next) => {
        const errors = [];

        for (const [param, rule] of Object.entries(schema)) {
            const value = req.query[param];
            const isRequired = !param.endsWith('?');
            const paramName = param.replace('?', '');

            // Required Check
            if (isRequired && (value === undefined || value === '')) {
                errors.push(`${paramName} ist erforderlich`);
                continue;
            }

            // Skip optional empty values
            if (!isRequired && (value === undefined || value === '')) {
                continue;
            }

            // Validate
            const validator = typeof rule === 'function' ? rule : rules[rule];
            if (validator && !validator(value)) {
                errors.push(`${paramName} ist ungültig`);
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({ error: 'Validation Error', details: errors });
        }

        next();
    };
}

/**
 * Erstellt Validierungs-Middleware für Body-Parameter
 * @param {Object} schema - { paramName: 'ruleName' | Function }
 * @returns {Function} Express Middleware
 */
function validateBody(schema) {
    return (req, res, next) => {
        const errors = [];

        for (const [param, rule] of Object.entries(schema)) {
            const value = req.body[param];
            const isRequired = !param.endsWith('?');
            const paramName = param.replace('?', '');

            // Required Check
            if (isRequired && (value === undefined || value === '' || value === null)) {
                errors.push(`${paramName} ist erforderlich`);
                continue;
            }

            // Skip optional empty values
            if (!isRequired && (value === undefined || value === '' || value === null)) {
                continue;
            }

            // Validate
            const validator = typeof rule === 'function' ? rule : rules[rule];
            if (validator && !validator(value)) {
                errors.push(`${paramName} ist ungültig`);
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({ error: 'Validation Error', details: errors });
        }

        next();
    };
}

/**
 * Sanitize HTML - entfernt gefährliche Tags
 * @param {string} html
 * @returns {string}
 */
function sanitizeHtml(html) {
    if (typeof html !== 'string') return '';
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/javascript:/gi, '');
}

module.exports = { validateQuery, validateBody, sanitizeHtml, rules };
