const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const authMiddleware = require('../middleware/auth');
const auditMiddleware = require('../middleware/audit');

router.use(authMiddleware());

// Inspector changing their own password
router.post('/change-password', usersController.changePassword);

// Admin only routes
router.get('/', authMiddleware('admin'), usersController.getAll);
router.get('/:id', authMiddleware('admin'), usersController.getById);
router.post('/', authMiddleware('admin'), auditMiddleware('CREATE_USER', 'user'), usersController.create);
router.put('/:id', authMiddleware('admin'), auditMiddleware('UPDATE_USER', 'user'), usersController.update);
router.delete('/:id', authMiddleware('admin'), auditMiddleware('DEACTIVATE_USER', 'user'), usersController.deactivate);

module.exports = router;
