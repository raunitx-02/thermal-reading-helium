require('dotenv').config();
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || './database/thermal.db';
const db = new DatabaseSync(DB_PATH);

// Apply schema
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

console.log('🌱 Seeding database...');

// Helper
const now = Math.floor(Date.now() / 1000);
const today = new Date().toISOString().split('T')[0];

// ─── 1. SYSTEM SETTINGS ────────────────────────────────────────────────────
const settings = [
  ['app_name', 'Bogie Thermal Inspection Portal', 'Application name'],
  ['default_warning_threshold', '70', 'Default warning temperature threshold (°C)'],
  ['default_critical_threshold', '85', 'Default critical temperature threshold (°C)'],
  ['default_normal_min', '20', 'Default minimum normal temperature (°C)'],
  ['default_normal_max', '60', 'Default maximum normal temperature (°C)'],
  ['email_alerts_enabled', 'true', 'Send email alerts on threshold breach'],
  ['whatsapp_alerts_enabled', 'false', 'Send WhatsApp alerts on threshold breach'],
  ['inspector_reminder_enabled', 'true', 'Send daily reminder emails to inspectors'],
  ['reminder_hour', '8', 'Hour to send daily reminder (24h format)'],
  ['working_days', 'Mon,Tue,Wed,Thu,Fri,Sat', 'Working days'],
  ['division_name', 'Mumbai Division', 'Railway division name'],
  ['org_name', 'Indian Railways - Western Railway', 'Organization name'],
  ['idle_timeout_minutes', '30', 'Auto-logout after inactivity (minutes)'],
];

const insertSetting = db.prepare(`INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES (?, ?, ?, ?)`);
settings.forEach(([key, value, desc]) => insertSetting.run(key, value, desc, now));
console.log('✅ Settings seeded');

// ─── 2. USERS ───────────────────────────────────────────────────────────────
const passwordHash = bcrypt.hashSync('Admin@123', 12);
const inspectorHash = bcrypt.hashSync('Inspector@123', 12);

const users = [
  { id: uuidv4(), name: 'Rajesh Kumar Sharma', email: 'admin@thermalportal.in', password_hash: passwordHash, role: 'admin', division: 'Mumbai', phone: '9876543210', employee_id: 'WR-ADM-001' },
  { id: uuidv4(), name: 'Anil Mehta', email: 'anil.mehta@thermalportal.in', password_hash: passwordHash, role: 'admin', division: 'Mumbai', phone: '9876543211', employee_id: 'WR-ADM-002' },
  { id: uuidv4(), name: 'Suresh Patil', email: 'suresh.patil@thermalportal.in', password_hash: inspectorHash, role: 'inspector', division: 'Mumbai', phone: '9876543212', employee_id: 'WR-INS-001' },
  { id: uuidv4(), name: 'Ramesh Gupta', email: 'ramesh.gupta@thermalportal.in', password_hash: inspectorHash, role: 'inspector', division: 'Pune', phone: '9876543213', employee_id: 'WR-INS-002' },
  { id: uuidv4(), name: 'Vijay Deshmukh', email: 'vijay.deshmukh@thermalportal.in', password_hash: inspectorHash, role: 'inspector', division: 'Nagpur', phone: '9876543214', employee_id: 'WR-INS-003' },
  { id: uuidv4(), name: 'Priya Nair', email: 'priya.nair@thermalportal.in', password_hash: inspectorHash, role: 'inspector', division: 'Mumbai', phone: '9876543215', employee_id: 'WR-INS-004' },
  { id: uuidv4(), name: 'Deepak Singh', email: 'deepak.singh@thermalportal.in', password_hash: inspectorHash, role: 'inspector', division: 'Surat', phone: '9876543216', employee_id: 'WR-INS-005' },
];

const insertUser = db.prepare(`INSERT OR IGNORE INTO users (id, name, email, password_hash, role, division, phone, employee_id, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`);
users.forEach(u => insertUser.run(u.id, u.name, u.email, u.password_hash, u.role, u.division, u.phone, u.employee_id, now, now));
console.log('✅ Users seeded (admin: admin@thermalportal.in / Admin@123, inspector: suresh.patil@thermalportal.in / Inspector@123)');

