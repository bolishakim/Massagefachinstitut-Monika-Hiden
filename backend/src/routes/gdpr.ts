import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  recordConsent,
  recordBulkConsent,
  getUserConsent,
  exportUserData,
  downloadExport,
  requestAccountDeletion,
  getComplianceInfo,
  recordAnonymousConsent,
  requestPatientDeletion,
  bulkDeletePatients,
  exportPatientData,
  downloadPatientExport,
} from '../controllers/gdprController.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/compliance-info', getComplianceInfo);
router.post('/anonymous-consent', recordAnonymousConsent);

// Authenticated routes
router.use(authenticateToken);

// Consent management
router.post('/consent', recordConsent);
router.post('/consent/bulk', recordBulkConsent);
router.get('/consent', getUserConsent);

// Data portability (Article 20)
router.post('/export-data', exportUserData);
router.get('/download-export/:filename', downloadExport);

// Right to erasure (Article 17)
router.delete('/delete-account', requestAccountDeletion);

// Patient-specific GDPR operations
router.post('/patient/:patientId/export', exportPatientData);
router.delete('/patient/:patientId', requestPatientDeletion);
router.post('/patients/bulk-delete', bulkDeletePatients);
router.get('/download-patient-export/:filename', downloadPatientExport);

export default router;