import { Router } from 'express';
import {
  generate,
  validate,
  optimize,
  getAllTimetables,
  getTimetableById,
  deleteTimetable,
} from '../controllers/timetableController.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';

const router = Router();

// Generation & Optimization endpoints
router.post('/generate', authenticate, authorizeRole('ADMIN'), generate);
router.post('/validate', authenticate, validate);
router.post('/optimize/:id', authenticate, authorizeRole('ADMIN'), optimize);

// Timetable fetching (accessible to logged-in ADMIN and FACULTY)
router.get('/', authenticate, getAllTimetables);
router.get('/:id', authenticate, getTimetableById);
router.delete('/:id', authenticate, authorizeRole('ADMIN'), deleteTimetable);

export default router;
