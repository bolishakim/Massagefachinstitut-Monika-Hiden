import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuditService } from '../services/auditService';
const prisma = new PrismaClient();
// Validation schemas
const createRoomSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    features: z.array(z.string()).optional().default([]),
    capacity: z.number().min(1, 'Capacity must be at least 1').optional().default(1),
});
const updateRoomSchema = createRoomSchema.partial();
const querySchema = z.object({
    page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1)).optional().default(1),
    limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(100)).optional().default(10),
    search: z.string().optional(),
    isActive: z.enum(['true', 'false', 'all']).optional(),
    capacity: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1)).optional(),
    minCapacity: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1)).optional(),
    maxCapacity: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1)).optional(),
    sortBy: z.enum(['name', 'createdAt', 'capacity', 'features']).optional().default('name'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});
// Get all rooms with pagination and filters
export const getRooms = async (req, res) => {
    try {
        const query = querySchema.parse(req.query);
        // Build where clause
        const where = {};
        // Add isActive filter
        if (query.isActive) {
            if (query.isActive === 'all') {
                // Show both active and inactive rooms - don't add isActive filter
            }
            else {
                where.isActive = query.isActive === 'true';
            }
        }
        else {
            // Default to showing active rooms only when no filter specified
            where.isActive = true;
        }
        // Add search filter
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
                { features: { has: query.search } },
            ];
        }
        // Add capacity filters
        if (query.capacity) {
            where.capacity = query.capacity;
        }
        if (query.minCapacity && query.maxCapacity) {
            where.capacity = {
                gte: query.minCapacity,
                lte: query.maxCapacity,
            };
        }
        else if (query.minCapacity) {
            where.capacity = { gte: query.minCapacity };
        }
        else if (query.maxCapacity) {
            where.capacity = { lte: query.maxCapacity };
        }
        // Calculate pagination
        const skip = (query.page - 1) * query.limit;
        // Get rooms with pagination
        const [rooms, total] = await Promise.all([
            prisma.room.findMany({
                where,
                orderBy: query.sortBy === 'features'
                    ? { id: query.sortOrder } // Default sort for features since it's an array
                    : {
                        [query.sortBy]: query.sortOrder,
                    },
                skip,
                take: query.limit,
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    modifiedBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            }),
            prisma.room.count({ where }),
        ]);
        // Calculate pagination info
        const pages = Math.ceil(total / query.limit);
        res.json({
            success: true,
            data: rooms,
            pagination: {
                page: query.page,
                limit: query.limit,
                total,
                pages,
            },
        });
    }
    catch (error) {
        console.error('Error fetching rooms:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid query parameters',
                details: error.errors,
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to fetch rooms',
        });
    }
};
// Get single room by ID
export const getRoomById = async (req, res) => {
    try {
        const { id } = req.params;
        const room = await prisma.room.findUnique({
            where: { id },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                modifiedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                appointments: {
                    include: {
                        patient: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                        service: {
                            select: {
                                id: true,
                                name: true,
                                duration: true,
                            },
                        },
                        staff: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                    orderBy: {
                        scheduledDate: 'desc',
                    },
                },
            },
        });
        if (!room) {
            return res.status(404).json({
                success: false,
                error: 'Room not found',
            });
        }
        res.json({
            success: true,
            data: room,
        });
    }
    catch (error) {
        console.error('Error fetching room:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch room',
        });
    }
};
// Create new room
export const createRoom = async (req, res) => {
    try {
        const data = createRoomSchema.parse(req.body);
        // Get user ID from request for audit tracking
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
        }
        const roomData = {
            ...data,
            createdById: userId,
        };
        const room = await prisma.room.create({
            data: roomData,
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        // Log the creation in audit trail
        await AuditService.logCreate(req, 'Room', room.id, AuditService.cleanSensitiveData(room), `Created room: ${room.name}`);
        res.status(201).json({
            success: true,
            data: room,
            message: 'Room created successfully',
        });
    }
    catch (error) {
        console.error('Error creating room:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors,
            });
        }
        // Handle unique constraint violations
        if (error.code === 'P2002') {
            const target = error.meta?.target;
            let message = 'A room with this name already exists.';
            if (Array.isArray(target) && target.includes('name')) {
                message = 'Ein Behandlungsraum mit diesem Namen existiert bereits.';
            }
            return res.status(409).json({
                success: false,
                error: message,
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to create room',
        });
    }
};
// Update room
export const updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const data = updateRoomSchema.parse(req.body);
        // Get user ID from request for audit tracking
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
        }
        // Check if room exists
        const existingRoom = await prisma.room.findUnique({
            where: { id },
        });
        if (!existingRoom) {
            return res.status(404).json({
                success: false,
                error: 'Room not found',
            });
        }
        const roomData = {
            ...data,
            modifiedById: userId,
        };
        const room = await prisma.room.update({
            where: { id },
            data: roomData,
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                modifiedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        // Log the update in audit trail
        await AuditService.logUpdate(req, 'Room', room.id, AuditService.cleanSensitiveData(existingRoom), AuditService.cleanSensitiveData(room), `Updated room: ${room.name}`);
        res.json({
            success: true,
            data: room,
            message: 'Room updated successfully',
        });
    }
    catch (error) {
        console.error('Error updating room:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors,
            });
        }
        // Handle unique constraint violations
        if (error.code === 'P2002') {
            const target = error.meta?.target;
            let message = 'Another room with this name already exists.';
            if (Array.isArray(target) && target.includes('name')) {
                message = 'Ein anderer Behandlungsraum mit diesem Namen existiert bereits.';
            }
            return res.status(409).json({
                success: false,
                error: message,
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to update room',
        });
    }
};
// Soft delete room (set isActive to false)
export const deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;
        // Get user ID from request for audit tracking
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
        }
        // Check if room exists
        const existingRoom = await prisma.room.findUnique({
            where: { id },
        });
        if (!existingRoom) {
            return res.status(404).json({
                success: false,
                error: 'Room not found',
            });
        }
        // Check if room is being used in active appointments
        const activeUsage = await prisma.appointment.count({
            where: {
                roomId: id,
                status: { in: ['SCHEDULED'] }
            }
        });
        if (activeUsage > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete room with active appointments. Please reschedule appointments first.',
            });
        }
        // Soft delete by setting isActive to false
        await prisma.room.update({
            where: { id },
            data: {
                isActive: false,
                modifiedById: userId,
            },
        });
        // Log the deletion in audit trail
        await AuditService.logDelete(req, 'Room', id, AuditService.cleanSensitiveData(existingRoom), `Soft deleted room: ${existingRoom.name}`);
        res.json({
            success: true,
            message: 'Room deactivated successfully',
        });
    }
    catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete room',
        });
    }
};
// Bulk delete rooms (soft delete)
export const bulkDeleteRooms = async (req, res) => {
    try {
        const { roomIds } = req.body;
        // Validate input
        if (!Array.isArray(roomIds) || roomIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Room IDs array is required and cannot be empty',
            });
        }
        // Get user ID from request for audit tracking
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
        }
        // Check if user has admin or moderator role
        const user = req.user;
        if (!['ADMIN', 'MODERATOR'].includes(user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Admin or moderator role required for bulk operations',
            });
        }
        // Verify all rooms exist
        const existingRooms = await prisma.room.findMany({
            where: {
                id: { in: roomIds },
                isActive: true
            },
            select: { id: true, name: true }
        });
        if (existingRooms.length !== roomIds.length) {
            const foundIds = existingRooms.map(r => r.id);
            const notFoundIds = roomIds.filter(id => !foundIds.includes(id));
            return res.status(404).json({
                success: false,
                error: `Some rooms not found: ${notFoundIds.join(', ')}`,
            });
        }
        // Check for active usage
        const activeUsage = await prisma.appointment.count({
            where: {
                roomId: { in: roomIds },
                status: { in: ['SCHEDULED'] }
            }
        });
        if (activeUsage > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete rooms with active appointments. Please reschedule appointments first.',
            });
        }
        // Perform bulk soft delete
        const updateResult = await prisma.room.updateMany({
            where: {
                id: { in: roomIds },
                isActive: true
            },
            data: {
                isActive: false,
                modifiedById: userId,
            },
        });
        // Log each deletion in audit trail
        for (const room of existingRooms) {
            await AuditService.logDelete(req, 'Room', room.id, AuditService.cleanSensitiveData(room), `Bulk soft deleted room: ${room.name}`);
        }
        res.json({
            success: true,
            message: `Successfully deleted ${updateResult.count} rooms`,
            deletedCount: updateResult.count,
        });
    }
    catch (error) {
        console.error('Error bulk deleting rooms:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete rooms',
        });
    }
};
// Reactivate room (set isActive to true)
export const reactivateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        // Get user ID from request for audit tracking
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
        }
        // Check if user has admin or moderator role
        const user = req.user;
        if (!['ADMIN', 'MODERATOR'].includes(user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Admin or moderator role required to reactivate rooms',
            });
        }
        // Check if room exists
        const existingRoom = await prisma.room.findUnique({
            where: { id },
        });
        if (!existingRoom) {
            return res.status(404).json({
                success: false,
                error: 'Room not found',
            });
        }
        if (existingRoom.isActive) {
            return res.status(400).json({
                success: false,
                error: 'Room is already active',
            });
        }
        // Reactivate room by setting isActive to true
        const reactivatedRoom = await prisma.room.update({
            where: { id },
            data: {
                isActive: true,
                modifiedById: userId,
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                modifiedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        // Log the reactivation in audit trail
        await AuditService.logUpdate(req, 'Room', id, AuditService.cleanSensitiveData(existingRoom), AuditService.cleanSensitiveData(reactivatedRoom), `Reactivated room: ${existingRoom.name}`);
        res.json({
            success: true,
            data: reactivatedRoom,
            message: 'Room reactivated successfully',
        });
    }
    catch (error) {
        console.error('Error reactivating room:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reactivate room',
        });
    }
};
// Search rooms
export const searchRooms = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Search query is required',
            });
        }
        const rooms = await prisma.room.findMany({
            where: {
                isActive: true,
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { description: { contains: q, mode: 'insensitive' } },
                    { features: { has: q } },
                ],
            },
            select: {
                id: true,
                name: true,
                description: true,
                features: true,
                capacity: true,
            },
            take: 10, // Limit search results
            orderBy: {
                name: 'asc',
            },
        });
        res.json({
            success: true,
            data: rooms,
        });
    }
    catch (error) {
        console.error('Error searching rooms:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search rooms',
        });
    }
};
// Get room statistics
export const getRoomStats = async (req, res) => {
    try {
        const [totalRooms, activeRooms, totalCapacity, mostUsedRooms, roomUtilization] = await Promise.all([
            prisma.room.count(),
            prisma.room.count({ where: { isActive: true } }),
            prisma.room.aggregate({
                where: { isActive: true },
                _sum: { capacity: true },
            }),
            prisma.appointment.groupBy({
                by: ['roomId'],
                _count: {
                    roomId: true,
                },
                orderBy: {
                    _count: {
                        roomId: 'desc',
                    },
                },
                take: 5,
            }),
            prisma.appointment.groupBy({
                by: ['roomId'],
                where: {
                    status: 'COMPLETED',
                },
                _count: {
                    roomId: true,
                },
            }),
        ]);
        // Get room details for most used rooms
        const roomIds = mostUsedRooms.map(item => item.roomId);
        const roomDetails = await prisma.room.findMany({
            where: {
                id: { in: roomIds },
            },
            select: {
                id: true,
                name: true,
                capacity: true,
            },
        });
        // Combine usage data with room details
        const mostUsedWithDetails = mostUsedRooms.map(usage => {
            const room = roomDetails.find(r => r.id === usage.roomId);
            return {
                ...usage,
                roomName: room?.name,
                roomCapacity: room?.capacity,
            };
        });
        const stats = {
            total: totalRooms,
            active: activeRooms,
            inactive: totalRooms - activeRooms,
            totalCapacity: totalCapacity._sum.capacity || 0,
            mostUsed: mostUsedWithDetails,
        };
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        console.error('Error fetching room stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch room statistics',
        });
    }
};
// Get room availability for a specific date range
export const getRoomAvailability = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Start date and end date are required',
            });
        }
        const rooms = await prisma.room.findMany({
            where: { isActive: true },
            include: {
                appointments: {
                    where: {
                        scheduledDate: {
                            gte: new Date(startDate),
                            lte: new Date(endDate),
                        },
                        status: { in: ['SCHEDULED'] },
                    },
                    select: {
                        id: true,
                        scheduledDate: true,
                        startTime: true,
                        endTime: true,
                        service: {
                            select: {
                                name: true,
                                duration: true,
                            },
                        },
                        patient: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        });
        res.json({
            success: true,
            data: rooms,
        });
    }
    catch (error) {
        console.error('Error fetching room availability:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch room availability',
        });
    }
};
//# sourceMappingURL=roomController.js.map