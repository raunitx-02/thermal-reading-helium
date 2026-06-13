require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const { initDb } = require('./src/config/database');
const errorHandler = require('./src/middleware/error');

// Initialize database & tables
try {
  initDb();
  console.log('✔ SQLite Database initialized and synced.');
} catch (err) {
  console.error('✘ Database initialization failed:', err.message);
  process.exit(1);
}

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Request Logging
app.use(morgan('dev'));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads folder
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Register API Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/trains', require('./src/routes/trains'));
app.use('/api/sessions', require('./src/routes/sessions'));
app.use('/api/alerts', require('./src/routes/alerts'));
app.use('/api/dashboard', require('./src/routes/dashboard'));
app.use('/api/kpi', require('./src/routes/kpi'));
app.use('/api/reports', require('./src/routes/reports'));
app.use('/api/settings', require('./src/routes/settings'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/audit-logs', require('./src/routes/auditLogs'));

// Basic Health Check Route
app.get('/health', (req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'production'} mode on port ${PORT}`);
});
