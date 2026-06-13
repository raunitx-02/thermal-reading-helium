const express = require('express');
const router = express.Router();
const alertsController = require('../controllers/alertsController');
const authMiddleware = require('../middleware/auth');
const auditMiddleware = require('../middleware/audit');

router.use(authMiddleware());

router.get('/', alertsController.getAlerts);
router.put('/:id/acknowledge', auditMiddleware('ACKNOWLEDGE_ALERT', 'alert'), alertsController.acknowledgeAlert);

module.exports = router;
