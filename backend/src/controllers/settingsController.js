const { getDb } = require('../config/database');

exports.getSettings = (req, res, next) => {
  try {
    const db = getDb();
    const settings = db.prepare('SELECT key, value, description FROM system_settings').all();
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};

exports.updateSettings = (req, res, next) => {
  try {
    const { settings } = req.body; // array of {key, value}
    if (!settings || !Array.isArray(settings)) {
      return res.status(400).json({ success: false, message: 'Settings array required' });
    }
    
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);
    
    const updateStmt = db.prepare(`
      UPDATE system_settings 
      SET value = ?, updated_by = ?, updated_at = ?
      WHERE key = ?
    `);

    try {
      db.exec('BEGIN TRANSACTION');
      for (const item of settings) {
        updateStmt.run(String(item.value), req.user.id, now, item.key);
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    
    // Log to Audit Log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, details, ip_address, created_at)
      VALUES (?, ?, 'UPDATE_SETTINGS', 'settings', ?, ?, ?)
    `).run(
      require('uuid').v4(),
      req.user.id,
      JSON.stringify(settings.map(s => s.key)),
      req.ip,
      now
    );
    
    res.json({ success: true, message: 'System settings updated successfully' });
  } catch (err) { next(err); }
};
