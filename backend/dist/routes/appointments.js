import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { appointmentController } from '../controllers/appointmentController.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';
import { Role } from '@prisma/client';
const router = Router();
// All routes require authentication
router.use(authenticate);
// Validation schemas
const createAppointmentSchema = z.object({
    body: z.object({
        patientId: z.string().uuid(),
        packageId: z.string().uuid(),
        serviceId: z.string().uuid(),
        staffId: z.string().uuid(),
        roomId: z.string().uuid(),
        scheduledDate: z.string().datetime(),
        startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        notes: z.string().optional(),
        payment: z.object({
            amount: z.number().positive(),
            paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER']),
            paidSessionsCount: z.number().positive().optional()
        }).optional()
    })
});
const createMultipleAppointmentsSchema = z.object({
    body: z.object({
        patientId: z.string().uuid(),
        packageId: z.string().uuid(),
        appointments: z.array(z.object({
            serviceId: z.string().uuid(),
            staffId: z.string().uuid(),
            roomId: z.string().uuid(),
            scheduledDate: z.string().datetime(),
            startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
            notes: z.string().optional()
        })),
        payment: z.object({
            amount: z.number().positive(),
            paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER']),
            paidSessionsCount: z.number().positive().optional()
        }).optional()
    })
});
const updateAppointmentSchema = z.object({
    body: z.object({
        staffId: z.string().uuid().optional(),
        roomId: z.string().uuid().optional(),
        scheduledDate: z.string().datetime().optional(),
        startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
        notes: z.string().optional()
    })
});
const checkAvailabilitySchema = z.object({
    query: z.object({
        date: z.string().datetime(),
        startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        duration: z.string().transform(val => parseInt(val)),
        serviceId: z.string().uuid().optional(),
        excludeAppointmentId: z.string().uuid().optional()
    })
});
const markAsPaidSchema = z.object({
    body: z.object({
        appointmentIds: z.array(z.string().uuid()),
        payment: z.object({
            amount: z.number().positive(),
            paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER']),
            notes: z.string().optional()
        })
    })
});
// Routes
router.get('/', appointmentController.getAllAppointments);
router.get('/availability', validate(checkAvailabilitySchema), appointmentController.checkAvailability);
router.get('/calendar', appointmentController.getCalendarAppointments);
router.get('/:id', appointmentController.getAppointmentById);
router.post('/', validate(createAppointmentSchema), appointmentController.createAppointment);
router.post('/multiple', validate(createMultipleAppointmentsSchema), appointmentController.createMultipleAppointments);
router.post('/mark-paid', validate(markAsPaidSchema), appointmentController.markAppointmentsAsPaid);
router.put('/:id', validate(updateAppointmentSchema), appointmentController.updateAppointment);
router.delete('/:id', appointmentController.deleteAppointment);
// Admin routes
router.delete('/bulk', authorize([Role.ADMIN]), appointmentController.bulkDeleteAppointments);
export default router;
//# sourceMappingURL=appointments.js.map