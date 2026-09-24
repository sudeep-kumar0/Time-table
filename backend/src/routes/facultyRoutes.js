import { Router } from 'express';
import {
  getAllFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  updateFacultyAvailability,
  deleteFaculty,
} from '../controllers/facultyController.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllFaculty);
router.get('/:id', getFacultyById);
router.post('/', authenticate, authorizeRole('ADMIN'), createFaculty);
router.put('/:id', authenticate, authorizeRole('ADMIN'), updateFaculty);
router.put('/:id/availability', authenticate, updateFacultyAvailability);
router.delete('/:id', authenticate, authorizeRole('ADMIN'), deleteFaculty);

export default router;
