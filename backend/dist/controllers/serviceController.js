import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuditService } from '../services/auditService';
const prisma = new PrismaClient();
// Validation schemas
const createServiceSchema = z.object({
    name: z.string().min(1, 'Name is required'), // German name (primary language)
    description: z.string().optional(),
    duration: z.number().min(1, 'Duration must be at least 1 minute'),
    price: z.number().min(0, 'Price must be positive'),
    category: z.enum(['MASSAGE', 'PHYSIOTHERAPY', 'INFRARED_CHAIR', 'TRAINING', 'HEILMASSAGE', 'COMBINATION', 'VOUCHER']),
    categoryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
    isForChildren: z.boolean().optional().default(false),
    isVoucher: z.boolean().optional().default(false),
});
const updateServiceSchema = createServiceSchema.partial();
const querySchema = z.object({
    page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1)).optional().default(1),
    limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(100)).optional().default(10),
    search: z.string().optional(),
    category: z.enum(['MASSAGE', 'PHYSIOTHERAPY', 'INFRARED_CHAIR', 'TRAINING', 'HEILMASSAGE', 'COMBINATION', 'VOUCHER']).optional(),
    isActive: z.enum(['true', 'false', 'all']).optional(),
    isForChildren: z.enum(['true', 'false', 'all']).optional(),
    isVoucher: z.enum(['true', 'false', 'all']).optional(),
    sortBy: z.enum(['name', 'createdAt', 'price', 'duration', 'category']).optional().default('name'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});
