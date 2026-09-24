import { Router } from 'express';
import { getAllGenerationLogs } from '../controllers/generationLogController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getAllGenerationLogs);

export default router;
