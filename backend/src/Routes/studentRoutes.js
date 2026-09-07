import express from 'express';
import studentController from '../controllers/studentController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/search', studentController.search);
router.put('/:studentId/nfc', studentController.linkNfcTag);
router.delete('/:studentId/nfc', studentController.unlinkNfcTag);

export default router;
