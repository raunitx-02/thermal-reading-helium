const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware('admin'));

router.get('/summary', dashboardController.getSummary);
router.get('/charts', dashboardController.getCharts);

module.exports = router;
