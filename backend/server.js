require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const { initDb, getDb } = require('./src/config/database');
const errorHandler = require('./src/middleware/error');

// Initialize database & tables
initDb().then(async () => {
  console.log('✔ Database initialized and synced.');
  try {
    const db = getDb();
    await db.exec(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_activated INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS activation_token TEXT;
    `);
    await db.exec(`
      UPDATE users SET is_activated = 1 WHERE is_activated = 0 AND password_hash IS NOT NULL;
    `);
    console.log('✔ Database activation migration applied successfully.');
  } catch (migErr) {
    console.error('⚠️ Database migration failed:', migErr.message);
  }
}).catch (err => {
  console.error('✘ Database initialization failed:', err.message);
});

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5050',
  'https://thermal-frontend.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true
}));

// Request Logging
app.use(morgan('dev'));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads folder
try {
  const uploadDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  app.use('/uploads', express.static(uploadDir));
} catch (err) {
  console.warn('⚠️ Warning: Uploads directory creation bypassed (Read-only filesystem):', err.message);
  // Fallback to /tmp for temporary uploads if needed
  app.use('/uploads', express.static('/tmp'));
}

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Register API Routes
app.use('/api/geo', require('./src/routes/geo'));
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/trains', require('./src/routes/trains'));
app.use('/api/assignments', require('./src/routes/assignments'));
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
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'production'} mode on port ${PORT}`);
  });
}

module.exports = app;
