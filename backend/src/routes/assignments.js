const express = require('express');
const router = express.Router();
const assignmentsController = require('../controllers/assignmentsController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware());

// Super Admin / Branch Admin / Supervisor can manage assignments
router.post('/', authMiddleware(['super_admin', 'branch_admin', 'supervisor']), assignmentsController.create);
router.get('/', assignmentsController.getAll);
router.delete('/:id', authMiddleware(['super_admin', 'branch_admin', 'supervisor']), assignmentsController.deleteAssignment);

module.exports = router;
