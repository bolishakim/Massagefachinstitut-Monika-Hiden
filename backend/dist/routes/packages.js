import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getPackages, getPackageById, createPackage, updatePackage, cancelPackage, addPayment, getPackageStats } from '../controllers/packageController';
const router = express.Router();
// All package routes require authentication
router.use(authenticateToken);
// Package CRUD routes
router.get('/', getPackages);
router.get('/stats', getPackageStats);
router.get('/:id', getPackageById);
router.post('/', createPackage);
router.put('/:id', updatePackage);
router.patch('/:id/cancel', cancelPackage);
router.post('/:id/payments', addPayment);
export default router;
//# sourceMappingURL=packages.js.map