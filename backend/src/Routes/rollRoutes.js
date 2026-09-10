import express from 'express';
import rollController from '../controllers/rollController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();
// Apply authentication middleware to all routes in this router
router.use(authMiddleware);
router.get('/classes', rollController.getClasses);
router.post('/update', rollController.updateRoll);
router.put('/:classId/students/:studentId', rollController.updateStudentStatus);
router.get('/:classId', rollController.getClassRoll);

export default router;
