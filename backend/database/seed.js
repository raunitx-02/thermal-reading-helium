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

// Clean existing data to ensure a fresh state
db.exec('PRAGMA foreign_keys = OFF');
db.exec('DELETE FROM assignments');
db.exec('DELETE FROM alerts');
db.exec('DELETE FROM thermal_readings');
db.exec('DELETE FROM inspection_sessions');
db.exec('DELETE FROM zones');
db.exec('DELETE FROM coaches');
db.exec('DELETE FROM trains');
db.exec('DELETE FROM kpi_targets');
db.exec('DELETE FROM kpi_records');
db.exec('DELETE FROM users');
db.exec('DELETE FROM system_settings');
db.exec('PRAGMA foreign_keys = ON');

// Helper
const now = Math.floor(Date.now() / 1000);
const today = new Date().toISOString().split('T')[0];

// ─── 1. SYSTEM SETTINGS ────────────────────────────────────────────────────
const settings = [
  ['app_name', 'Indian Railways', 'Application name'],
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
  ['org_name', 'Indian Railways', 'Organization name'],
  ['idle_timeout_minutes', '30', 'Auto-logout after inactivity (minutes)'],
];

const insertSetting = db.prepare(`INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES (?, ?, ?, ?)`);
settings.forEach(([key, value, desc]) => insertSetting.run(key, value, desc, now));
console.log('✅ Settings seeded');

// ─── 2. USERS ───────────────────────────────────────────────────────────────
const passwordHash = bcrypt.hashSync('Admin@123', 12);
const branchHash = bcrypt.hashSync('Branch@123', 12);
const supervisorHash = bcrypt.hashSync('Supervisor@123', 12);
const inspectorHash = bcrypt.hashSync('Inspector@123', 12);

const superAdminId = uuidv4();
const branchAdminId = uuidv4();
const supervisorId = uuidv4();
const groundEngineerId = uuidv4();

const users = [
  { id: superAdminId, name: 'Rajesh Kumar Sharma', email: 'admin@thermalportal.in', password_hash: passwordHash, role: 'super_admin', division: 'Mumbai', state: null, city: null, phone: '9876543210', employee_id: 'WR-ADM-001', zone: 'Western Railway - Mumbai', parent_id: null },
  { id: branchAdminId, name: 'Anil Mehta', email: 'anil.mehta@thermalportal.in', password_hash: branchHash, role: 'branch_admin', division: 'Mumbai', state: 'Maharashtra', city: 'Mumbai City', phone: '9876543211', employee_id: 'WR-BRN-001', zone: 'Western Railway - Mumbai', parent_id: superAdminId },
  { id: supervisorId, name: 'Priya Nair', email: 'priya.nair@thermalportal.in', password_hash: supervisorHash, role: 'supervisor', division: 'Mumbai', state: 'Maharashtra', city: 'Mumbai City', phone: '9876543215', employee_id: 'WR-SUP-001', zone: 'Western Railway - Mumbai', parent_id: branchAdminId },
  { id: groundEngineerId, name: 'Suresh Patil', email: 'suresh.patil@thermalportal.in', password_hash: inspectorHash, role: 'ground_engineer', division: 'Mumbai', state: 'Maharashtra', city: 'Mumbai City', phone: '9876543212', employee_id: 'WR-ENG-001', zone: 'Western Railway - Mumbai', parent_id: supervisorId },
  { id: uuidv4(), name: 'Vijay Deshmukh', email: 'vijay.deshmukh@thermalportal.in', password_hash: inspectorHash, role: 'ground_engineer', division: 'Mumbai', state: 'Maharashtra', city: 'Mumbai City', phone: '9876543214', employee_id: 'WR-ENG-002', zone: 'Western Railway - Mumbai', parent_id: supervisorId }
];

const insertUser = db.prepare(`INSERT OR IGNORE INTO users (id, name, email, password_hash, role, division, state, city, phone, employee_id, zone, parent_id, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`);
users.forEach(u => insertUser.run(u.id, u.name, u.email, u.password_hash, u.role, u.division, u.state, u.city, u.phone, u.employee_id, u.zone, u.parent_id, now, now));
console.log('✅ Users seeded:');
console.log('   - Super Admin: admin@thermalportal.in / Admin@123');
console.log('   - Branch Admin: anil.mehta@thermalportal.in / Branch@123 (Maharashtra, Mumbai City)');
console.log('   - Supervisor: priya.nair@thermalportal.in / Supervisor@123');
console.log('   - Ground Eng: suresh.patil@thermalportal.in / Inspector@123');

// ─── 3. RAKES ───────────────────────────────────────────────────────────────
const trainData = [
  { number: '218113 / 208272 / 218114', name: 'MEMU', route: 'Mumbai City Branch', division: 'Mumbai', frequency: 'Daily' },
  { number: '199123 / 199124', name: 'DEMU', route: 'Mumbai City Branch', division: 'Mumbai', frequency: 'Daily' },
  { number: '210344 / 210345', name: 'LHB', route: 'Mumbai City Branch', division: 'Mumbai', frequency: 'Daily' },
];

const trains = [];
const insertTrain = db.prepare(`INSERT OR IGNORE INTO trains (id, train_number, train_name, route, division, frequency, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`);
trainData.forEach(t => {
  const id = uuidv4();
  trains.push({ id, ...t });
  insertTrain.run(id, t.number, t.name, t.route, t.division, t.frequency, now, now);
});
console.log('✅ Rakes seeded');

