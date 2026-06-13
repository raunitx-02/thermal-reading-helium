const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware());

router.get('/', notificationsController.getNotifications);
router.put('/read-all', notificationsController.markAsRead);

module.exports = router;