// Get all services with pagination and filters
export const getServices = async (req, res) => {
    try {
        const query = querySchema.parse(req.query);
        // Build where clause
        const where = {};
        // Add isActive filter
        if (query.isActive) {
            if (query.isActive === 'all') {
                // Show both active and inactive services - don't add isActive filter
            }
            else {
                where.isActive = query.isActive === 'true';
            }
        }
        else {
            // Default to showing active services only when no filter specified
            where.isActive = true;
        }
        // Add search filter
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        // Add category filter
        if (query.category) {
            where.category = query.category;
        }
        // Add isForChildren filter
        if (query.isForChildren && query.isForChildren !== 'all') {
            where.isForChildren = query.isForChildren === 'true';
        }
        // Add isVoucher filter
        if (query.isVoucher && query.isVoucher !== 'all') {
            where.isVoucher = query.isVoucher === 'true';
        }
        // Calculate pagination
        const skip = (query.page - 1) * query.limit;
        // Get services with pagination
        const [services, total] = await Promise.all([
            prisma.service.findMany({
                where,
                orderBy: {
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
            prisma.service.count({ where }),
        ]);
        // Calculate pagination info
        const pages = Math.ceil(total / query.limit);
        res.json({
            success: true,
            data: services,
            pagination: {
                page: query.page,
                limit: query.limit,
                total,
                pages,
            },
        });
    }
    catch (error) {
        console.error('Error fetching services:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid query parameters',
                details: error.errors,
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to fetch services',
        });
    }
};
// Get single service by ID
export const getServiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const service = await prisma.service.findUnique({
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
                packageItems: {
                    include: {
                        package: {
                            include: {
                                patient: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                    },
                                },
                            },
                        },
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
        if (!service) {
            return res.status(404).json({
                success: false,
                error: 'Service not found',
            });
        }
        res.json({
            success: true,
            data: service,
        });
    }
    catch (error) {
        console.error('Error fetching service:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch service',
        });
    }
};
// Create new service
export const createService = async (req, res) => {
    try {
        const data = createServiceSchema.parse(req.body);
        // Get user ID from request for audit tracking
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
        }
        // Set default color based on category if not provided
        const defaultColors = {
            MASSAGE: '#10B981',
            PHYSIOTHERAPY: '#3B82F6',
            INFRARED_CHAIR: '#8B5CF6',
            TRAINING: '#F59E0B',
            HEILMASSAGE: '#6366F1',
            COMBINATION: '#14B8A6',
            VOUCHER: '#EC4899',
        };
        const serviceData = {
            ...data,
            categoryColor: data.categoryColor || defaultColors[data.category],
            createdById: userId,
        };
        const service = await prisma.service.create({
            data: serviceData,
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
        await AuditService.logCreate(req, 'Service', service.id, AuditService.cleanSensitiveData(service), `Created service: ${service.name}`);
        res.status(201).json({
            success: true,
            data: service,
            message: 'Service created successfully',
        });
    }
    catch (error) {
        console.error('Error creating service:', error);
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
            let message = 'A service with this name already exists.';
            if (Array.isArray(target) && target.includes('name')) {
                message = 'Ein Service mit diesem Namen existiert bereits.';
            }
            return res.status(409).json({
                success: false,
                error: message,
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to create service',
        });
    }
};
// Update service
export const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const data = updateServiceSchema.parse(req.body);
        // Get user ID from request for audit tracking
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
        }
        // Check if service exists
        const existingService = await prisma.service.findUnique({
            where: { id },
        });
        if (!existingService) {
            return res.status(404).json({
                success: false,
                error: 'Service not found',
            });
        }
        const serviceData = {
            ...data,
            modifiedById: userId,
        };
        const service = await prisma.service.update({
            where: { id },
            data: serviceData,
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
        await AuditService.logUpdate(req, 'Service', service.id, AuditService.cleanSensitiveData(existingService), AuditService.cleanSensitiveData(service), `Updated service: ${service.name}`);
        res.json({
            success: true,
            data: service,
            message: 'Service updated successfully',
        });
    }
    catch (error) {
        console.error('Error updating service:', error);
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
            let message = 'Another service with this name already exists.';
            if (Array.isArray(target) && target.includes('name')) {
                message = 'Ein anderer Service mit diesem Namen existiert bereits.';
            }
            return res.status(409).json({
                success: false,
                error: message,
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to update service',
        });
    }
};
// Soft delete service (set isActive to false)
export const deleteService = async (req, res) => {
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
        // Check if service exists
        const existingService = await prisma.service.findUnique({
            where: { id },
        });
        if (!existingService) {
            return res.status(404).json({
                success: false,
                error: 'Service not found',
            });
        }
        // Check if service is being used in active appointments or packages
        const activeUsage = await prisma.appointment.count({
            where: {
                serviceId: id,
                status: { in: ['SCHEDULED'] }
            }
        });
        if (activeUsage > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete service with active appointments. Please reschedule or cancel appointments first.',
            });
        }
        // Soft delete by setting isActive to false
        await prisma.service.update({
            where: { id },
            data: {
                isActive: false,
                modifiedById: userId,
            },
        });
        // Log the deletion in audit trail
        await AuditService.logDelete(req, 'Service', id, AuditService.cleanSensitiveData(existingService), `Soft deleted service: ${existingService.name}`);
        res.json({
            success: true,
            message: 'Service deactivated successfully',
        });
    }
    catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete service',
        });
    }
};
// Bulk delete services (soft delete)
export const bulkDeleteServices = async (req, res) => {
    try {
        const { serviceIds } = req.body;
        // Validate input
        if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Service IDs array is required and cannot be empty',
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
        // Verify all services exist
        const existingServices = await prisma.service.findMany({
            where: {
                id: { in: serviceIds },
                isActive: true
            },
            select: { id: true, name: true }
        });
        if (existingServices.length !== serviceIds.length) {
            const foundIds = existingServices.map(s => s.id);
            const notFoundIds = serviceIds.filter(id => !foundIds.includes(id));
            return res.status(404).json({
                success: false,
                error: `Some services not found: ${notFoundIds.join(', ')}`,
            });
        }
        // Check for active usage
        const activeUsage = await prisma.appointment.count({
            where: {
                serviceId: { in: serviceIds },
                status: { in: ['SCHEDULED'] }
            }
        });
        if (activeUsage > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete services with active appointments. Please reschedule or cancel appointments first.',
            });
        }
        // Perform bulk soft delete
        const updateResult = await prisma.service.updateMany({
            where: {
                id: { in: serviceIds },
                isActive: true
            },
            data: {
                isActive: false,
                modifiedById: userId,
            },
        });
        // Log each deletion in audit trail
        for (const service of existingServices) {
            await AuditService.logDelete(req, 'Service', service.id, AuditService.cleanSensitiveData(service), `Bulk soft deleted service: ${service.name}`);
        }
        res.json({
            success: true,
            message: `Successfully deleted ${updateResult.count} services`,
            deletedCount: updateResult.count,
        });
    }
    catch (error) {
        console.error('Error bulk deleting services:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete services',
        });
    }
};
// Reactivate service (set isActive to true)
export const reactivateService = async (req, res) => {
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
                error: 'Admin or moderator role required to reactivate services',
            });
        }
        // Check if service exists
        const existingService = await prisma.service.findUnique({
            where: { id },
        });
        if (!existingService) {
            return res.status(404).json({
                success: false,
                error: 'Service not found',
            });
        }
        if (existingService.isActive) {
            return res.status(400).json({
                success: false,
                error: 'Service is already active',
            });
        }
        // Reactivate service by setting isActive to true
        const reactivatedService = await prisma.service.update({
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
        await AuditService.logUpdate(req, 'Service', id, AuditService.cleanSensitiveData(existingService), AuditService.cleanSensitiveData(reactivatedService), `Reactivated service: ${existingService.name}`);
        res.json({
            success: true,
            data: reactivatedService,
            message: 'Service reactivated successfully',
        });
    }
    catch (error) {
        console.error('Error reactivating service:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reactivate service',
        });
    }
};
// Search services
export const searchServices = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Search query is required',
            });
        }
        const services = await prisma.service.findMany({
            where: {
                isActive: true,
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { description: { contains: q, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                name: true, // German name (primary language)
                duration: true,
                price: true,
                category: true,
                categoryColor: true,
                isForChildren: true,
                isVoucher: true,
            },
            take: 10, // Limit search results
            orderBy: {
                name: 'asc',
            },
        });
        res.json({
            success: true,
            data: services,
        });
    }
    catch (error) {
        console.error('Error searching services:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search services',
        });
    }
};
// Get service statistics
export const getServiceStats = async (req, res) => {
    try {
        const [totalServices, activeServices, totalCategories, mostBookedServices, revenueByService] = await Promise.all([
            prisma.service.count(),
            prisma.service.count({ where: { isActive: true } }),
            prisma.service.groupBy({
                by: ['category'],
                _count: {
                    category: true,
                },
            }),
            prisma.appointment.groupBy({
                by: ['serviceId'],
                _count: {
                    serviceId: true,
                },
                orderBy: {
                    _count: {
                        serviceId: 'desc',
                    },
                },
                take: 5,
            }),
            prisma.appointment.groupBy({
                by: ['serviceId'],
                where: {
                    status: 'COMPLETED',
                },
                _count: {
                    serviceId: true,
                },
            }),
        ]);
        // Get service details for most booked services
        const serviceIds = mostBookedServices.map(item => item.serviceId);
        const serviceDetails = await prisma.service.findMany({
            where: {
                id: { in: serviceIds },
            },
            select: {
                id: true,
                name: true,
                price: true,
            },
        });
        // Combine booking data with service details
        const mostBookedWithDetails = mostBookedServices.map(booking => {
            const service = serviceDetails.find(s => s.id === booking.serviceId);
            return {
                ...booking,
                serviceName: service?.name,
                servicePrice: service?.price,
            };
        });
        const stats = {
            total: totalServices,
            active: activeServices,
            inactive: totalServices - activeServices,
            categories: totalCategories.length,
            categoryBreakdown: totalCategories,
            mostBooked: mostBookedWithDetails,
        };
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        console.error('Error fetching service stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch service statistics',
        });
    }
};
//# sourceMappingURL=serviceController.js.map