// ─── 4. COACHES + ZONES (Preserving Rake Presets) ───────────────────────────
const insertCoach = db.prepare(`INSERT OR IGNORE INTO coaches (id, train_id, coach_number, coach_type, sequence_order, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)`);
const insertZone = db.prepare(`INSERT OR IGNORE INTO zones (id, coach_id, zone_name, zone_type, normal_min, normal_max, warning_threshold, critical_threshold, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`);

const allCoaches = [];
const allZones = [];

trains.forEach(train => {
  const rakeType = train.name.toUpperCase();
  let coachList = [];

  if (rakeType === 'MEMU') {
    coachList = [
      { name: 'DMC1', type: 'Loco' },
      { name: 'TC1', type: 'GEN' },
      { name: 'TC2', type: 'GEN' },
      { name: 'TC3', type: 'GEN' },
      { name: 'DMC2', type: 'Loco' },
      { name: 'TC4', type: 'GEN' },
      { name: 'TC5', type: 'GEN' },
      { name: 'TC6', type: 'GEN' },
      { name: 'TC7', type: 'GEN' },
      { name: 'TC8', type: 'GEN' },
      { name: 'TC9', type: 'GEN' },
      { name: 'DMC3', type: 'Loco' }
    ];
  } else if (rakeType === 'DEMU') {
    coachList = [
      { name: 'DPC1', type: 'Loco' },
      { name: 'TC1', type: 'GEN' },
      { name: 'TC2', type: 'GEN' },
      { name: 'TC3', type: 'GEN' },
      { name: 'TC4', type: 'GEN' },
      { name: 'TC5', type: 'GEN' },
      { name: 'TC6', type: 'GEN' },
      { name: 'TC7', type: 'GEN' },
      { name: 'TC8', type: 'GEN' },
      { name: 'TC9', type: 'GEN' },
      { name: 'TC10', type: 'GEN' },
      { name: 'DPC2', type: 'Loco' }
    ];
  } else {
    coachList = [
      { name: 'Power-Car1', type: 'Loco' },
      { name: 'AC-1', type: 'AC-1' },
      { name: 'AC-2', type: 'AC-2' },
      { name: 'AC-3', type: 'AC-3' },
      { name: 'Pantry', type: 'Pantry' },
      { name: 'SL1', type: 'SL' },
      { name: 'GEN1', type: 'GEN' },
      { name: 'Power-Car2', type: 'Loco' }
    ];
  }

  coachList.forEach((c, idx) => {
    const coachId = uuidv4();
    insertCoach.run(coachId, train.id, c.name, c.type, idx + 1, now);
    allCoaches.push({ id: coachId, train_id: train.id, coach_number: c.name, coach_type: c.type });
    
    let zones = [];
    if (c.name.startsWith('DMC')) {
      zones = [
        { name: 'CRW MCB Panel', type: 'Electrical' },
        { name: 'Contactor panel', type: 'Electrical' },
        { name: 'MCC', type: 'Electrical' },
        { name: 'Transformer Name Plate side', type: 'Transformer' },
        { name: 'TF Radiator side', type: 'Transformer' },
        { name: 'TF Terminal side1(Outer Side)', type: 'Transformer' },
        { name: 'TF Terminal side2(Inner Side)', type: 'Transformer' },
        { name: 'Women Compartment LHS Panel', type: 'Electrical' },
        { name: 'Women Compartment RHS Panel', type: 'Electrical' }
      ];
    } else if (c.name.startsWith('DPC')) {
      zones = [
        { name: 'Control Panel Upper', type: 'Electrical' },
        { name: 'Control Panel Lower', type: 'Electrical' },
        { name: 'Contactor panel', type: 'Electrical' },
        { name: 'Engine Room End Panel', type: 'Engine' },
        { name: 'Rectifier Terminal', type: 'Electrical' },
        { name: 'Auxiliary Power Converter', type: 'Electrical' },
        { name: 'Traction Converter Unit', type: 'Traction' },
        { name: 'Women Compartment LHS Panel', type: 'Electrical' },
        { name: 'Women Compartment RHS Panel', type: 'Electrical' }
      ];
    } else if (c.name.startsWith('TC')) {
      zones = [
        { name: 'AE Side', type: 'Axle Box' },
        { name: 'NAE Side', type: 'Axle Box' }
      ];
    } else {
      zones = [
        { name: 'Switchboard Panel', type: 'Electrical' },
        { name: 'Axle Box Left', type: 'Axle Box' },
        { name: 'Axle Box Right', type: 'Axle Box' }
      ];
    }

    zones.forEach(z => {
      const zoneId = uuidv4();
      insertZone.run(zoneId, coachId, z.name, z.type, 20.0, 60.0, 25.0, 25.0, now);
      allZones.push({ id: zoneId, coach_id: coachId, zone_name: z.name, warning_threshold: 25.0, critical_threshold: 25.0, normal_min: 20.0, normal_max: 60.0 });
    });
  });
});
console.log(`✅ Coaches & Zones seeded: ${allCoaches.length} coaches, ${allZones.length} zones`);

// ─── 5. KPI TARGETS ─────────────────────────────────────────────────────────
const inspectors = users.filter(u => u.role === 'ground_engineer');
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
