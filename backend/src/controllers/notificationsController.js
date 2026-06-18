const { getDb } = require('../config/database');

exports.getNotifications = async (req, res, next) => {
  try {
    const db = getDb();
    const list = await db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all(req.user.id);
    
    res.json({ success: true, data: list });
  } catch (err) { next(err); }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const db = getDb();
    await db.prepare(`
      UPDATE notifications 
      SET is_read = 1 
      WHERE user_id = ?
    `).run(req.user.id);
    
    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (err) { next(err); }
};
