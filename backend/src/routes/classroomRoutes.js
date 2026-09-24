import { Router } from 'express';
import {
  getAllClassrooms,
  getClassroomById,
  createClassroom,
  updateClassroom,
  updateClassroomAvailability,
  deleteClassroom,
} from '../controllers/classroomController.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllClassrooms);
router.get('/:id', getClassroomById);
router.post('/', authenticate, authorizeRole('ADMIN'), createClassroom);
router.put('/:id', authenticate, authorizeRole('ADMIN'), updateClassroom);
router.put('/:id/availability', authenticate, authorizeRole('ADMIN'), updateClassroomAvailability);
router.delete('/:id', authenticate, authorizeRole('ADMIN'), deleteClassroom);

export default router;
