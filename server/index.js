/**
 * Kathrin Coaching - API Server
 * Entry Point | ~80 Zeilen
 * Security: Rate-Limiting, CORS, Auth Middleware
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Routes
const schedulingRoutes = require('./routes/scheduling');
const healthRoutes = require('./routes/health');
const analyticsRoutes = require('./routes/analytics');
const aiProxyRoutes = require('./routes/ai-proxy');

// Middleware
const { limiters } = require('./middleware/rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Security Headers
app.use(helmet({
    contentSecurityPolicy: false, // Wir setzen eigene CSP
    crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
    origin: [
        'https://kathrinstahl.com',
        'https://www.kathrinstahl.com',
        'https://nickheymann.github.io',
        'http://localhost:3000',
        'http://localhost:8080'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parser mit Größenlimit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global Rate Limiter
app.use('/api/', limiters.standard);

// Routes
app.use('/api', healthRoutes);
app.use('/api', schedulingRoutes);
app.use('/api', analyticsRoutes);
app.use('/api/ai', aiProxyRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', path: req.path });
});

// Error Handler
app.use((err, req, res, next) => {
    const message = isProduction ? 'Internal Server Error' : err.message;
    console.error('API Error:', err.message);

    res.status(err.status || 500).json({
        error: err.name || 'Error',
        message
    });
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down...');
    process.exit(0);
});

// Start Server
app.listen(PORT, () => {
    console.log(`✓ Kathrin API Server running on port ${PORT}`);
    console.log(`  Environment: ${isProduction ? 'production' : 'development'}`);
    console.log(`  Health: http://localhost:${PORT}/api/health`);
});
