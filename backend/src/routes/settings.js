const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/auth');
const auditMiddleware = require('../middleware/audit');

router.use(authMiddleware('admin'));

router.get('/', settingsController.getSettings);
router.put('/', auditMiddleware('UPDATE_SETTINGS', 'settings'), settingsController.updateSettings);

module.exports = router;