// ─── 3. TRAINS (Real Indian Railway trains) ─────────────────────────────────
const trainData = [
  { number: '12951', name: 'Mumbai Rajdhani Express', route: 'Mumbai Central → New Delhi', division: 'Mumbai', frequency: 'Daily' },
  { number: '12009', name: 'Shatabdi Express', route: 'Mumbai Central → Ahmedabad', division: 'Mumbai', frequency: 'Daily' },
  { number: '12031', name: 'Shatabdi Express', route: 'Mumbai Central → Pune', division: 'Mumbai', frequency: 'Daily' },
  { number: '11401', name: 'Nandigram Express', route: 'Gondia → Mumbai CSMT', division: 'Mumbai', frequency: 'Daily' },
  { number: '12137', name: 'Punjab Mail', route: 'Mumbai CST → Firozpur Cantonment', division: 'Mumbai', frequency: 'Daily' },
  { number: '22221', name: 'CSMT Rajdhani Express', route: 'Mumbai CSMT → New Delhi', division: 'Mumbai', frequency: 'Daily' },
  { number: '12263', name: 'Pune Duronto Express', route: 'Pune → New Delhi', division: 'Pune', frequency: 'Mon,Wed,Fri' },
  { number: '11013', name: 'Coimbatore Express', route: 'Mumbai LTT → Coimbatore', division: 'Mumbai', frequency: 'Daily' },
];

const trains = [];
const insertTrain = db.prepare(`INSERT OR IGNORE INTO trains (id, train_number, train_name, route, division, frequency, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`);
trainData.forEach(t => {
  const id = uuidv4();
  trains.push({ id, ...t });
  insertTrain.run(id, t.number, t.name, t.route, t.division, t.frequency, now, now);
});
console.log('✅ Trains seeded');

// ─── 4. COACHES + ZONES ─────────────────────────────────────────────────────
const coachTypes = {
  '12951': ['Loco', 'AC-1', 'AC-2', 'AC-2', 'AC-3', 'AC-3', 'AC-3', 'Pantry', 'SL', 'SL', 'GEN'],
  '12009': ['Loco', 'AC-2', 'AC-3', 'AC-3', 'AC-3', 'Pantry', 'SL', 'GEN'],
  '12031': ['Loco', 'AC-2', 'AC-3', 'AC-3', 'Pantry', 'SL'],
  '11401': ['Loco', 'SL', 'SL', 'SL', 'SL', 'GEN', 'GEN'],
  '12137': ['Loco', 'AC-1', 'AC-2', 'AC-3', 'AC-3', 'SL', 'SL', 'GEN'],
  '22221': ['Loco', 'AC-1', 'AC-2', 'AC-2', 'AC-3', 'AC-3', 'Pantry', 'SL', 'GEN'],
  '12263': ['Loco', 'AC-2', 'AC-3', 'AC-3', 'Pantry'],
  '11013': ['Loco', 'SL', 'SL', 'SL', 'GEN', 'GEN'],
};

