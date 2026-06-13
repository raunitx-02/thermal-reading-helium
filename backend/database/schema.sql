-- Bogie Thermal Inspection Portal
-- Database Schema

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'inspector')),
  division TEXT NOT NULL DEFAULT 'Central',
  phone TEXT,
  employee_id TEXT UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1,
  reset_otp TEXT,
  reset_otp_expires INTEGER,
  last_login INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Trains table
CREATE TABLE IF NOT EXISTS trains (
  id TEXT PRIMARY KEY,
  train_number TEXT UNIQUE NOT NULL,
  train_name TEXT NOT NULL,
  route TEXT NOT NULL,
  division TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'Daily',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Coaches table
CREATE TABLE IF NOT EXISTS coaches (
  id TEXT PRIMARY KEY,
  train_id TEXT NOT NULL REFERENCES trains(id) ON DELETE CASCADE,
  coach_number TEXT NOT NULL,
  coach_type TEXT NOT NULL CHECK(coach_type IN ('AC-1', 'AC-2', 'AC-3', 'SL', 'GEN', 'Pantry', 'Loco')),
  sequence_order INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(train_id, coach_number)
);

-- Zones table
CREATE TABLE IF NOT EXISTS zones (
  id TEXT PRIMARY KEY,
  coach_id TEXT NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  zone_name TEXT NOT NULL,
  zone_type TEXT NOT NULL,
  normal_min REAL NOT NULL DEFAULT 20.0,
  normal_max REAL NOT NULL DEFAULT 60.0,
  warning_threshold REAL NOT NULL DEFAULT 70.0,
  critical_threshold REAL NOT NULL DEFAULT 85.0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(coach_id, zone_name)
);

-- Inspection sessions table
CREATE TABLE IF NOT EXISTS inspection_sessions (
  id TEXT PRIMARY KEY,
  inspector_id TEXT NOT NULL REFERENCES users(id),
  train_id TEXT NOT NULL REFERENCES trains(id),
  inspection_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('draft', 'submitted')) DEFAULT 'draft',
  remarks TEXT,
  submitted_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Thermal readings table
CREATE TABLE IF NOT EXISTS thermal_readings (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES inspection_sessions(id) ON DELETE CASCADE,
  zone_id TEXT NOT NULL REFERENCES zones(id),
  temperature REAL NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('normal', 'warning', 'critical')) DEFAULT 'normal',
  notes TEXT,
  recorded_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  zone_id TEXT NOT NULL REFERENCES zones(id),
  reading_id TEXT REFERENCES thermal_readings(id),
  session_id TEXT REFERENCES inspection_sessions(id),
  alert_type TEXT NOT NULL CHECK(alert_type IN ('warning', 'critical')),
  temperature REAL NOT NULL,
  coach_id TEXT NOT NULL,
  train_id TEXT NOT NULL,
  is_acknowledged INTEGER NOT NULL DEFAULT 0,
  acknowledged_by TEXT REFERENCES users(id),
  acknowledged_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- KPI targets table
CREATE TABLE IF NOT EXISTS kpi_targets (
  id TEXT PRIMARY KEY,
  inspector_id TEXT NOT NULL REFERENCES users(id),
  target_inspections_per_day INTEGER NOT NULL DEFAULT 3,
  deadline_hour INTEGER NOT NULL DEFAULT 17,
  effective_from TEXT NOT NULL,
  created_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- KPI records table
CREATE TABLE IF NOT EXISTS kpi_records (
  id TEXT PRIMARY KEY,
  inspector_id TEXT NOT NULL REFERENCES users(id),
  date TEXT NOT NULL,
  inspections_done INTEGER NOT NULL DEFAULT 0,
  on_time_count INTEGER NOT NULL DEFAULT 0,
  violations_found INTEGER NOT NULL DEFAULT 0,
  compliance_rate REAL NOT NULL DEFAULT 100.0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(inspector_id, date)
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_by TEXT REFERENCES users(id),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  type TEXT NOT NULL CHECK(type IN ('alert', 'reminder', 'info', 'kpi')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_thermal_readings_session ON thermal_readings(session_id);
CREATE INDEX IF NOT EXISTS idx_thermal_readings_zone ON thermal_readings(zone_id);
CREATE INDEX IF NOT EXISTS idx_inspection_sessions_inspector ON inspection_sessions(inspector_id);
CREATE INDEX IF NOT EXISTS idx_inspection_sessions_date ON inspection_sessions(inspection_date);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_train ON alerts(train_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
