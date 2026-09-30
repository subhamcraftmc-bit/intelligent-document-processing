import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, analyticsController.getAnalytics);

export default router;
