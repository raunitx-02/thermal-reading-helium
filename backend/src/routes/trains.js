const express = require('express');
const router = express.Router();
const trainsController = require('../controllers/trainsController');
const authMiddleware = require('../middleware/auth');
const auditMiddleware = require('../middleware/audit');
const multer = require('multer');
const path = require('path');

const upload = multer({ dest: path.join(__dirname, '../../uploads/') });

router.use(authMiddleware());

// Train list / details available to both
router.get('/', trainsController.getAllTrains);
router.get('/:id', trainsController.getTrainById);
router.get('/:trainId/coaches', trainsController.getCoachesByTrain);
router.get('/coaches/:coachId/zones', trainsController.getZonesByCoach);

// CRUD modifications admin only
router.post('/', authMiddleware(['super_admin', 'branch_admin']), auditMiddleware('CREATE_TRAIN', 'train'), trainsController.createTrain);
router.put('/:id', authMiddleware(['super_admin', 'branch_admin']), auditMiddleware('UPDATE_TRAIN', 'train'), trainsController.updateTrain);
router.delete('/:id', authMiddleware(['super_admin', 'branch_admin']), auditMiddleware('DEACTIVATE_TRAIN', 'train'), trainsController.deleteTrain);

router.post('/coaches', authMiddleware(['super_admin', 'branch_admin']), auditMiddleware('CREATE_COACH', 'coach'), trainsController.createCoach);
router.put('/coaches/:id', authMiddleware(['super_admin', 'branch_admin']), auditMiddleware('UPDATE_COACH', 'coach'), trainsController.updateCoach);

router.post('/zones', authMiddleware(['super_admin', 'branch_admin']), auditMiddleware('CREATE_ZONE', 'zone'), trainsController.createZone);
router.put('/zones/:id', authMiddleware(['super_admin', 'branch_admin']), auditMiddleware('UPDATE_ZONE', 'zone'), trainsController.updateZone);
router.delete('/zones/:id', authMiddleware(['super_admin', 'branch_admin']), auditMiddleware('DEACTIVATE_ZONE', 'zone'), trainsController.deleteZone);

// Bulk import
router.post('/bulk-import', authMiddleware(['super_admin', 'branch_admin']), upload.single('file'), auditMiddleware('BULK_IMPORT_TRAINS', 'trains'), trainsController.bulkImport);

module.exports = router;