const zonesByCoachType = {
  'Loco': [
    { name: 'Traction Motor - Front', type: 'Traction', min: 30, max: 80, warn: 90, crit: 110 },
    { name: 'Traction Motor - Rear', type: 'Traction', min: 30, max: 80, warn: 90, crit: 110 },
    { name: 'Main Control Panel', type: 'Electrical', min: 25, max: 65, warn: 75, crit: 90 },
    { name: 'Auxiliary Power Unit', type: 'Electrical', min: 25, max: 70, warn: 80, crit: 95 },
    { name: 'Bogie Axle Box - Left', type: 'Bogie', min: 20, max: 60, warn: 70, crit: 85 },
    { name: 'Bogie Axle Box - Right', type: 'Bogie', min: 20, max: 60, warn: 70, crit: 85 },
  ],
  'AC-1': [
    { name: 'AC Compressor Unit', type: 'HVAC', min: 20, max: 55, warn: 65, crit: 80 },
    { name: 'AC Condenser', type: 'HVAC', min: 30, max: 60, warn: 70, crit: 85 },
    { name: 'Lighting Panel', type: 'Electrical', min: 20, max: 50, warn: 60, crit: 75 },
    { name: 'Bogie Axle Box - Left', type: 'Bogie', min: 20, max: 60, warn: 70, crit: 85 },
    { name: 'Bogie Axle Box - Right', type: 'Bogie', min: 20, max: 60, warn: 70, crit: 85 },
    { name: 'Fan Motor', type: 'Electrical', min: 20, max: 55, warn: 65, crit: 80 },
    { name: 'Under-Floor Heater', type: 'Heating', min: 25, max: 65, warn: 75, crit: 90 },
  ],
  'AC-2': [
    { name: 'AC Compressor Unit', type: 'HVAC', min: 20, max: 55, warn: 65, crit: 80 },
    { name: 'AC Condenser', type: 'HVAC', min: 30, max: 60, warn: 70, crit: 85 },
    { name: 'Lighting Panel', type: 'Electrical', min: 20, max: 50, warn: 60, crit: 75 },
    { name: 'Bogie Axle Box - Left', type: 'Bogie', min: 20, max: 60, warn: 70, crit: 85 },
    { name: 'Bogie Axle Box - Right', type: 'Bogie', min: 20, max: 60, warn: 70, crit: 85 },
    { name: 'Fan Motor', type: 'Electrical', min: 20, max: 55, warn: 65, crit: 80 },
    { name: 'Control Panel', type: 'Electrical', min: 20, max: 55, warn: 65, crit: 80 },
  ],
  'AC-3': [
    { name: 'AC Compressor Unit', type: 'HVAC', min: 20, max: 55, warn: 65, crit: 80 },
    { name: 'AC Condenser', type: 'HVAC', min: 30, max: 60, warn: 70, crit: 85 },
    { name: 'Lighting Panel', type: 'Electrical', min: 20, max: 50, warn: 60, crit: 75 },
    { name: 'Bogie Axle Box - Left', type: 'Bogie', min: 20, max: 60, warn: 70, crit: 85 },
    { name: 'Bogie Axle Box - Right', type: 'Bogie', min: 20, max: 60, warn: 70, crit: 85 },
    { name: 'Fan Motor', type: 'Electrical', min: 20, max: 55, warn: 65, crit: 80 },
  ],
  'SL': [
    { name: 'Lighting Panel', type: 'Electrical', min: 20, max: 50, warn: 60, crit: 75 },
    { name: 'Fan Motor', type: 'Electrical', min: 20, max: 55, warn: 65, crit: 80 },
    { name: 'Bogie Axle Box - Left', type: 'Bogie', min: 20, max: 60, warn: 70, crit: 85 },
    { name: 'Bogie Axle Box - Right', type: 'Bogie', min: 20, max: 60, warn: 70, crit: 85 },
    { name: 'Brake System', type: 'Mechanical', min: 20, max: 60, warn: 70, crit: 85 },
  ],
  'GEN': [
    { name: 'Lighting Panel', type: 'Electrical', min: 20, max: 50, warn: 60, crit: 75 },
    { name: 'Bogie Axle Box - Left', type: 'Bogie', min: 20, max: 60, warn: 70, crit: 85 },
    { name: 'Bogie Axle Box - Right', type: 'Bogie', min: 20, max: 60, warn: 70, crit: 85 },
    { name: 'Brake System', type: 'Mechanical', min: 20, max: 60, warn: 70, crit: 85 },
  ],
  'Pantry': [
    { name: 'Refrigeration Unit', type: 'HVAC', min: 2, max: 8, warn: 12, crit: 18 },
    { name: 'Cooking Range Panel', type: 'Electrical', min: 20, max: 70, warn: 85, crit: 100 },
    { name: 'Lighting Panel', type: 'Electrical', min: 20, max: 50, warn: 60, crit: 75 },
    { name: 'Bogie Axle Box - Left', type: 'Bogie', min: 20, max: 60, warn: 70, crit: 85 },
    { name: 'Bogie Axle Box - Right', type: 'Bogie', min: 20, max: 60, warn: 70, crit: 85 },
  ],
};

const insertCoach = db.prepare(`INSERT OR IGNORE INTO coaches (id, train_id, coach_number, coach_type, sequence_order, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)`);
const insertZone = db.prepare(`INSERT OR IGNORE INTO zones (id, coach_id, zone_name, zone_type, normal_min, normal_max, warning_threshold, critical_threshold, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`);

const allCoaches = [];
const allZones = [];

trains.forEach(train => {
  const types = coachTypes[train.train_number] || ['Loco', 'SL', 'GEN'];
  types.forEach((type, idx) => {
    const coachId = uuidv4();
    const coachNum = `${type.replace('-', '')}-${String(idx + 1).padStart(2, '0')}`;
    insertCoach.run(coachId, train.id, coachNum, type, idx + 1, now);
    allCoaches.push({ id: coachId, train_id: train.id, coach_number: coachNum, coach_type: type });
    const zones = zonesByCoachType[type] || zonesByCoachType['GEN'];
    zones.forEach(z => {
      const zoneId = uuidv4();
      insertZone.run(zoneId, coachId, z.name, z.type, z.min, z.max, z.warn, z.crit, now);
      allZones.push({ id: zoneId, coach_id: coachId, zone_name: z.name, warning_threshold: z.warn, critical_threshold: z.crit, normal_min: z.min, normal_max: z.max });
    });
  });
});
console.log(`✅ Coaches & Zones seeded: ${allCoaches.length} coaches, ${allZones.length} zones`);

