const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');

exports.create = (req, res, next) => {
  try {
    const { train_id, ground_engineer_id } = req.body;
    if (!train_id || !ground_engineer_id) {
      return res.status(400).json({ success: false, message: 'train_id and ground_engineer_id are required' });
    }
    const db = getDb();
    const id = uuidv4();
    const now = Math.floor(Date.now() / 1000);
    
    // Check if user exists and is a ground engineer
    const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(ground_engineer_id);
    if (!user || user.role !== 'ground_engineer') {
      return res.status(404).json({ success: false, message: 'Invalid Ground Engineer' });
    }

    db.prepare(`INSERT INTO assignments (id, train_id, ground_engineer_id, supervisor_id, status, assigned_at) VALUES (?, ?, ?, ?, 'assigned', ?)`)
      .run(id, train_id, ground_engineer_id, req.user.id, now);

    res.status(201).json({ success: true, data: { id, train_id, ground_engineer_id, status: 'assigned' } });
  } catch (err) { next(err); }
};

exports.getAll = (req, res, next) => {
  try {
    const db = getDb();
    const { ground_engineer_id, status } = req.query;
    
    let query = `
      SELECT a.*, 
             t.train_number, t.train_name, t.route,
             e.name as ground_engineer_name, 
             s.name as supervisor_name
      FROM assignments a
      JOIN trains t ON t.id = a.train_id
      JOIN users e ON e.id = a.ground_engineer_id
      LEFT JOIN users s ON s.id = a.supervisor_id
      WHERE 1=1
    `;
    const params = [];

    if (ground_engineer_id) {
      query += ' AND a.ground_engineer_id = ?';
      params.push(ground_engineer_id);
    }
    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    query += ' ORDER BY a.assigned_at DESC';

    const list = db.prepare(query).all(...params);
    res.json({ success: true, data: list });
  } catch (err) { next(err); }
};

exports.deleteAssignment = (req, res, next) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM assignments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Assignment deleted' });
  } catch (err) { next(err); }
};
