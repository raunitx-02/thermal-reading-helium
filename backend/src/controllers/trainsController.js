const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');
const xlsx = require('xlsx');

// ─── TRAINS ─────────────────────────────────────────────────────────────────
exports.getAllTrains = (req, res, next) => {
  try {
    const db = getDb();
    const { division, search } = req.query;
    let q = `SELECT t.*, COUNT(DISTINCT c.id) as coach_count FROM trains t LEFT JOIN coaches c ON c.train_id = t.id WHERE 1=1`;
    const params = [];
    if (division) { q += ' AND t.division = ?'; params.push(division); }
    if (search) { q += ' AND (t.train_name LIKE ? OR t.train_number LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    q += ' GROUP BY t.id ORDER BY t.train_number';
    res.json({ success: true, data: db.prepare(q).all(...params) });
  } catch (err) { next(err); }
};

exports.getTrainById = (req, res, next) => {
  try {
    const db = getDb();
    const train = db.prepare('SELECT * FROM trains WHERE id = ?').get(req.params.id);
    if (!train) return res.status(404).json({ success: false, message: 'Train not found' });
    const coaches = db.prepare('SELECT c.*, COUNT(z.id) as zone_count FROM coaches c LEFT JOIN zones z ON z.coach_id = c.id WHERE c.train_id = ? GROUP BY c.id ORDER BY c.sequence_order').all(req.params.id);
    res.json({ success: true, data: { ...train, coaches } });
  } catch (err) { next(err); }
};

exports.createTrain = (req, res, next) => {
  try {
    const { train_number, train_name, route, division, frequency } = req.body;
    if (!train_number || !train_name || !route || !division) return res.status(400).json({ success: false, message: 'train_number, train_name, route, division required' });
    const db = getDb();
    const id = uuidv4(); const now = Math.floor(Date.now() / 1000);
    db.prepare(`INSERT INTO trains (id, train_number, train_name, route, division, frequency, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`)
      .run(id, train_number, train_name, route, division, frequency || 'Daily', now, now);
    res.status(201).json({ success: true, data: { id, train_number, train_name, route, division, frequency } });
  } catch (err) { next(err); }
};

exports.updateTrain = (req, res, next) => {
  try {
    const { train_name, route, division, frequency, is_active } = req.body;
    const db = getDb();
    const train = db.prepare('SELECT * FROM trains WHERE id = ?').get(req.params.id);
    if (!train) return res.status(404).json({ success: false, message: 'Train not found' });
    const now = Math.floor(Date.now() / 1000);
    db.prepare('UPDATE trains SET train_name=?, route=?, division=?, frequency=?, is_active=?, updated_at=? WHERE id=?')
      .run(train_name || train.train_name, route || train.route, division || train.division, frequency || train.frequency, is_active !== undefined ? (is_active ? 1 : 0) : train.is_active, now, req.params.id);
    res.json({ success: true, message: 'Train updated' });
  } catch (err) { next(err); }
};

exports.deleteTrain = (req, res, next) => {
  try {
    const db = getDb();
    db.prepare('UPDATE trains SET is_active = 0, updated_at = ? WHERE id = ?').run(Math.floor(Date.now() / 1000), req.params.id);
    res.json({ success: true, message: 'Train deactivated' });
  } catch (err) { next(err); }
};

// ─── COACHES ─────────────────────────────────────────────────────────────────
exports.getCoachesByTrain = (req, res, next) => {
  try {
    const db = getDb();
    const coaches = db.prepare('SELECT c.*, COUNT(z.id) as zone_count FROM coaches c LEFT JOIN zones z ON z.coach_id = c.id WHERE c.train_id = ? GROUP BY c.id ORDER BY c.sequence_order').all(req.params.trainId);
    res.json({ success: true, data: coaches });
  } catch (err) { next(err); }
};

exports.createCoach = (req, res, next) => {
  try {
    const { train_id, coach_number, coach_type, sequence_order } = req.body;
    if (!train_id || !coach_number || !coach_type) return res.status(400).json({ success: false, message: 'train_id, coach_number, coach_type required' });
    const db = getDb();
    const id = uuidv4(); const now = Math.floor(Date.now() / 1000);
    db.prepare('INSERT INTO coaches (id, train_id, coach_number, coach_type, sequence_order, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)').run(id, train_id, coach_number, coach_type, sequence_order || 1, now);
    res.status(201).json({ success: true, data: { id, train_id, coach_number, coach_type } });
  } catch (err) { next(err); }
};

exports.updateCoach = (req, res, next) => {
  try {
    const { coach_number, coach_type, sequence_order, is_active } = req.body;
    const db = getDb();
    const coach = db.prepare('SELECT * FROM coaches WHERE id = ?').get(req.params.id);
    if (!coach) return res.status(404).json({ success: false, message: 'Coach not found' });
    db.prepare('UPDATE coaches SET coach_number=?, coach_type=?, sequence_order=?, is_active=? WHERE id=?')
      .run(coach_number || coach.coach_number, coach_type || coach.coach_type, sequence_order || coach.sequence_order, is_active !== undefined ? (is_active ? 1 : 0) : coach.is_active, req.params.id);
    res.json({ success: true, message: 'Coach updated' });
  } catch (err) { next(err); }
};

// ─── ZONES ───────────────────────────────────────────────────────────────────
exports.getZonesByCoach = (req, res, next) => {
  try {
    const db = getDb();
    const zones = db.prepare('SELECT * FROM zones WHERE coach_id = ? ORDER BY zone_name').all(req.params.coachId);
    res.json({ success: true, data: zones });
  } catch (err) { next(err); }
};

exports.createZone = (req, res, next) => {
  try {
    const { coach_id, zone_name, zone_type, normal_min, normal_max, warning_threshold, critical_threshold } = req.body;
    if (!coach_id || !zone_name || !zone_type) return res.status(400).json({ success: false, message: 'coach_id, zone_name, zone_type required' });
    const db = getDb();
    const id = uuidv4(); const now = Math.floor(Date.now() / 1000);
    db.prepare('INSERT INTO zones (id, coach_id, zone_name, zone_type, normal_min, normal_max, warning_threshold, critical_threshold, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)')
      .run(id, coach_id, zone_name, zone_type, normal_min || 20, normal_max || 60, warning_threshold || 70, critical_threshold || 85, now);
    res.status(201).json({ success: true, data: { id, coach_id, zone_name, zone_type } });
  } catch (err) { next(err); }
};

exports.updateZone = (req, res, next) => {
  try {
    const { zone_name, zone_type, normal_min, normal_max, warning_threshold, critical_threshold, is_active } = req.body;
    const db = getDb();
    const zone = db.prepare('SELECT * FROM zones WHERE id = ?').get(req.params.id);
    if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });
    db.prepare('UPDATE zones SET zone_name=?, zone_type=?, normal_min=?, normal_max=?, warning_threshold=?, critical_threshold=?, is_active=? WHERE id=?')
      .run(zone_name || zone.zone_name, zone_type || zone.zone_type, normal_min ?? zone.normal_min, normal_max ?? zone.normal_max, warning_threshold ?? zone.warning_threshold, critical_threshold ?? zone.critical_threshold, is_active !== undefined ? (is_active ? 1 : 0) : zone.is_active, req.params.id);
    res.json({ success: true, message: 'Zone updated' });
  } catch (err) { next(err); }
};

exports.deleteZone = (req, res, next) => {
  try {
    const db = getDb();
    db.prepare('UPDATE zones SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Zone deactivated' });
  } catch (err) { next(err); }
};

// ─── BULK IMPORT ─────────────────────────────────────────────────────────────
exports.bulkImport = (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Excel file required' });
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);
    let created = 0, skipped = 0;
    rows.forEach(row => {
      try {
        const existing = db.prepare('SELECT id FROM trains WHERE train_number = ?').get(String(row.train_number));
        if (!existing) {
          db.prepare('INSERT INTO trains (id, train_number, train_name, route, division, frequency, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)')
            .run(uuidv4(), String(row.train_number), row.train_name, row.route, row.division || 'Mumbai', row.frequency || 'Daily', now, now);
          created++;
        } else { skipped++; }
      } catch (_) { skipped++; }
    });
    const fs = require('fs');
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.json({ success: true, message: `Imported ${created} trains, skipped ${skipped}` });
  } catch (err) { next(err); }
};
