const { getDb } = require('../config/database');

exports.getAlerts = (req, res, next) => {
  try {
    const db = getDb();
    const { is_acknowledged, alert_type, train_id } = req.query;
    
    let query = `
      SELECT a.*, 
             t.train_number, t.train_name,
             c.coach_number, c.coach_type,
             z.zone_name, z.zone_type,
             r.temperature, r.notes,
             u.name as acknowledged_by_name
      FROM alerts a
      JOIN zones z ON a.zone_id = z.id
      JOIN coaches c ON a.coach_id = c.id
      JOIN trains t ON a.train_id = t.id
      LEFT JOIN thermal_readings r ON a.reading_id = r.id
      LEFT JOIN users u ON a.acknowledged_by = u.id
      WHERE 1=1
    `;
    const params = [];
    if (is_acknowledged !== undefined) {
      query += ' AND a.is_acknowledged = ?';
      params.push(is_acknowledged === 'true' ? 1 : 0);
    }
    if (alert_type) {
      query += ' AND a.alert_type = ?';
      params.push(alert_type);
    }
    if (train_id) {
      query += ' AND a.train_id = ?';
      params.push(train_id);
    }
    query += ' ORDER BY a.created_at DESC';
    
    const alerts = db.prepare(query).all(...params);
    res.json({ success: true, data: alerts });
  } catch (err) { next(err); }
};

exports.acknowledgeAlert = (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDb();
    
    const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    if (alert.is_acknowledged) return res.status(400).json({ success: false, message: 'Alert already acknowledged' });
    
    const now = Math.floor(Date.now() / 1000);
    db.prepare(`
      UPDATE alerts 
      SET is_acknowledged = 1, acknowledged_by = ?, acknowledged_at = ?
      WHERE id = ?
    `).run(req.user.id, now, id);
    
    // Log audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
      VALUES (?, ?, 'ACKNOWLEDGE_ALERT', 'alert', ?, ?, ?, ?)
    `).run(
      require('uuid').v4(),
      req.user.id,
      id,
      JSON.stringify({ temperature: alert.temperature, alert_type: alert.alert_type }),
      req.ip,
      now
    );
    
    res.json({ success: true, message: 'Alert acknowledged successfully' });
  } catch (err) { next(err); }
};
