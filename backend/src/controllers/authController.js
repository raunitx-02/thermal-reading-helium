const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');
const emailService = require('../services/emailService');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
  return { accessToken, refreshToken };
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email.toLowerCase().trim());
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const { accessToken, refreshToken } = generateTokens(user.id);
    const expiresAt = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
    db.prepare('INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), user.id, refreshToken, expiresAt, Math.floor(Date.now() / 1000));
    db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(Math.floor(Date.now() / 1000), user.id);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, division: user.division, phone: user.phone, employee_id: user.employee_id }
      }
    });
  } catch (err) { next(err); }
};

exports.refresh = (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const db = getDb();
    const stored = db.prepare('SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ? AND expires_at > ?').get(refreshToken, decoded.userId, Math.floor(Date.now() / 1000));
    if (!stored) return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });

    const user = db.prepare('SELECT id, role FROM users WHERE id = ? AND is_active = 1').get(decoded.userId);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);
    const expiresAt = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
    db.prepare('DELETE FROM refresh_tokens WHERE id = ?').run(stored.id);
    db.prepare('INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), user.id, newRefreshToken, expiresAt, Math.floor(Date.now() / 1000));

    res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
  } catch (err) { next(err); }
};

exports.logout = (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const db = getDb();
    if (refreshToken) db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) { next(err); }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email?.toLowerCase().trim());
    if (!user) return res.json({ success: true, message: 'If account exists, OTP has been sent' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Math.floor(Date.now() / 1000) + 600; // 10 minutes
    db.prepare('UPDATE users SET reset_otp = ?, reset_otp_expires = ? WHERE id = ?').run(otp, expiresAt, user.id);

    await emailService.sendPasswordResetOtp(user.email, user.name, otp).catch(() => {});
    res.json({ success: true, message: 'OTP sent to your email address' });
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: 'Email, OTP, and new password required' });

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND reset_otp = ? AND reset_otp_expires > ?').get(email.toLowerCase().trim(), otp, Math.floor(Date.now() / 1000));
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    const hash = await bcrypt.hash(newPassword, 12);
    db.prepare('UPDATE users SET password_hash = ?, reset_otp = NULL, reset_otp_expires = NULL WHERE id = ?').run(hash, user.id);
    db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(user.id);

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) { next(err); }
};

exports.me = (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, name, email, role, division, phone, employee_id, last_login, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json({ success: true, data: user });
};