// ─── 5. KPI TARGETS ─────────────────────────────────────────────────────────
const inspectors = users.filter(u => u.role === 'inspector');
const insertKpi = db.prepare(`INSERT OR IGNORE INTO kpi_targets (id, inspector_id, target_inspections_per_day, deadline_hour, effective_from, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);
inspectors.forEach(ins => insertKpi.run(uuidv4(), ins.id, 3, 17, today, users[0].id, now));
console.log('✅ KPI targets seeded');

// ─── 6. HISTORICAL INSPECTION DATA (last 30 days) ───────────────────────────
const insertSession = db.prepare(`INSERT OR IGNORE INTO inspection_sessions (id, inspector_id, train_id, inspection_date, status, submitted_at, created_at, updated_at) VALUES (?, ?, ?, ?, 'submitted', ?, ?, ?)`);
const insertReading = db.prepare(`INSERT OR IGNORE INTO thermal_readings (id, session_id, zone_id, temperature, status, notes, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);
const insertAlert = db.prepare(`INSERT OR IGNORE INTO alerts (id, zone_id, reading_id, session_id, alert_type, temperature, coach_id, train_id, is_acknowledged, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const insertKpiRecord = db.prepare(`INSERT OR REPLACE INTO kpi_records (id, inspector_id, date, inspections_done, on_time_count, violations_found, compliance_rate, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

// Generate 30 days of data
for (let daysAgo = 30; daysAgo >= 1; daysAgo--) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const dateStr = date.toISOString().split('T')[0];
  const dayTs = Math.floor(date.getTime() / 1000);

  inspectors.forEach((inspector, iIdx) => {
    const numSessions = Math.floor(Math.random() * 2) + 2; // 2-3 sessions per day
    let violations = 0;

    for (let s = 0; s < numSessions; s++) {
      const train = trains[Math.floor(Math.random() * trains.length)];
      const sessionId = uuidv4();
      const sessionTs = dayTs + (s * 3600) + 28800; // start from 8am
      insertSession.run(sessionId, inspector.id, train.id, dateStr, sessionTs, sessionTs, sessionTs);

      // Get zones for this train
      const trainCoaches = allCoaches.filter(c => c.train_id === train.id);
      trainCoaches.slice(0, 3).forEach(coach => {
        const coachZones = allZones.filter(z => z.coach_id === coach.id);
        coachZones.forEach(zone => {
          const isAnomaly = Math.random() < 0.08; // 8% chance of anomaly
          let temp;
          let status = 'normal';
          if (isAnomaly) {
            const isCritical = Math.random() < 0.3;
            if (isCritical) {
              temp = zone.critical_threshold + (Math.random() * 10);
              status = 'critical';
            } else {
              temp = zone.warning_threshold + (Math.random() * (zone.critical_threshold - zone.warning_threshold));
              status = 'warning';
            }
            violations++;
          } else {
            temp = zone.normal_min + (Math.random() * (zone.normal_max - zone.normal_min));
          }
          temp = Math.round(temp * 10) / 10;
          const readingId = uuidv4();
          insertReading.run(readingId, sessionId, zone.id, temp, status, null, sessionTs);

          if (status !== 'normal') {
            const isAck = Math.random() < 0.7;
            insertAlert.run(uuidv4(), zone.id, readingId, sessionId, status, temp, coach.id, train.id, isAck ? 1 : 0, sessionTs);
          }
        });
      });
    }

    insertKpiRecord.run(uuidv4(), inspector.id, dateStr, numSessions, numSessions - (Math.random() < 0.1 ? 1 : 0), violations, Math.round((1 - violations / Math.max(1, numSessions * 10)) * 100 * 10) / 10, dayTs);
  });
}
console.log('✅ Historical inspection data seeded (30 days)');

// Close Database (in node:sqlite, close method doesn't exist; we just let it garbage collect or process exit)
console.log('\n🚀 Database seeded successfully!');
console.log('─────────────────────────────────────────');
console.log('Admin Login:     admin@thermalportal.in / Admin@123');
console.log('Inspector Login: suresh.patil@thermalportal.in / Inspector@123');
console.log('─────────────────────────────────────────');
process.exit(0);
