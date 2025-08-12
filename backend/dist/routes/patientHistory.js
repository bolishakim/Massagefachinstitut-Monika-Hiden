import express from 'express';
import { getPatientHistory, getPatientHistoryById, createPatientHistory, updatePatientHistory, deletePatientHistory, } from '../controllers/patientHistoryController';
import { authenticateToken } from '../middleware/auth';
import { validateRole } from '../middleware/validate';
const router = express.Router();
// All patient history routes require authentication
router.use(authenticateToken);
// GET /api/patient-history - Get all patient history entries with pagination and filters
router.get('/', getPatientHistory);
// GET /api/patient-history/:id - Get patient history entry by ID
router.get('/:id', getPatientHistoryById);
// POST /api/patient-history - Create new patient history entry
router.post('/', createPatientHistory);
// PUT /api/patient-history/:id - Update patient history entry
router.put('/:id', updatePatientHistory);
// DELETE /api/patient-history/:id - Delete patient history entry (admin/moderator only)
router.delete('/:id', validateRole(['ADMIN', 'MODERATOR']), deletePatientHistory);
export default router;
//# sourceMappingURL=patientHistory.js.map