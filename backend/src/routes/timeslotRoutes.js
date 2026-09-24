import { Router } from 'express';
import {
  getAllTimeSlots,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  initializeDefaultTimeSlots,
} from '../controllers/timeslotController.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllTimeSlots);
router.post('/', authenticate, authorizeRole('ADMIN'), createTimeSlot);
router.post('/initialize', authenticate, authorizeRole('ADMIN'), initializeDefaultTimeSlots);
router.put('/:id', authenticate, authorizeRole('ADMIN'), updateTimeSlot);
router.delete('/:id', authenticate, authorizeRole('ADMIN'), deleteTimeSlot);

export default router;
