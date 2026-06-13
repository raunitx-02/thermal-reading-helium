const express = require('express');
const router = express.Router();
const kpiController = require('../controllers/kpiController');
const authMiddleware = require('../middleware/auth');
const auditMiddleware = require('../middleware/audit');

router.use(authMiddleware());

// Inspector stats (self) or admin checking inspector stats
router.get('/stats/:inspectorId?', kpiController.getInspectorStats);

// Scoreboard (open to all roles to foster compliance)
router.get('/scoreboard', kpiController.getScoreboard);

// KPI Target setup (admin only)
router.get('/targets', authMiddleware('admin'), kpiController.getTargets);
router.post('/targets', authMiddleware('admin'), auditMiddleware('SET_KPI_TARGET', 'kpi_target'), kpiController.setTarget);

module.exports = router;
