import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { appointmentController } from '../controllers/appointmentController.simple.js';
import { Role } from '@prisma/client';
const router = Router();
// All routes require authentication
router.use(authenticateToken);
// Routes (simplified without validation for now)
router.get('/', appointmentController.getAllAppointments);
router.get('/availability', appointmentController.checkAvailability);
router.get('/calendar', appointmentController.getCalendarAppointments);
router.get('/:id', appointmentController.getAppointmentById);
router.post('/', appointmentController.createAppointment);
router.post('/multiple', appointmentController.createMultipleAppointments);
router.post('/mark-paid', appointmentController.markAppointmentsAsPaid);
router.put('/:id', appointmentController.updateAppointment);
router.delete('/:id', appointmentController.deleteAppointment);
// Admin routes
router.delete('/bulk', authorizeRoles(Role.ADMIN), appointmentController.bulkDeleteAppointments);
export default router;
//# sourceMappingURL=appointments.js.map