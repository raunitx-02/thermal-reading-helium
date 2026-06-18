require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runSeed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Starting PostgreSQL Seeding...');

    // 1. Apply Schema
    const schemaPath = path.join(__dirname, 'postgres_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    console.log('⏳ Applying database schema and functions...');
    await client.query(schema);
    console.log('✅ Schema applied successfully');

    // 2. Clean Existing Tables
    console.log('⏳ Cleaning existing tables...');
    await client.query(`
      TRUNCATE TABLE 
        refresh_tokens, 
        notifications, 
        system_settings, 
        audit_logs, 
        kpi_records, 
        kpi_targets, 
        alerts, 
        thermal_readings, 
        inspection_sessions, 
        zones, 
        coaches, 
        trains, 
        users 
      CASCADE;
    `);
    console.log('✅ Existing tables cleaned');

    const now = Math.floor(Date.now() / 1000);

    // 3. System Settings
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

    console.log('⏳ Seeding System Settings...');
    for (const [key, value, desc] of settings) {
      await client.query(
        `INSERT INTO system_settings (key, value, description, updated_at) VALUES ($1, $2, $3, $4) ON CONFLICT (key) DO NOTHING`,
        [key, value, desc, now]
      );
    }
    console.log('✅ System Settings seeded');

    // 4. Users
    const passwordHash = bcrypt.hashSync('Admin@123', 12);
    const branchHash = bcrypt.hashSync('Branch@123', 12);
    const supervisorHash = bcrypt.hashSync('Supervisor@123', 12);
    const inspectorHash = bcrypt.hashSync('Inspector@123', 12);

    const superAdminId = uuidv4();
    const branchAdminId = uuidv4();
    const supervisorId = uuidv4();
    const groundEngineerId = uuidv4();
    const groundEngineer2Id = uuidv4();

    const users = [
      { id: superAdminId, name: 'Rajesh Kumar Sharma', email: 'admin@thermalportal.in', password_hash: passwordHash, role: 'super_admin', division: 'Mumbai', state: null, city: null, phone: '9876543210', employee_id: 'WR-ADM-001', zone: 'Western Railway - Mumbai', parent_id: null },
      { id: branchAdminId, name: 'Anil Mehta', email: 'anil.mehta@thermalportal.in', password_hash: branchHash, role: 'branch_admin', division: 'Mumbai', state: 'Maharashtra', city: 'Mumbai City', phone: '9876543211', employee_id: 'WR-BRN-001', zone: 'Western Railway - Mumbai', parent_id: superAdminId },
      { id: supervisorId, name: 'Priya Nair', email: 'priya.nair@thermalportal.in', password_hash: supervisorHash, role: 'supervisor', division: 'Mumbai', state: 'Maharashtra', city: 'Mumbai City', phone: '9876543215', employee_id: 'WR-SUP-001', zone: 'Western Railway - Mumbai', parent_id: branchAdminId },
      { id: groundEngineerId, name: 'Suresh Patil', email: 'suresh.patil@thermalportal.in', password_hash: inspectorHash, role: 'ground_engineer', division: 'Mumbai', state: 'Maharashtra', city: 'Mumbai City', phone: '9876543212', employee_id: 'WR-ENG-001', zone: 'Western Railway - Mumbai', parent_id: supervisorId },
      { id: groundEngineer2Id, name: 'Vijay Deshmukh', email: 'vijay.deshmukh@thermalportal.in', password_hash: inspectorHash, role: 'ground_engineer', division: 'Mumbai', state: 'Maharashtra', city: 'Mumbai City', phone: '9876543214', employee_id: 'WR-ENG-002', zone: 'Western Railway - Mumbai', parent_id: supervisorId }
    ];

    console.log('⏳ Seeding Users...');
    for (const u of users) {
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, role, division, state, city, phone, employee_id, zone, parent_id, is_active, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 1, $13, $14) ON CONFLICT (email) DO NOTHING`,
        [u.id, u.name, u.email, u.password_hash, u.role, u.division, u.state, u.city, u.phone, u.employee_id, u.zone, u.parent_id, now, now]
      );
    }
    console.log('✅ Users seeded successfully');

    // 5. Trains
    const trainData = [
      { number: '218113 / 208272 / 218114', name: 'MEMU', route: 'Mumbai City Branch', division: 'Mumbai', frequency: 'Daily' },
      { number: '199123 / 199124', name: 'DEMU', route: 'Mumbai City Branch', division: 'Mumbai', frequency: 'Daily' },
      { number: '210344 / 210345', name: 'LHB', route: 'Mumbai City Branch', division: 'Mumbai', frequency: 'Daily' },
    ];

    console.log('⏳ Seeding Trains, Coaches, and Zones...');
    for (const t of trainData) {
      const trainId = uuidv4();
      await client.query(
        `INSERT INTO trains (id, train_number, train_name, route, division, frequency, is_active, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, 1, $7, $8)`,
        [trainId, t.number, t.name, t.route, t.division, t.frequency, now, now]
      );

      // Coaches & Zones Preset Setup
      let coachList = [];
      if (t.name === 'MEMU') {
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
      } else if (t.name === 'DEMU') {
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

      for (let idx = 0; idx < coachList.length; idx++) {
        const c = coachList[idx];
        const coachId = uuidv4();
        await client.query(
          `INSERT INTO coaches (id, train_id, coach_number, coach_type, sequence_order, is_active, created_at) 
           VALUES ($1, $2, $3, $4, $5, 1, $6)`,
          [coachId, trainId, c.name, c.type, idx + 1, now]
        );

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

        for (const z of zones) {
          const zoneId = uuidv4();
          await client.query(
            `INSERT INTO zones (id, coach_id, zone_name, zone_type, normal_min, normal_max, warning_threshold, critical_threshold, is_active, created_at) 
             VALUES ($1, $2, $3, $4, 20.0, 60.0, 70.0, 85.0, 1, $5)`,
            [zoneId, coachId, z.name, z.type, now]
          );
        }
      }
    }
    console.log('✅ Trains, Coaches, and Zones successfully seeded!');
    console.log('🌱 Seeding process complete!');
  } catch (err) {
    console.error('❌ Error during seeding:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();
