const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware('admin'));

router.get('/', async (req, res, next) => {
  try {
    const db = getDb();
    const { action, search } = req.query;
    
    let query = `
      SELECT al.*, u.name as user_name, u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (action) {
      query += ' AND al.action = ?';
      params.push(action);
    }
    if (search) {
      query += ' AND (u.name LIKE ? OR al.action LIKE ? OR al.details LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY al.created_at DESC LIMIT 200';
    
    const logs = await db.prepare(query).all(...params);
    res.json({ success: true, data: logs });
  } catch (err) { next(err); }
});

module.exports = router;
