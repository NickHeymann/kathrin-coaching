/* Health Check Route
 * ~30 Zeilen
 */

const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'kathrin-scheduling-api',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
