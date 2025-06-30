import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import database from '../database/init.js';

const router = express.Router();

// Analytics routes
router.use(authenticateToken);

router.get('/', async (req, res) => {
  res.json({ success: true, data: { analytics: [] } });
});

export default router;
