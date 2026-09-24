import { Router } from 'express';
import {
  getAllDivisions,
  getDivisionById,
  createDivision,
  updateDivision,
  deleteDivision,
} from '../controllers/divisionController.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllDivisions);
router.get('/:id', getDivisionById);
router.post('/', authenticate, authorizeRole('ADMIN'), createDivision);
router.put('/:id', authenticate, authorizeRole('ADMIN'), updateDivision);
router.delete('/:id', authenticate, authorizeRole('ADMIN'), deleteDivision);

export default router;
