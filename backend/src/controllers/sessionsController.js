const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');
const emailService = require('../services/emailService');

exports.getSessions = (req, res, next) => {
  try {
    const db = getDb();
    const { inspector_id, train_id, status, date } = req.query;
    let query = `
      SELECT s.*, t.train_number, t.train_name, u.name as inspector_name,
             (SELECT COUNT(*) FROM thermal_readings WHERE session_id = s.id) as readings_count
      FROM inspection_sessions s
      JOIN trains t ON s.train_id = t.id
      JOIN users u ON s.inspector_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (inspector_id) { query += ' AND s.inspector_id = ?'; params.push(inspector_id); }
    if (train_id) { query += ' AND s.train_id = ?'; params.push(train_id); }
    if (status) { query += ' AND s.status = ?'; params.push(status); }
    if (date) { query += ' AND s.inspection_date = ?'; params.push(date); }
    query += ' ORDER BY s.created_at DESC';
    
    const sessions = db.prepare(query).all(...params);
    res.json({ success: true, data: sessions });
  } catch (err) { next(err); }
};

exports.getSessionById = (req, res, next) => {
  try {
    const db = getDb();
    const session = db.prepare(`
      SELECT s.*, t.train_number, t.train_name, t.route, u.name as inspector_name
      FROM inspection_sessions s
      JOIN trains t ON s.train_id = t.id
      JOIN users u ON s.inspector_id = u.id
      WHERE s.id = ?
    `).get(req.params.id);
    
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    
    const readings = db.prepare(`
      SELECT r.*, z.zone_name, z.zone_type, z.normal_min, z.normal_max, z.warning_threshold, z.critical_threshold,
             c.coach_number, c.coach_type, c.id as coach_id
      FROM thermal_readings r
      JOIN zones z ON r.zone_id = z.id
      JOIN coaches c ON z.coach_id = c.id
      WHERE r.session_id = ?
      ORDER BY c.sequence_order, z.zone_name
    `).all(req.params.id);
    
    res.json({ success: true, data: { ...session, readings } });
  } catch (err) { next(err); }
};

exports.createSession = (req, res, next) => {
  try {
    const { train_id, inspection_date } = req.body;
    if (!train_id || !inspection_date) return res.status(400).json({ success: false, message: 'train_id and inspection_date required' });
    
    const db = getDb();

    // Check Ground Engineer assignment
    if (req.user.role === 'ground_engineer') {
      const assigned = db.prepare('SELECT id FROM assignments WHERE train_id = ? AND ground_engineer_id = ? AND status = "assigned"').get(train_id, req.user.id);
      if (!assigned) {
        return res.status(403).json({ success: false, message: 'You are not assigned to inspect this train' });
      }
    }
    
    // Check if open session already exists for this train on this date by this inspector
    const existing = db.prepare(`
      SELECT id FROM inspection_sessions 
      WHERE train_id = ? AND inspection_date = ? AND inspector_id = ? AND status = 'draft'
    `).get(train_id, inspection_date, req.user.id);
    
    if (existing) {
      return res.json({ success: true, data: { id: existing.id }, message: 'Resumed existing session draft' });
    }
    
    const id = uuidv4();
    const now = Math.floor(Date.now() / 1000);
    
    db.prepare(`
      INSERT INTO inspection_sessions (id, inspector_id, train_id, inspection_date, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'draft', ?, ?)
    `).run(id, req.user.id, train_id, inspection_date, now, now);
    
    res.status(201).json({ success: true, data: { id, train_id, inspection_date, status: 'draft' } });
  } catch (err) { next(err); }
};

exports.saveReading = (req, res, next) => {
  try {
    const { session_id, zone_id, temperature, ambient_temperature, notes } = req.body;
    if (!session_id || !zone_id || temperature === undefined || ambient_temperature === undefined) {
      return res.status(400).json({ success: false, message: 'session_id, zone_id, temperature, and ambient_temperature required' });
    }
    
    const db = getDb();
    const session = db.prepare('SELECT status FROM inspection_sessions WHERE id = ?').get(session_id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.status === 'submitted') return res.status(400).json({ success: false, message: 'Cannot modify a submitted session' });
    
    const zone = db.prepare(`
      SELECT z.*, c.id as coach_id, c.coach_number, t.id as train_id, t.train_number
      FROM zones z
      JOIN coaches c ON z.coach_id = c.id
      JOIN trains t ON c.train_id = t.id
      WHERE z.id = ?
    `).get(zone_id);
    if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });
    
    const rise = parseFloat(temperature) - parseFloat(ambient_temperature);
    let status = 'normal';
    if (rise > 25.0) {
      status = 'critical';
    }
    
    const now = Math.floor(Date.now() / 1000);
    
    // Check if reading already exists
    const existing = db.prepare('SELECT id FROM thermal_readings WHERE session_id = ? AND zone_id = ?').get(session_id, zone_id);
    const readingId = existing ? existing.id : uuidv4();
    
    if (existing) {
      db.prepare(`
        UPDATE thermal_readings 
        SET temperature = ?, ambient_temperature = ?, status = ?, notes = ?, recorded_at = ?
        WHERE id = ?
      `).run(temperature, ambient_temperature, status, notes || null, now, readingId);
    } else {
      db.prepare(`
        INSERT INTO thermal_readings (id, session_id, zone_id, temperature, ambient_temperature, status, notes, recorded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(readingId, session_id, zone_id, temperature, ambient_temperature, status, notes || null, now);
    }
    
    // Update session timestamp
    db.prepare('UPDATE inspection_sessions SET updated_at = ? WHERE id = ?').run(now, session_id);
    
    // Handle Alert Generation (only insert alert if status is critical, and not already reported)
    if (status !== 'normal') {
      const existingAlert = db.prepare('SELECT id FROM alerts WHERE reading_id = ?').get(readingId);
      if (!existingAlert) {
        const alertId = uuidv4();
        db.prepare(`
          INSERT INTO alerts (id, zone_id, reading_id, session_id, alert_type, temperature, coach_id, train_id, is_acknowledged, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
        `).run(alertId, zone_id, readingId, session_id, status, temperature, zone.coach_id, zone.train_id, now);
        
        // Push in-app notification to all admins
        const admins = db.prepare("SELECT id FROM users WHERE role IN ('super_admin', 'branch_admin')").all();
        const msg = `Alert! ${zone.train_number} coach ${zone.coach_number} zone "${zone.zone_name}" recorded high temperature rise: ${rise.toFixed(1)}°C (Max: ${temperature}°C, Ambient: ${ambient_temperature}°C)`;
        admins.forEach(admin => {
          db.prepare(`
            INSERT INTO notifications (id, user_id, type, title, message, link, is_read, created_at)
            VALUES (?, ?, 'alert', ?, ?, ?, 0, ?)
          `).run(uuidv4(), admin.id, `Critical Temperature Rise Breach`, msg, `/admin/alerts`, now);
        });
        
        // Trigger Email Notification (Asynchronous)
        emailService.sendAlertEmail(zone, temperature, status).catch(console.error);
      }
    } else {
      // If it became normal, delete any existing unacknowledged alert
      db.prepare('DELETE FROM alerts WHERE reading_id = ? AND is_acknowledged = 0').run(readingId);
    }
    
    res.json({ success: true, data: { id: readingId, status, temperature, ambient_temperature } });
  } catch (err) { next(err); }
};

