/* Kathrin Coaching - Scheduling API
 * Entry Point | ~50 Zeilen
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const schedulingRoutes = require('./routes/scheduling');
const healthRoutes = require('./routes/health');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: [
        'https://kathrinstahl.com',
        'https://www.kathrinstahl.com',
        'http://localhost:3000',
        'http://localhost:8080'
    ],
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api', healthRoutes);
app.use('/api', schedulingRoutes);
app.use('/api', analyticsRoutes);

// Error Handler
app.use((err, req, res, next) => {
    console.error('API Error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Kathrin Scheduling API running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});
