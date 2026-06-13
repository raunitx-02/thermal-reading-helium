const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const authMiddleware = require('../middleware/auth');
const auditMiddleware = require('../middleware/audit');

router.use(authMiddleware());

// Inspector changing their own password
router.post('/change-password', usersController.changePassword);

// Admin only routes
router.get('/', authMiddleware(['super_admin', 'branch_admin', 'supervisor']), usersController.getAll);
router.get('/:id', authMiddleware(['super_admin', 'branch_admin', 'supervisor']), usersController.getById);
router.post('/', authMiddleware(['super_admin', 'branch_admin', 'supervisor']), auditMiddleware('CREATE_USER', 'user'), usersController.create);
router.put('/:id', authMiddleware(['super_admin', 'branch_admin', 'supervisor']), auditMiddleware('UPDATE_USER', 'user'), usersController.update);
router.delete('/:id', authMiddleware(['super_admin', 'branch_admin', 'supervisor']), auditMiddleware('DEACTIVATE_USER', 'user'), usersController.deactivate);

module.exports = router;
