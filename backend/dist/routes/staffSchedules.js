import { Router } from 'express';
import { body, param } from 'express-validator';
import { getStaffSchedules, getStaffScheduleById, createStaffSchedule, updateStaffSchedule, deleteStaffSchedule, getSchedulesByStaff, } from '../controllers/staffScheduleController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
const router = Router();
// All staff schedule routes require authentication
router.use(authenticateToken);
// Validation rules
const createScheduleValidation = [
    body('staffId').isUUID().withMessage('Invalid staff ID format'),
    body('dayOfWeek').isInt({ min: 0, max: 6 }).withMessage('Day of week must be 0-6'),
    body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be in HH:MM format'),
    body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('End time must be in HH:MM format'),
    body('breakStartTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Break start time must be in HH:MM format'),
    body('breakEndTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Break end time must be in HH:MM format'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];
const updateScheduleValidation = [
    body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be in HH:MM format'),
    body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('End time must be in HH:MM format'),
    body('breakStartTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Break start time must be in HH:MM format'),
    body('breakEndTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Break end time must be in HH:MM format'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];
const idValidation = [
    param('id').isUUID().withMessage('Invalid schedule ID format'),
];
// Routes
// GET /api/staff-schedules - Get all staff schedules with optional filtering
router.get('/', authorizeRoles('ADMIN', 'MODERATOR'), getStaffSchedules);
// GET /api/staff-schedules/by-staff - Get schedules grouped by staff member
router.get('/by-staff', authorizeRoles('ADMIN', 'MODERATOR'), getSchedulesByStaff);
// GET /api/staff-schedules/:id - Get specific staff schedule
router.get('/:id', idValidation, validate, authorizeRoles('ADMIN', 'MODERATOR'), getStaffScheduleById);
// POST /api/staff-schedules - Create new staff schedule (admin only)
router.post('/', createScheduleValidation, validate, authorizeRoles('ADMIN'), createStaffSchedule);
// PUT /api/staff-schedules/:id - Update staff schedule (admin only)
router.put('/:id', idValidation, updateScheduleValidation, validate, authorizeRoles('ADMIN'), updateStaffSchedule);
// DELETE /api/staff-schedules/:id - Delete staff schedule (admin only)
router.delete('/:id', idValidation, validate, authorizeRoles('ADMIN'), deleteStaffSchedule);
export default router;
//# sourceMappingURL=staffSchedules.js.map