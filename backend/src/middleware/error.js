const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request too large' });
  }
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ success: false, message: 'Record already exists' });
  }
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
};

module.exports = errorHandler;
