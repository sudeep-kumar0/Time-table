import { Router } from 'express';
import {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../controllers/subjectController.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllSubjects);
router.get('/:id', getSubjectById);
router.post('/', authenticate, authorizeRole('ADMIN'), createSubject);
router.put('/:id', authenticate, authorizeRole('ADMIN'), updateSubject);
router.delete('/:id', authenticate, authorizeRole('ADMIN'), deleteSubject);

export default router;
