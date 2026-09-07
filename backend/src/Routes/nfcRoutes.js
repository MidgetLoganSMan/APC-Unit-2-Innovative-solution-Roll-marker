import express from 'express';
import nfcController from '../controllers/nfcController.js';

const router = express.Router();

// Kept unauthenticated so a local reader bridge can post a UID directly.
router.post('/tap', nfcController.handleTap);

export default router;
