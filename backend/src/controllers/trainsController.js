const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');
const xlsx = require('xlsx');

// ─── TRAINS ─────────────────────────────────────────────────────────────────
exports.getAllTrains = async (req, res, next) => {
  try {
    const db = getDb();
    const { division, search, created_by } = req.query;
    let q = `SELECT t.*, COUNT(DISTINCT c.id) as coach_count FROM trains t LEFT JOIN coaches c ON c.train_id = t.id WHERE t.is_active = 1`;
    const params = [];
    if (division) { q += ' AND t.division = ?'; params.push(division); }
    if (created_by) { q += ' AND t.created_by = ?'; params.push(created_by); }
    if (search) { q += ' AND (t.train_name LIKE ? OR t.train_number LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    q += ' GROUP BY t.id ORDER BY t.train_number';
    const data = await db.prepare(q).all(...params);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getTrainById = async (req, res, next) => {
  try {
    const db = getDb();
    const train = await db.prepare('SELECT * FROM trains WHERE id = ?').get(req.params.id);
    if (!train) return res.status(404).json({ success: false, message: 'Train not found' });
    const coaches = await db.prepare('SELECT c.*, COUNT(z.id) as zone_count FROM coaches c LEFT JOIN zones z ON z.coach_id = c.id WHERE c.train_id = ? GROUP BY c.id ORDER BY c.sequence_order').all(req.params.id);
    res.json({ success: true, data: { ...train, coaches } });
  } catch (err) { next(err); }
};

exports.createTrain = async (req, res, next) => {
  try {
    const { train_number, train_name, route, division, frequency, custom_safe_max, custom_warning_max, custom_critical_max } = req.body;
    if (!train_number || !train_name || !route || !division) return res.status(400).json({ success: false, message: 'Rake number, type, route, and division are required' });

    const db = getDb();
    const id = uuidv4(); const now = Math.floor(Date.now() / 1000);
    await db.prepare(`INSERT INTO trains (id, train_number, train_name, route, division, frequency, custom_safe_max, custom_warning_max, custom_critical_max, created_by, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`)
      .run(id, train_number, train_name, route, division, frequency || 'Daily', custom_safe_max || 60.0, custom_warning_max || 70.0, custom_critical_max || 85.0, req.user.id, now, now);
    
    // Auto-populate default coaches & zones based on Rake Type (train_name)
    const insertCoach = db.prepare('INSERT INTO coaches (id, train_id, coach_number, coach_type, sequence_order, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)');
    const insertZone = db.prepare('INSERT INTO zones (id, coach_id, zone_name, zone_type, normal_min, normal_max, warning_threshold, critical_threshold, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)');

    const rakeType = train_name.toUpperCase();
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
    } else { // LHB or default
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
      await insertCoach.run(coachId, id, c.name, c.type, idx + 1, now);
      
      // Determine default zones for the coach
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
      } else if (c.type === 'Loco' || c.name.includes('Power-Car')) {
        zones = [
          { name: 'Alternator Unit', type: 'Alternator' },
          { name: 'Diesel Engine', type: 'Engine' }
        ];
      } else if (c.type.startsWith('AC')) {
        zones = [
          { name: 'Switchboard Cabinet', type: 'Electrical' },
          { name: 'Battery Box', type: 'Battery' },
          { name: 'Axle Box Left', type: 'Axle Box' },
          { name: 'Axle Box Right', type: 'Axle Box' }
        ];
      } else {
        zones = [
          { name: 'Switchboard Panel', type: 'Electrical' },
          { name: 'Axle Box Left', type: 'Axle Box' },
          { name: 'Axle Box Right', type: 'Axle Box' }
        ];
      }

      for (const z of zones) {
        await insertZone.run(uuidv4(), coachId, z.name, z.type, 20.0, 60.0, 70.0, 85.0, now);
      }
    }

    res.status(201).json({ success: true, data: { id, train_number, train_name, route, division, frequency } });
  } catch (err) { next(err); }
};

exports.updateTrain = async (req, res, next) => {
  try {
    const { train_name, route, division, frequency, is_active } = req.body;
    const db = getDb();
    const train = await db.prepare('SELECT * FROM trains WHERE id = ?').get(req.params.id);
    if (!train) return res.status(404).json({ success: false, message: 'Train not found' });
    const now = Math.floor(Date.now() / 1000);
    await db.prepare('UPDATE trains SET train_name=?, route=?, division=?, frequency=?, is_active=?, updated_at=? WHERE id=?')
      .run(train_name || train.train_name, route || train.route, division || train.division, frequency || train.frequency, is_active !== undefined ? (is_active ? 1 : 0) : train.is_active, now, req.params.id);
    res.json({ success: true, message: 'Train updated' });
  } catch (err) { next(err); }
};

exports.deleteTrain = async (req, res, next) => {
  try {
    const db = getDb();
    await db.prepare('UPDATE trains SET is_active = 0, updated_at = ? WHERE id = ?').run(Math.floor(Date.now() / 1000), req.params.id);
    res.json({ success: true, message: 'Train deactivated' });
  } catch (err) { next(err); }
};

// ─── COACHES ─────────────────────────────────────────────────────────────────
exports.getCoachesByTrain = async (req, res, next) => {
  try {
    const db = getDb();
    const coaches = await db.prepare('SELECT c.*, COUNT(z.id) as zone_count FROM coaches c LEFT JOIN zones z ON z.coach_id = c.id WHERE c.train_id = ? GROUP BY c.id ORDER BY c.sequence_order').all(req.params.trainId);
    res.json({ success: true, data: coaches });
  } catch (err) { next(err); }
};

exports.createCoach = async (req, res, next) => {
  try {
    const { train_id, coach_number, coach_type, sequence_order } = req.body;
    if (!train_id || !coach_number || !coach_type) return res.status(400).json({ success: false, message: 'train_id, coach_number, coach_type required' });
    const db = getDb();
    const id = uuidv4(); const now = Math.floor(Date.now() / 1000);
    await db.prepare('INSERT INTO coaches (id, train_id, coach_number, coach_type, sequence_order, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)').run(id, train_id, coach_number, coach_type, sequence_order || 1, now);
    res.status(201).json({ success: true, data: { id, train_id, coach_number, coach_type } });
  } catch (err) { next(err); }
};

exports.updateCoach = async (req, res, next) => {
  try {
    const { coach_number, coach_type, sequence_order, is_active } = req.body;
    const db = getDb();
    const coach = await db.prepare('SELECT * FROM coaches WHERE id = ?').get(req.params.id);
    if (!coach) return res.status(404).json({ success: false, message: 'Coach not found' });
    await db.prepare('UPDATE coaches SET coach_number=?, coach_type=?, sequence_order=?, is_active=? WHERE id=?')
      .run(coach_number || coach.coach_number, coach_type || coach.coach_type, sequence_order || coach.sequence_order, is_active !== undefined ? (is_active ? 1 : 0) : coach.is_active, req.params.id);
    res.json({ success: true, message: 'Coach updated' });
  } catch (err) { next(err); }
};

// ─── ZONES ───────────────────────────────────────────────────────────────────
exports.getZonesByCoach = async (req, res, next) => {
  try {
    const db = getDb();
    const zones = await db.prepare('SELECT * FROM zones WHERE coach_id = ? ORDER BY zone_name').all(req.params.coachId);
    res.json({ success: true, data: zones });
  } catch (err) { next(err); }
};

exports.createZone = async (req, res, next) => {
  try {
    const { coach_id, zone_name, zone_type, normal_min, normal_max, warning_threshold, critical_threshold } = req.body;
    if (!coach_id || !zone_name || !zone_type) return res.status(400).json({ success: false, message: 'coach_id, zone_name, zone_type required' });
    const db = getDb();
    const id = uuidv4(); const now = Math.floor(Date.now() / 1000);
    await db.prepare('INSERT INTO zones (id, coach_id, zone_name, zone_type, normal_min, normal_max, warning_threshold, critical_threshold, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)')
      .run(id, coach_id, zone_name, zone_type, normal_min || 20, normal_max || 60, warning_threshold || 70, critical_threshold || 85, now);
    res.status(201).json({ success: true, data: { id, coach_id, zone_name, zone_type } });
  } catch (err) { next(err); }
};

exports.updateZone = async (req, res, next) => {
  try {
    const { zone_name, zone_type, normal_min, normal_max, warning_threshold, critical_threshold, is_active } = req.body;
    const db = getDb();
    const zone = await db.prepare('SELECT * FROM zones WHERE id = ?').get(req.params.id);
    if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });
    await db.prepare('UPDATE zones SET zone_name=?, zone_type=?, normal_min=?, normal_max=?, warning_threshold=?, critical_threshold=?, is_active=? WHERE id=?')
      .run(zone_name || zone.zone_name, zone_type || zone.zone_type, normal_min ?? zone.normal_min, normal_max ?? zone.normal_max, warning_threshold ?? zone.warning_threshold, critical_threshold ?? zone.critical_threshold, is_active !== undefined ? (is_active ? 1 : 0) : zone.is_active, req.params.id);
    res.json({ success: true, message: 'Zone updated' });
  } catch (err) { next(err); }
};

exports.deleteZone = async (req, res, next) => {
  try {
    const db = getDb();
    await db.prepare('UPDATE zones SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Zone deactivated' });
  } catch (err) { next(err); }
};

// ─── BULK IMPORT ─────────────────────────────────────────────────────────────
exports.bulkImport = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Excel file required' });
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);
    let created = 0, skipped = 0;
    for (const row of rows) {
      try {
        const existing = await db.prepare('SELECT id FROM trains WHERE train_number = ?').get(String(row.train_number));
        if (!existing) {
          await db.prepare('INSERT INTO trains (id, train_number, train_name, route, division, frequency, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)')
            .run(uuidv4(), String(row.train_number), row.train_name, row.route, row.division || 'Mumbai', row.frequency || 'Daily', now, now);
          created++;
        } else { skipped++; }
      } catch (_) { skipped++; }
    }
    const fs = require('fs');
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.json({ success: true, message: `Imported ${created} trains, skipped ${skipped}` });
  } catch (err) { next(err); }
};
