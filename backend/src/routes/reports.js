const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware());

router.get('/data', reportsController.getReportData);
router.get('/download', reportsController.downloadReport);
router.get('/session/:sessionId', reportsController.downloadSessionReport);

module.exports = router;
