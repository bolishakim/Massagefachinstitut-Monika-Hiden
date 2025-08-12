import express from 'express';
import { getServices, getServiceById, createService, updateService, deleteService, bulkDeleteServices, reactivateService, searchServices, getServiceStats, } from '../controllers/serviceController';
import { authenticateToken } from '../middleware/auth';
import { validateRole } from '../middleware/validate';
const router = express.Router();
// All service routes require authentication
router.use(authenticateToken);
// GET /api/services - Get all services with pagination and filters
router.get('/', getServices);
// GET /api/services/search - Search services
router.get('/search', searchServices);
// GET /api/services/stats - Get service statistics (admin/moderator only)
router.get('/stats', validateRole(['ADMIN', 'MODERATOR']), getServiceStats);
// GET /api/services/:id - Get service by ID
router.get('/:id', getServiceById);
// POST /api/services - Create new service (admin/moderator only)
router.post('/', validateRole(['ADMIN', 'MODERATOR']), createService);
// PUT /api/services/:id - Update service (admin/moderator only)
router.put('/:id', validateRole(['ADMIN', 'MODERATOR']), updateService);
// POST /api/services/bulk-delete - Bulk soft delete services (admin/moderator only)
router.post('/bulk-delete', validateRole(['ADMIN', 'MODERATOR']), bulkDeleteServices);
// POST /api/services/:id/reactivate - Reactivate service (admin/moderator only)
router.post('/:id/reactivate', validateRole(['ADMIN', 'MODERATOR']), reactivateService);
// DELETE /api/services/:id - Soft delete service (admin/moderator only)
router.delete('/:id', validateRole(['ADMIN', 'MODERATOR']), deleteService);
export default router;
//# sourceMappingURL=services.js.map