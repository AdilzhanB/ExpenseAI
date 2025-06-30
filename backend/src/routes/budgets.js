import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import database from '../database/init.js';

const router = express.Router();

// Placeholder routes for other endpoints
router.use(authenticateToken);

// Budgets
router.get('/', async (req, res) => {
  res.json({ success: true, data: { budgets: [] } });
});

export default router;
