const express = require('express');
const router = express.Router();
const sessionsController = require('../controllers/sessionsController');
const authMiddleware = require('../middleware/auth');
const auditMiddleware = require('../middleware/audit');

router.use(authMiddleware());

router.get('/', sessionsController.getSessions);
router.get('/:id', sessionsController.getSessionById);

// Inspectors entry
router.post('/', auditMiddleware('CREATE_SESSION', 'session'), sessionsController.createSession);
router.post('/reading', sessionsController.saveReading);
router.post('/:id/submit', auditMiddleware('SUBMIT_SESSION', 'session'), sessionsController.submitSession);

module.exports = router;
