import { Router } from 'express';
import { getConflicts } from '../controllers/conflictController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getConflicts);

export default router;
