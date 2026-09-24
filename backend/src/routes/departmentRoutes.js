import { Router } from 'express';
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllDepartments);
router.get('/:id', getDepartmentById);
router.post('/', authenticate, authorizeRole('ADMIN'), createDepartment);
router.put('/:id', authenticate, authorizeRole('ADMIN'), updateDepartment);
router.delete('/:id', authenticate, authorizeRole('ADMIN'), deleteDepartment);

export default router;
