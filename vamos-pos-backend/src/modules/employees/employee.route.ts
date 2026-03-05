import { Router } from 'express';
import { EmployeeController } from './employee.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('ADMIN', 'MANAGER', 'OWNER', 'KASIR'));

router.post('/', EmployeeController.createEmployee);
router.get('/', EmployeeController.getEmployees);
router.get('/:id', EmployeeController.getEmployeeById);
router.put('/:id', EmployeeController.updateEmployee);
router.delete('/:id', EmployeeController.deleteEmployee);

export default router;
