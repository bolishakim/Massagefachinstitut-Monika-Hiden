import express from 'express';
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  bulkDeleteRooms,
  reactivateRoom,
  searchRooms,
  getRoomStats,
  getRoomAvailability,
} from '../controllers/roomController';
import { authenticateToken } from '../middleware/auth';
import { validateRole } from '../middleware/validate';

const router = express.Router();

// All room routes require authentication
router.use(authenticateToken);

// GET /api/rooms - Get all rooms with pagination and filters
router.get('/', getRooms);

// GET /api/rooms/search - Search rooms
router.get('/search', searchRooms);

// GET /api/rooms/stats - Get room statistics (admin/moderator only)
router.get('/stats', validateRole(['ADMIN', 'MODERATOR']), getRoomStats);

// GET /api/rooms/availability - Get room availability for date range
router.get('/availability', getRoomAvailability);

// GET /api/rooms/:id - Get room by ID
router.get('/:id', getRoomById);

// POST /api/rooms - Create new room (admin/moderator only)
router.post('/', validateRole(['ADMIN', 'MODERATOR']), createRoom);

// PUT /api/rooms/:id - Update room (admin/moderator only)
router.put('/:id', validateRole(['ADMIN', 'MODERATOR']), updateRoom);

// POST /api/rooms/bulk-delete - Bulk soft delete rooms (admin/moderator only)
router.post('/bulk-delete', validateRole(['ADMIN', 'MODERATOR']), bulkDeleteRooms);

// POST /api/rooms/:id/reactivate - Reactivate room (admin/moderator only)
router.post('/:id/reactivate', validateRole(['ADMIN', 'MODERATOR']), reactivateRoom);

// DELETE /api/rooms/:id - Soft delete room (admin/moderator only)
router.delete('/:id', validateRole(['ADMIN', 'MODERATOR']), deleteRoom);

export default router;