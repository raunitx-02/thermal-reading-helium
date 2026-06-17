const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');exports.getAll = (req, res, next) => {
  try {
    const db = getDb();
    const { role, division, search, parent_id } = req.query;
    let query = `SELECT id, name, email, role, division, state, city, phone, employee_id, zone, parent_id, is_active, last_login, created_at FROM users WHERE 1=1`;
    const params = [];
    if (role) { query += ' AND role = ?'; params.push(role); }
    if (division) { query += ' AND division = ?'; params.push(division); }
    if (parent_id) { 
      query += ` AND (
        parent_id = ? 
        OR (parent_id IN (SELECT id FROM users WHERE parent_id = ?) AND (SELECT role FROM users WHERE id = ?) = 'branch_admin')
        OR (parent_id = (SELECT parent_id FROM users WHERE id = ?) AND (SELECT role FROM users WHERE id = ?) = 'supervisor')
        OR (parent_id IN (SELECT id FROM users WHERE parent_id = (SELECT parent_id FROM users WHERE id = ?)) AND (SELECT role FROM users WHERE id = ?) = 'supervisor')
      )`; 
      params.push(parent_id, parent_id, parent_id, parent_id, parent_id, parent_id, parent_id); 
    }
    if (search) { query += ' AND (name LIKE ? OR email LIKE ? OR employee_id LIKE ? OR division LIKE ? OR zone LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`); }
    query += ' ORDER BY created_at DESC';
    res.json({ success: true, data: db.prepare(query).all(...params) });
  } catch (err) { next(err); }
};

exports.getById = (req, res, next) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT id, name, email, role, division, state, city, phone, employee_id, zone, parent_id, is_active, last_login, created_at FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, email, password, role, division, phone, employee_id, zone, state, city, parent_id } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ success: false, message: 'name, email, password, role required' });
    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered' });
    const hash = await bcrypt.hash(password, 12);
    const id = uuidv4();
    const now = Math.floor(Date.now() / 1000);
    db.prepare(`INSERT INTO users (id, name, email, password_hash, role, division, state, city, phone, employee_id, zone, parent_id, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`)
      .run(id, name, email.toLowerCase().trim(), hash, role, division || 'Mumbai', state || null, city || null, phone || null, employee_id || null, zone || null, parent_id || null, now, now);
    res.status(201).json({ success: true, data: { id, name, email, role, division, state, city, phone, employee_id, zone, parent_id } });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { name, email, password, role, division, state, city, phone, employee_id, zone, is_active } = req.body;
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const now = Math.floor(Date.now() / 1000);
    let hash = user.password_hash;
    if (password) hash = await bcrypt.hash(password, 12);
    db.prepare(`UPDATE users SET name=?, email=?, password_hash=?, role=?, division=?, state=?, city=?, phone=?, employee_id=?, zone=?, is_active=?, updated_at=? WHERE id=?`)
      .run(name || user.name, email?.toLowerCase().trim() || user.email, hash, role || user.role, division || user.division, state !== undefined ? state : user.state, city !== undefined ? city : user.city, phone ?? user.phone, employee_id ?? user.employee_id, zone ?? user.zone, is_active !== undefined ? (is_active ? 1 : 0) : user.is_active, now, req.params.id);
    res.json({ success: true, message: 'User updated' });
  } catch (err) { next(err); }
};
exports.deactivate = (req, res, next) => {
  try {
    const db = getDb();
    db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(req.params.id);
    db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(req.params.id);
    res.json({ success: true, message: 'User deactivated' });
  } catch (err) { next(err); }
};

exports.toggleActive = (req, res, next) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT is_active FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    const newStatus = user.is_active === 1 ? 0 : 1;
    db.prepare('UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?').run(newStatus, Math.floor(Date.now() / 1000), req.params.id);
    
    if (newStatus === 0) {
      db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(req.params.id);
    }
    
    res.json({ success: true, message: `User ${newStatus === 1 ? 'activated' : 'deactivated'} successfully` });
  } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(400).json({ success: false, message: 'Current password incorrect' });
    const hash = await bcrypt.hash(newPassword, 12);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(hash, Math.floor(Date.now() / 1000), req.user.id);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) { next(err); }
};
