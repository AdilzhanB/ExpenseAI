import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import database from '../database/init.js';

const router = express.Router();

// Upload routes
router.use(authenticateToken);

router.post('/', async (req, res) => {
  res.json({ success: true, data: { upload: 'success' } });
});

export default router;
