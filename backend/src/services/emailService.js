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

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_fXY3Sw9T_DAvwCYE1waMRc3WpV3a9cLi5';

async function sendResendEmail(to, subject, html) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Thermal Portal <onboarding@resend.dev>',
        to: Array.isArray(to) ? to : [to],
        subject,
        html
      })
    });
    const resData = await response.json();
    console.log('[RESEND EMAIL] Sent:', resData);
    return resData;
  } catch (err) {
    console.error('[RESEND EMAIL] Failed to send email via Resend:', err.message);
    // Fallback: try email transporter if it exists
    const client = getTransporter();
    if (client) {
      const fromName = process.env.EMAIL_FROM || 'Thermal Portal <noreply@thermalportal.in>';
      await client.sendMail({
        from: fromName,
        to,
        subject,
        html
      });
      console.log('[SMTP FALLBACK] Sent fallback email to:', to);
    } else {
      throw err;
    }
  }
}

exports.sendActivationEmail = async (user, token) => {
  const activationUrl = `${process.env.FRONTEND_URL || 'https://thermal-frontend.vercel.app'}/activate-account/${token}`;
  
  const roleName = {
    branch_admin: 'Branch Administrator',
    supervisor: 'Supervisor',
    ground_engineer: 'Ground Engineer'
  }[user.role] || user.role;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b; background-color: #f8fafc;">
      <div style="background-color: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 40px;">🚂</span>
          <h2 style="margin: 12px 0 4px 0; color: #0f172a; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">Welcome to Thermal Portal</h2>
          <p style="margin: 0; color: #64748b; font-size: 14px; font-weight: 500;">Indian Railways Thermal Diagnostics Hub</p>
        </div>
        
        <div style="border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; padding: 24px 0; margin-bottom: 24px;">
          <p style="margin: 0 0 12px 0; font-size: 16px; line-height: 1.5;">Hello <strong>${user.name}</strong>,</p>
          <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">
            You have been registered as a <strong>${roleName}</strong> in the Thermal Portal system.
          </p>
          <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #334155;">
            To activate your account and set up your secure login password, please click the button below:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${activationUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 32px; font-size: 14px; font-weight: 700; border-radius: 8px; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
              Activate Account & Set Password
            </a>
          </div>
          
          <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
            If the button doesn't work, copy and paste this link in your browser:<br/>
            <a href="${activationUrl}" style="color: #2563eb; word-break: break-all;">${activationUrl}</a>
          </p>
        </div>
        
        <div style="text-align: center; font-size: 12px; color: #64748b; line-height: 1.5;">
          <p style="margin: 0 0 4px 0;">This welcome invitation is sent by Thermal Diagnostics Administration.</p>
          <p style="margin: 0;">If you did not expect this request, please contact your systems manager.</p>
        </div>
      </div>
    </div>
  `;

  await sendResendEmail(user.email, `Welcome to Thermal Portal! Activate Your ${roleName} Account`, html);
};

exports.sendReportNotification = async (supervisor, engineer, train, session, readings) => {
  const dateStr = session.inspection_date || new Date().toISOString().split('T')[0];
  
  // Build reading rows
  let rowsHtml = '';
  let criticalCount = 0;
  let warningCount = 0;
  
  readings.forEach(r => {
    const rise = r.temperature !== null && r.ambient_temperature !== null ? (parseFloat(r.temperature) - parseFloat(r.ambient_temperature)) : 0;
    const isCrit = r.temperature >= r.critical_threshold || rise > 25;
    const isWarn = !isCrit && (r.temperature >= r.warning_threshold || rise > 15);
    
    let badgeStyle = 'background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;';
    let badgeText = 'ACCEPTABLE';
    
    if (isCrit) {
      badgeStyle = 'background-color: #fef2f2; color: #991b1b; border: 1px solid #fecaca; font-weight: 700;';
      badgeText = 'CRITICAL';
      criticalCount++;
    } else if (isWarn) {
      badgeStyle = 'background-color: #fffbeb; color: #92400e; border: 1px solid #fde68a; font-weight: 700;';
      badgeText = 'WARNING';
      warningCount++;
    }
    
    const riseDisplay = rise > 0 ? `+${rise.toFixed(1)}°C` : `${rise.toFixed(1)}°C`;
    const riseStyle = isCrit ? 'color: #dc2626; font-weight: 700;' : isWarn ? 'color: #d97706; font-weight: 700;' : 'color: #475569;';

    rowsHtml += `
      <tr style="border-bottom: 1px solid #f1f5f9; font-size: 13px;">
        <td style="padding: 12px 8px; font-weight: bold; color: #334155;">${r.coach_number || 'N/A'}</td>
        <td style="padding: 12px 8px; color: #475569;">${r.zone_name || 'N/A'}</td>
        <td style="padding: 12px 8px; text-align: center; color: #475569;">${r.ambient_temperature}°C</td>
        <td style="padding: 12px 8px; text-align: center; font-weight: bold; color: #0f172a;">${r.temperature}°C</td>
        <td style="padding: 12px 8px; text-align: center; ${riseStyle}">${riseDisplay}</td>
        <td style="padding: 12px 8px; text-align: center;">
          <span style="display: inline-block; padding: 2px 8px; font-size: 10px; border-radius: 4px; ${badgeStyle}">
            ${badgeText}
          </span>
        </td>
      </tr>
    `;
  });

  const summaryBadge = criticalCount > 0 
    ? '<span style="background-color: #dc2626; color: #ffffff; padding: 4px 12px; font-size: 12px; font-weight: 800; border-radius: 20px;">CRITICAL BREACH</span>' 
    : warningCount > 0
    ? '<span style="background-color: #f59e0b; color: #ffffff; padding: 4px 12px; font-size: 12px; font-weight: 800; border-radius: 20px;">WARNING IN EFFECT</span>'
    : '<span style="background-color: #10b981; color: #ffffff; padding: 4px 12px; font-size: 12px; font-weight: 800; border-radius: 20px;">ALL SAFE</span>';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: #f8fafc;">
      <div style="background-color: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
        
        <table style="width: 100%; border-collapse: collapse; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px;">
          <tr>
            <td>
              <h2 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 800;">Thermal Inspection Report</h2>
              <p style="margin: 4px 0 0 0; color: #64748b; font-size: 12px;">Rake No: <strong>${train.train_number}</strong> | ${train.train_name}</p>
            </td>
            <td style="text-align: right; vertical-align: middle;">
              ${summaryBadge}
            </td>
          </tr>
        </table>

        <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 13px; border: 1px solid #f1f5f9;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Inspector / Engineer:</td>
              <td style="padding: 4px 0; font-weight: bold; color: #334155; text-align: right;">${engineer.name}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Inspection Date:</td>
              <td style="padding: 4px 0; font-weight: bold; color: #334155; text-align: right;">${dateStr}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Alarms Triggered:</td>
              <td style="padding: 4px 0; font-weight: bold; color: #dc2626; text-align: right;">${criticalCount} Critical | ${warningCount} Warning</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 24px; overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase;">
                <th style="padding: 10px 8px;">Coach</th>
                <th style="padding: 10px 8px;">Component</th>
                <th style="padding: 10px 8px; text-align: center;">Ambient</th>
                <th style="padding: 10px 8px; text-align: center;">Max Temp</th>
                <th style="padding: 10px 8px; text-align: center;">Rise</th>
                <th style="padding: 10px 8px; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 24px;">
          <p style="margin: 0 0 16px 0; font-size: 13px; color: #64748b;">
            Log into your Supervisor Dashboard to review detailed logs, trends, and download full PDF reports.
          </p>
          <a href="${process.env.FRONTEND_URL || 'https://thermal-frontend.vercel.app'}" style="background-color: #0f172a; color: #ffffff; padding: 10px 24px; font-size: 13px; font-weight: 700; border-radius: 8px; text-decoration: none; display: inline-block;">
            Open Dashboard
          </a>
        </div>

      </div>
    </div>
  `;

  await sendResendEmail(supervisor.email, `[Report] Rake ${train.train_number} - ${criticalCount > 0 ? 'ALARM ALERT' : 'Submitted successfully'}`, html);
};

exports.sendAlertEmail = async (zone, temperature, status) => {
  try {
    const db = getDb();
    const enabled = (await db.prepare("SELECT value FROM system_settings WHERE key = 'email_alerts_enabled'").get())?.value === 'true';
    if (!enabled) return;

    // Get all admin emails
    const admins = await db.prepare("SELECT email FROM users WHERE role = 'admin' AND is_active = 1").all();
    if (!admins.length) return;

    const emailList = admins.map(a => a.email);

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

    await sendResendEmail(emailList, `[${status.toUpperCase()}] Thermal Alert: Train ${zone.train_number} Coach ${zone.coach_number}`, html);
  } catch (err) {
    console.error('Failed to dispatch alert email:', err.message);
  }
};

exports.sendPasswordResetOtp = async (email, name, otp) => {
  try {
    const html = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px; max-width: 500px;">
        <h3>Password Reset Request</h3>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password. Use the verification code below to proceed:</p>
        <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 1.8em; font-weight: bold; letter-spacing: 5px; color: #1e293b; border-radius: 6px; margin: 15px 0;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes. If you did not make this request, please ignore this email.</p>
      </div>
    `;
    await sendResendEmail(email, 'Thermal Portal - Password Reset Verification Code', html);
  } catch (err) {
    console.error('Password reset email failed:', err.message);
  }
};
