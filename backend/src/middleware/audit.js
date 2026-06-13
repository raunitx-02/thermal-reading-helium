const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const auditMiddleware = (action, entityType = null) => (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function (data) {
    if (res.statusCode < 400 && req.user) {
      try {
        const db = getDb();
        db.prepare(`INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
          .run(uuidv4(), req.user.id, action, entityType, req.params?.id || data?.data?.id || null, JSON.stringify({ method: req.method, path: req.path }), req.ip, Math.floor(Date.now() / 1000));
      } catch (_) {}
    }
    return originalJson(data);
  };
  next();
};

module.exports = auditMiddleware;
