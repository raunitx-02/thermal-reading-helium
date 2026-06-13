const express = require('express');
const router = express.Router();
const sessionsController = require('../controllers/sessionsController');
const authMiddleware = require('../middleware/auth');
const auditMiddleware = require('../middleware/audit');

router.use(authMiddleware());

router.get('/', sessionsController.getSessions);
router.get('/:id', sessionsController.getSessionById);

// Inspectors/Ground Engineers entry
router.post('/', authMiddleware(['ground_engineer']), auditMiddleware('CREATE_SESSION', 'session'), sessionsController.createSession);
router.post('/reading', authMiddleware(['ground_engineer']), sessionsController.saveReading);
router.post('/:id/submit', authMiddleware(['ground_engineer']), auditMiddleware('SUBMIT_SESSION', 'session'), sessionsController.submitSession);

module.exports = router;