exports.submitSession = (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const db = getDb();
    
    const session = db.prepare('SELECT * FROM inspection_sessions WHERE id = ?').get(id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.status === 'submitted') return res.status(400).json({ success: false, message: 'Session already submitted' });
    
    const now = Math.floor(Date.now() / 1000);
    db.prepare(`
      UPDATE inspection_sessions 
      SET status = 'submitted', remarks = ?, submitted_at = ?, updated_at = ?
      WHERE id = ?
    `).run(remarks || null, now, now, id);

    // Update corresponding assignment
    db.prepare(`
      UPDATE assignments 
      SET status = 'completed', completed_at = ?
      WHERE train_id = ? AND ground_engineer_id = ? AND status = 'assigned'
    `).run(now, session.train_id, session.inspector_id);
    
    // Update KPI metrics for today
    const dateStr = session.inspection_date;
    const record = db.prepare('SELECT * FROM kpi_records WHERE inspector_id = ? AND date = ?').get(session.inspector_id, dateStr);
    
    // Count alerts/violations found in this session
    const violationsCount = db.prepare(`
      SELECT COUNT(*) as cnt FROM thermal_readings 
      WHERE session_id = ? AND status IN ('warning', 'critical')
    `).get(id).cnt;
    
    // Check if on-time
    const target = db.prepare(`
      SELECT deadline_hour FROM kpi_targets 
      WHERE inspector_id = ? AND effective_from <= ? 
      ORDER BY effective_from DESC LIMIT 1
    `).get(session.inspector_id, dateStr) || { deadline_hour: 17 };
    
    const submittedHour = new Date(now * 1000).getHours();
    const isOnTime = submittedHour < target.deadline_hour ? 1 : 0;
    
    if (record) {
      const newInspections = record.inspections_done + 1;
      const newOnTime = record.on_time_count + isOnTime;
      const newViolations = record.violations_found + violationsCount;
      const newCompliance = Math.round((newOnTime / newInspections) * 100 * 10) / 10;
      
      db.prepare(`
        UPDATE kpi_records 
        SET inspections_done = ?, on_time_count = ?, violations_found = ?, compliance_rate = ?
        WHERE id = ?
      `).run(newInspections, newOnTime, newViolations, newCompliance, record.id);
    } else {
      db.prepare(`
        INSERT INTO kpi_records (id, inspector_id, date, inspections_done, on_time_count, violations_found, compliance_rate, created_at)
        VALUES (?, ?, ?, 1, ?, ?, ?, ?)
      `).run(uuidv4(), session.inspector_id, dateStr, isOnTime, violationsCount, isOnTime ? 100.0 : 0.0, now);
    }
    
    res.json({ success: true, message: 'Inspection session submitted and locked' });
  } catch (err) { next(err); }
};
