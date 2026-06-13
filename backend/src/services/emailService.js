const nodemailer = require('nodemailer');
const { getDb } = require('../config/database');

let transporter;

function getTransporter() {
  if (!transporter) {
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpSecure = process.env.SMTP_SECURE === 'true';
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpUser && smtpPass) {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: { user: smtpUser, pass: smtpPass }
      });
    }
  }
  return transporter;
}

exports.sendAlertEmail = async (zone, temperature, status) => {
  try {
    const db = getDb();
    const enabled = db.prepare("SELECT value FROM system_settings WHERE key = 'email_alerts_enabled'").get()?.value === 'true';
    if (!enabled) return;

    const smtpUser = process.env.SMTP_USER;
    if (!smtpUser) {
      console.log(`[EMAIL BYPASS] SMTP credentials missing. Alert Email: ${zone.train_number} Coach ${zone.coach_number} Zone ${zone.zone_name} Temp: ${temperature}°C (${status.toUpperCase()})`);
      return;
    }

    const client = getTransporter();
    if (!client) return;

    // Get all admin emails
    const admins = db.prepare("SELECT email FROM users WHERE role = 'admin' AND is_active = 1").all();
    if (!admins.length) return;

    const emailList = admins.map(a => a.email).join(', ');
    const fromName = process.env.EMAIL_FROM || 'Thermal Portal <noreply@thermalportal.in>';

    const html = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; max-width: 600px;">
        <h2 style="color: ${status === 'critical' ? '#dc2626' : '#ea580c'}; margin-top: 0;">
          ⚠️ ${status.toUpperCase()} Thermal Alert - Indian Railways
        </h2>
        <p>A thermal sensor threshold breach has been recorded during an inspection session.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f1f5f9; width: 150px;">Train</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${zone.train_number} - ${zone.train_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Coach</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${zone.coach_number} (${zone.coach_type})</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Zone</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${zone.zone_name} (${zone.zone_type})</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Recorded Temp</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #dc2626; font-weight: bold; font-size: 1.1em;">${temperature}°C</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Threshold limit</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Warning: >= ${zone.warning_threshold}°C | Critical: >= ${zone.critical_threshold}°C</td>
          </tr>
        </table>
        <p style="margin-top: 20px; font-size: 0.9em; color: #64748b;">
          Please log into the Admin Dashboard immediately to acknowledge and address this issue.
        </p>
      </div>
    `;

    await client.sendMail({
      from: fromName,
      to: emailList,
      subject: `[${status.toUpperCase()}] Thermal Alert: Train ${zone.train_number} Coach ${zone.coach_number}`,
      html
    });
    console.log(`[EMAIL SENT] Alerts dispatched to: ${emailList}`);
  } catch (err) {
    console.error('Failed to dispatch alert email:', err.message);
  }
};

exports.sendPasswordResetOtp = async (email, name, otp) => {
  try {
    const client = getTransporter();
    if (!client) {
      console.log(`[EMAIL BYPASS] SMTP missing. Password Reset OTP for ${name} (${email}): ${otp}`);
      return;
    }
    const fromName = process.env.EMAIL_FROM || 'Thermal Portal <noreply@thermalportal.in>';
    await client.sendMail({
      from: fromName,
      to: email,
      subject: 'Thermal Portal - Password Reset Verification Code',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px; max-width: 500px;">
          <h3>Password Reset Request</h3>
          <p>Hello ${name},</p>
          <p>We received a request to reset your password. Use the verification code below to proceed:</p>
          <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 1.8em; font-weight: bold; letter-spacing: 5px; color: #1e293b; border-radius: 6px; margin: 15px 0;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes. If you did not make this request, please ignore this email.</p>
        </div>
      `
    });
  } catch (err) {
    console.error('Password reset email failed:', err.message);
  }
};
