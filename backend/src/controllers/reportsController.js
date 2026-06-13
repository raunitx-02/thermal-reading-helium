const { getDb } = require('../config/database');
const exportService = require('../services/exportService');

exports.getReportData = (req, res, next) => {
  try {
    const db = getDb();
    const { type, startDate, endDate, train_id } = req.query;
    
    if (!type || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'type, startDate, and endDate required' });
    }
    
    let data = [];
    
    if (type === 'daily') {
      let query = `
        SELECT s.id, s.inspection_date, s.submitted_at, t.train_number, t.train_name, u.name as inspector_name,
               (SELECT COUNT(*) FROM thermal_readings WHERE session_id = s.id) as total_zones,
               (SELECT COUNT(*) FROM thermal_readings WHERE session_id = s.id AND status IN ('warning', 'critical')) as anomaly_count
        FROM inspection_sessions s
        JOIN trains t ON s.train_id = t.id
        JOIN users u ON s.inspector_id = u.id
        WHERE s.inspection_date BETWEEN ? AND ?
      `;
      const params = [startDate, endDate];
      if (train_id) { query += ' AND s.train_id = ?'; params.push(train_id); }
      query += ' ORDER BY s.inspection_date DESC';
      data = db.prepare(query).all(...params);
      
    } else if (type === 'alerts') {
      let query = `
        SELECT a.id, a.alert_type, a.temperature, a.is_acknowledged, a.created_at,
               t.train_number, t.train_name, c.coach_number, z.zone_name,
               u.name as ack_by
        FROM alerts a
        JOIN trains t ON a.train_id = t.id
        JOIN coaches c ON a.coach_id = c.id
        JOIN zones z ON a.zone_id = z.id
        LEFT JOIN users u ON a.acknowledged_by = u.id
        WHERE date(a.created_at, 'unixepoch') BETWEEN ? AND ?
      `;
      const params = [startDate, endDate];
      if (train_id) { query += ' AND a.train_id = ?'; params.push(train_id); }
      query += ' ORDER BY a.created_at DESC';
      data = db.prepare(query).all(...params);
      
    } else if (type === 'kpi') {
      data = db.prepare(`
        SELECT kr.date, kr.inspections_done, kr.on_time_count, kr.violations_found, kr.compliance_rate,
               u.name as inspector_name, u.employee_id
        FROM kpi_records kr
        JOIN users u ON kr.inspector_id = u.id
        WHERE kr.date BETWEEN ? AND ?
        ORDER BY kr.date DESC, kr.compliance_rate DESC
      `).all(startDate, endDate);
      
    } else if (type === 'history') {
      let query = `
        SELECT r.temperature, r.status, r.recorded_at, r.notes,
               t.train_number, t.train_name, c.coach_number, z.zone_name, z.zone_type,
               u.name as inspector_name
        FROM thermal_readings r
        JOIN inspection_sessions s ON r.session_id = s.id
        JOIN zones z ON r.zone_id = z.id
        JOIN coaches c ON z.coach_id = c.id
        JOIN trains t ON c.train_id = t.id
        JOIN users u ON s.inspector_id = u.id
        WHERE s.inspection_date BETWEEN ? AND ?
      `;
      const params = [startDate, endDate];
      if (train_id) { query += ' AND t.id = ?'; params.push(train_id); }
      query += ' ORDER BY r.recorded_at DESC LIMIT 500';
      data = db.prepare(query).all(...params);
    }
    
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.downloadReport = async (req, res, next) => {
  try {
    const { format, type, startDate, endDate, train_id } = req.query;
    if (!format || !type || !startDate || !endDate) {
      return res.status(400).send('Parameters missing');
    }
    
    // Stub data retrieval
    const db = getDb();
    let records = [];
    
    if (type === 'daily') {
      records = db.prepare(`
        SELECT s.inspection_date as date, t.train_number as train, u.name as inspector,
               (SELECT COUNT(*) FROM thermal_readings WHERE session_id = s.id) as readings,
               (SELECT COUNT(*) FROM thermal_readings WHERE session_id = s.id AND status IN ('warning', 'critical')) as violations
        FROM inspection_sessions s
        JOIN trains t ON s.train_id = t.id
        JOIN users u ON s.inspector_id = u.id
        WHERE s.inspection_date BETWEEN ? AND ?
        ORDER BY s.inspection_date DESC
      `).all(startDate, endDate);
    } else if (type === 'alerts') {
      records = db.prepare(`
        SELECT date(a.created_at, 'unixepoch') as date, t.train_number as train, c.coach_number as coach,
               z.zone_name as zone, a.alert_type as type, a.temperature as temp,
               CASE WHEN a.is_acknowledged = 1 THEN 'Yes' ELSE 'No' END as ack
        FROM alerts a
        JOIN trains t ON a.train_id = t.id
        JOIN coaches c ON a.coach_id = c.id
        JOIN zones z ON a.zone_id = z.id
        WHERE date(a.created_at, 'unixepoch') BETWEEN ? AND ?
        ORDER BY a.created_at DESC
      `).all(startDate, endDate);
    } else if (type === 'kpi') {
      records = db.prepare(`
        SELECT kr.date, u.name as inspector, kr.inspections_done as inspections,
               kr.violations_found as violations, kr.compliance_rate as compliance
        FROM kpi_records kr
        JOIN users u ON kr.inspector_id = u.id
        WHERE kr.date BETWEEN ? AND ?
        ORDER BY kr.date DESC
      `).all(startDate, endDate);
    } else {
      records = db.prepare(`
        SELECT date(r.recorded_at, 'unixepoch') as date, t.train_number as train, c.coach_number as coach,
               z.zone_name as zone, r.temperature as temp, r.status
        FROM thermal_readings r
        JOIN inspection_sessions s ON r.session_id = s.id
        JOIN zones z ON r.zone_id = z.id
        JOIN coaches c ON z.coach_id = c.id
        JOIN trains t ON c.train_id = t.id
        WHERE s.inspection_date BETWEEN ? AND ?
        ORDER BY r.recorded_at DESC LIMIT 1000
      `).all(startDate, endDate);
    }
    
    const title = `${type.toUpperCase()} Thermal Inspection Report (${startDate} to ${endDate})`;
    
    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=thermal_report_${type}_${startDate}.pdf`);
      exportService.generatePdfReport(res, title, records);
    } else {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=thermal_report_${type}_${startDate}.xlsx`);
      await exportService.generateExcelReport(res, title, records);
    }
  } catch (err) { next(err); }
};
