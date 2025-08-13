import express from 'express';
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  bulkDeletePatients,
  reactivatePatient,
  searchPatients,
} from '../controllers/patientController';
import { authenticateToken } from '../middleware/auth';
import { validateRole } from '../middleware/validate';
const router = express.Router();

// All patient routes require authentication
// Note: Enhanced audit logging is applied globally to all /api routes
router.use(authenticateToken);

// GET /api/patients - Get all patients with pagination and filters
router.get('/', getPatients);

// GET /api/patients/search - Search patients
router.get('/search', searchPatients);

// GET /api/patients/:id - Get patient by ID
router.get('/:id', getPatientById);

// POST /api/patients - Create new patient
router.post('/', createPatient);

// PUT /api/patients/:id - Update patient
router.put('/:id', updatePatient);

// POST /api/patients/bulk-delete - Bulk soft delete patients (admin only)
router.post('/bulk-delete', validateRole(['ADMIN']), bulkDeletePatients);

// POST /api/patients/:id/reactivate - Reactivate patient (admin/moderator only)
router.post('/:id/reactivate', validateRole(['ADMIN', 'MODERATOR']), reactivatePatient);

// DELETE /api/patients/:id - Soft delete patient (admin/moderator only)
router.delete('/:id', validateRole(['ADMIN', 'MODERATOR']), deletePatient);

export default router;