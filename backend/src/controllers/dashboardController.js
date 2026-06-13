const { getDb } = require('../config/database');

exports.getSummary = (req, res, next) => {
  try {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    
    // Total Active Trains
    const totalTrains = db.prepare("SELECT COUNT(*) as cnt FROM trains WHERE is_active = 1").get().cnt;
    
    // Total inspections submitted today
    const completedInspections = db.prepare(`
      SELECT COUNT(*) as cnt FROM inspection_sessions 
      WHERE inspection_date = ? AND status = 'submitted'
    `).get(today).cnt;
    
    // Pending inspections (active trains not inspected today)
    const pendingInspections = Math.max(0, totalTrains - completedInspections);
    
    // Active / Unacknowledged alerts today
    const activeAlerts = db.prepare("SELECT COUNT(*) as cnt FROM alerts WHERE is_acknowledged = 0").get().cnt;
    
    // Average Compliance rate of inspectors
    const avgCompliance = db.prepare(`
      SELECT AVG(compliance_rate) as avg_comp FROM kpi_records WHERE date = ?
    `).get(today).avg_comp || 100.0;
    
    res.json({
      success: true,
      data: {
        totalTrains,
        completedInspections,
        pendingInspections,
        activeAlerts,
        complianceRate: Math.round(avgCompliance * 10) / 10
      }
    });
  } catch (err) { next(err); }
};

exports.getCharts = (req, res, next) => {
  try {
    const db = getDb();
    const days = parseInt(req.query.days || '7');
    
    // Past N days array
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    
    // 1. Daily Inspection Activity Trend
    const trendData = dates.map(date => {
      const stats = db.prepare(`
        SELECT 
          COUNT(CASE WHEN status = 'submitted' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'draft' THEN 1 END) as drafts
        FROM inspection_sessions 
        WHERE inspection_date = ?
      `).get(date);
      
      const alerts = db.prepare(`
        SELECT COUNT(*) as cnt FROM alerts WHERE date(created_at, 'unixepoch') = ?
      `).get(date).cnt;
      
      return {
        date,
        completed: stats.completed || 0,
        drafts: stats.drafts || 0,
        alerts: alerts || 0
      };
    });
    
    // 2. Alert Type Distribution (Warning vs Critical)
    const alertDistribution = db.prepare(`
      SELECT alert_type as name, COUNT(*) as value 
      FROM alerts 
      GROUP BY alert_type
    `).all();
    
    // 3. Worst performing trains (most alerts)
    const worstTrains = db.prepare(`
      SELECT t.train_number || ' - ' || t.train_name as name, COUNT(a.id) as value
      FROM alerts a
      JOIN trains t ON a.train_id = t.id
      GROUP BY a.train_id
      ORDER BY value DESC
      LIMIT 5
    `).all();
    
    res.json({
      success: true,
      data: {
        trendData,
        alertDistribution: alertDistribution.length ? alertDistribution : [{ name: 'warning', value: 0 }, { name: 'critical', value: 0 }],
        worstTrains
      }
    });
  } catch (err) { next(err); }
};
