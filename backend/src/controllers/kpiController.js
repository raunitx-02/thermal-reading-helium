const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

exports.getTargets = async (req, res, next) => {
  try {
    const db = getDb();
    const targets = await db.prepare(`
      SELECT kt.*, u.name as inspector_name, u.email as inspector_email
      FROM kpi_targets kt
      JOIN users u ON kt.inspector_id = u.id
      WHERE u.is_active = 1
      ORDER BY kt.effective_from DESC
    `).all();
    res.json({ success: true, data: targets });
  } catch (err) { next(err); }
};

exports.setTarget = async (req, res, next) => {
  try {
    const { inspector_id, target_inspections_per_day, deadline_hour, effective_from } = req.body;
    if (!inspector_id || !target_inspections_per_day || !deadline_hour || !effective_from) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }
    
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);
    const id = uuidv4();
    
    await db.prepare(`
      INSERT INTO kpi_targets (id, inspector_id, target_inspections_per_day, deadline_hour, effective_from, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, inspector_id, target_inspections_per_day, deadline_hour, effective_from, req.user.id, now);
    
    res.status(201).json({ success: true, message: 'KPI Target configured successfully' });
  } catch (err) { next(err); }
};

exports.getScoreboard = async (req, res, next) => {
  try {
    const db = getDb();
    const { date } = req.query;
    const filterDate = date || new Date().toISOString().split('T')[0];
    
    const scoreboard = await db.prepare(`
      SELECT kr.*, u.name as inspector_name, u.employee_id, u.division,
             COALESCE(
               (SELECT target_inspections_per_day 
                FROM kpi_targets 
                WHERE inspector_id = u.id AND effective_from <= kr.date 
                ORDER BY effective_from DESC LIMIT 1),
               3
             ) as target
      FROM kpi_records kr
      JOIN users u ON kr.inspector_id = u.id
      WHERE kr.date = ?
      ORDER BY kr.compliance_rate DESC, kr.inspections_done DESC
    `).all(filterDate);
    
    res.json({ success: true, data: scoreboard });
  } catch (err) { next(err); }
};

exports.getInspectorStats = async (req, res, next) => {
  try {
    const db = getDb();
    const inspectorId = req.params.inspectorId || req.user.id;
    
    const summary = await db.prepare(`
      SELECT 
        SUM(inspections_done) as total_inspections,
        SUM(on_time_count) as total_on_time,
        SUM(violations_found) as total_violations,
        AVG(compliance_rate) as avg_compliance
      FROM kpi_records
      WHERE inspector_id = ?
    `).get(inspectorId);
    
    const history = await db.prepare(`
      SELECT date, inspections_done, compliance_rate, violations_found
      FROM kpi_records
      WHERE inspector_id = ?
      ORDER BY date DESC
      LIMIT 30
    `).all(inspectorId);
    
    res.json({
      success: true,
      data: {
        summary: {
          totalInspections: summary.total_inspections || 0,
          totalOnTime: summary.total_on_time || 0,
          totalViolations: summary.total_violations || 0,
          avgCompliance: Math.round((summary.avg_compliance || 100) * 10) / 10
        },
        history
      }
    });
  } catch (err) { next(err); }
};
