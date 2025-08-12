import { Router } from 'express';
import { body, param } from 'express-validator';
import { getUsers, getUserById, createUser, updateUser, deleteUser, toggleUserStatus, } from '../controllers/userController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
const router = Router();
// All user routes require authentication
router.use(authenticateToken);
// User creation validation
const createUserValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    body('firstName').trim().isLength({ min: 2, max: 50 }),
    body('lastName').trim().isLength({ min: 2, max: 50 }),
    body('role').isIn(['ADMIN', 'MODERATOR', 'USER']),
];
// User update validation
const updateUserValidation = [
    body('firstName').optional().trim().isLength({ min: 2, max: 50 }),
    body('lastName').optional().trim().isLength({ min: 2, max: 50 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('role').optional().isIn(['ADMIN', 'MODERATOR', 'USER']),
];
// ID parameter validation
const idValidation = [
    param('id').isString().notEmpty(),
];
// Routes
router.get('/', authorizeRoles('ADMIN', 'MODERATOR'), getUsers);
router.get('/:id', idValidation, validate, authorizeRoles('ADMIN', 'MODERATOR'), getUserById);
router.post('/', createUserValidation, validate, authorizeRoles('ADMIN'), createUser);
router.put('/:id', idValidation, updateUserValidation, validate, authorizeRoles('ADMIN'), updateUser);
router.delete('/:id', idValidation, validate, authorizeRoles('ADMIN'), deleteUser);
router.patch('/:id/toggle-status', idValidation, validate, authorizeRoles('ADMIN'), toggleUserStatus);
export default router;
//# sourceMappingURL=users.js.map