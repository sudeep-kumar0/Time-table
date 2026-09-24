import { Router } from 'express';
import { getReports } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getReports);

export default router;
