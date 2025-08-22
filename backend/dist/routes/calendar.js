import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { calendarController } from '../controllers/calendarController.js';
const router = Router();
// All routes require authentication
router.use(authenticateToken);
// Calendar settings routes
router.get('/settings/:userId?', calendarController.getCalendarSettings);
router.put('/settings/:userId?', calendarController.updateCalendarSettings);
// Schedule data routes
router.get('/daily-schedule', calendarController.getDailySchedule);
router.get('/staff-availability', calendarController.getStaffAvailability);
// Conflict checking
router.post('/check-conflicts', calendarController.checkConflicts);
export default router;
//# sourceMappingURL=calendar.js.map