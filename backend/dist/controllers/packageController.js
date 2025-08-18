import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuditService } from '../services/auditService';
const prisma = new PrismaClient();
// Validation schemas
const createPackageSchema = z.object({
    patientId: z.string().uuid('Invalid patient ID'),
    name: z.string().min(1, 'Package name is required'),
    totalPrice: z.number().positive('Total price must be positive'),
    discountAmount: z.number().min(0, 'Discount cannot be negative').optional(),
    finalPrice: z.number().positive('Final price must be positive'),
    packageItems: z.array(z.object({
        serviceId: z.string().uuid('Invalid service ID'),
        sessionCount: z.number().int().positive('Session count must be positive'),
    })).min(1, 'At least one service must be added'),
    payment: z.object({
        amount: z.number().positive('Payment amount must be positive'),
        paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER']),
        paidSessionsCount: z.number().int().min(0).optional(),
        notes: z.string().optional(),
    }).optional(),
});
const updatePackageSchema = z.object({
    name: z.string().min(1).optional(),
    totalPrice: z.number().positive().optional(),
    discountAmount: z.number().min(0).optional(),
    finalPrice: z.number().positive().optional(),
    status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
});
const querySchema = z.object({
    page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1)).optional().default(1),
    limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(100)).optional().default(20),
    patientId: z.string().uuid().optional(),
    status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED', 'ALL']).optional(),
    search: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    sortBy: z.enum(['createdAt', 'finalPrice', 'name']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
// Get all packages with pagination and filters
export const getPackages = async (req, res) => {
    try {
        const query = querySchema.parse(req.query);
        // Build where clause
        const where = {};
        // Filter by patient if specified
        if (query.patientId) {
            where.patientId = query.patientId;
        }
        // Filter by status
        if (query.status && query.status !== 'ALL') {
            where.status = query.status;
        }
        // Add search filter
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { patient: {
                        OR: [
                            { firstName: { contains: query.search, mode: 'insensitive' } },
                            { lastName: { contains: query.search, mode: 'insensitive' } }
                        ]
                    } },
            ];
        }
        // Add date range filter
        if (query.startDate || query.endDate) {
            where.createdAt = {};
            if (query.startDate) {
                where.createdAt.gte = new Date(query.startDate);
            }
            if (query.endDate) {
                where.createdAt.lte = new Date(query.endDate);
            }
        }
        // Calculate pagination
        const skip = (query.page - 1) * query.limit;
        // Get packages with pagination
        const [packages, total] = await Promise.all([
            prisma.package.findMany({
                where,
                orderBy: {
                    [query.sortBy]: query.sortOrder,
                },
                skip,
                take: query.limit,
                include: {
                    patient: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            insuranceType: true,
                        }
                    },
                    packageItems: {
                        include: {
                            service: {
                                select: {
                                    id: true,
                                    name: true, // German name (primary language)
                                    price: true,
                                    category: true,
                                }
                            }
                        }
                    },
                    payments: {
                        select: {
                            id: true,
                            amount: true,
                            paymentMethod: true,
                            status: true,
                            paidAt: true,
                        },
                        orderBy: {
                            createdAt: 'desc'
                        }
                    },
                    _count: {
                        select: {
                            appointments: true
                        }
                    }
                },
            }),
            prisma.package.count({ where }),
        ]);
        // Calculate session usage statistics
        const packagesWithStats = await Promise.all(packages.map(async (pkg) => {
            const totalSessions = pkg.packageItems.reduce((sum, item) => sum + item.sessionCount, 0);
            const usedSessions = pkg.packageItems.reduce((sum, item) => sum + item.completedCount, 0);
            return {
                ...pkg,
                totalSessions,
                usedSessions,
                remainingSessions: totalSessions - usedSessions,
                usagePercentage: totalSessions > 0 ? Math.round((usedSessions / totalSessions) * 100) : 0,
                totalPaid: pkg.payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
            };
        }));
        res.json({
            success: true,
            data: packagesWithStats,
            pagination: {
                page: query.page,
                limit: query.limit,
                total,
                pages: Math.ceil(total / query.limit),
            },
        });
    }
    catch (error) {
        console.error('Error fetching packages:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid query parameters',
                details: error.errors,
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to fetch packages',
        });
    }
};
// Get single package by ID
export const getPackageById = async (req, res) => {
    try {
        const { id } = req.params;
        const packageData = await prisma.package.findUnique({
            where: { id },
            include: {
                patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        email: true,
                        insuranceType: true,
                    }
                },
                packageItems: {
                    include: {
                        service: {
                            select: {
                                id: true,
                                name: true, // German name (primary language)
                                price: true,
                                category: true,
                                duration: true,
                            }
                        }
                    }
                },
                payments: {
                    include: {
                        createdBy: {
                            select: {
                                firstName: true,
                                lastName: true,
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                appointments: {
                    include: {
                        service: {
                            select: {
                                name: true, // German name (primary language)
                            }
                        },
                        staff: {
                            select: {
                                firstName: true,
                                lastName: true,
                            }
                        }
                    },
                    orderBy: {
                        scheduledDate: 'desc'
                    }
                },
                createdBy: {
                    select: {
                        firstName: true,
                        lastName: true,
                    }
                }
            },
        });
        if (!packageData) {
            return res.status(404).json({
                success: false,
                error: 'Package not found',
            });
        }
        // Calculate statistics
        const totalSessions = packageData.packageItems.reduce((sum, item) => sum + item.sessionCount, 0);
        const usedSessions = packageData.packageItems.reduce((sum, item) => sum + item.completedCount, 0);
        const totalPaid = packageData.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
        const packageWithStats = {
            ...packageData,
            totalSessions,
            usedSessions,
            remainingSessions: totalSessions - usedSessions,
            usagePercentage: totalSessions > 0 ? Math.round((usedSessions / totalSessions) * 100) : 0,
            totalPaid,
            remainingBalance: Number(packageData.finalPrice) - totalPaid,
        };
        res.json({
            success: true,
            data: packageWithStats,
        });
    }
    catch (error) {
        console.error('Error fetching package:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch package',
        });
    }
};
// Create new package
export const createPackage = async (req, res) => {
    try {
        const data = createPackageSchema.parse(req.body);
        // Get user ID from request for audit tracking
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
        }
        // Verify patient exists
        const patient = await prisma.patient.findUnique({
            where: { id: data.patientId },
            select: { id: true, firstName: true, lastName: true }
        });
        if (!patient) {
            return res.status(400).json({
                success: false,
                error: 'Patient not found',
            });
        }
        // Verify all services exist
        const serviceIds = data.packageItems.map(item => item.serviceId);
        const services = await prisma.service.findMany({
            where: { id: { in: serviceIds }, isActive: true },
            select: { id: true, name: true, price: true }
        });
        if (services.length !== serviceIds.length) {
            return res.status(400).json({
                success: false,
                error: 'One or more services not found or inactive',
            });
        }
        // Create package with items in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create the package record
            const packageResult = await tx.package.create({
                data: {
                    patientId: data.patientId,
                    name: data.name,
                    totalPrice: data.totalPrice,
                    discountAmount: data.discountAmount || 0,
                    finalPrice: data.finalPrice,
                    createdById: userId,
                },
                include: {
                    patient: {
                        select: {
                            firstName: true,
                            lastName: true,
                        }
                    }
                }
            });
            // Create package items
            await tx.packageItem.createMany({
                data: data.packageItems.map(item => ({
                    packageId: packageResult.id,
                    serviceId: item.serviceId,
                    sessionCount: item.sessionCount,
                }))
            });
            // Create payment if provided
            if (data.payment) {
                await tx.payment.create({
                    data: {
                        patientId: data.patientId,
                        packageId: packageResult.id,
                        amount: data.payment.amount,
                        paymentMethod: data.payment.paymentMethod,
                        paidSessionsCount: data.payment.paidSessionsCount || null,
                        notes: data.payment.notes || null,
                        status: 'COMPLETED',
                        paidAt: new Date(),
                        createdById: userId,
                    }
                });
            }
            return packageResult;
        });
        // Log the creation in audit trail
        await AuditService.logCreate(req, 'Package', result.id, AuditService.cleanSensitiveData(result), `Created package "${result.name}" for: ${result.patient.firstName} ${result.patient.lastName}`);
        res.status(201).json({
            success: true,
            data: result,
            message: 'Package created successfully',
        });
    }
    catch (error) {
        console.error('Error creating package:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid package data',
                details: error.errors,
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to create package',
        });
    }
};
// Update package
export const updatePackage = async (req, res) => {
    try {
        const { id } = req.params;
        const data = updatePackageSchema.parse(req.body);
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
        }
        // Check if package exists
        const existingPackage = await prisma.package.findUnique({
            where: { id },
            include: {
                patient: {
                    select: {
                        firstName: true,
                        lastName: true,
                    }
                }
            }
        });
        if (!existingPackage) {
            return res.status(404).json({
                success: false,
                error: 'Package not found',
            });
        }
        const updatedPackage = await prisma.package.update({
            where: { id },
            data,
            include: {
                patient: {
                    select: {
                        firstName: true,
                        lastName: true,
                    }
                }
            }
        });
        // Log the update in audit trail
        await AuditService.logUpdate(req, 'Package', id, AuditService.cleanSensitiveData(existingPackage), AuditService.cleanSensitiveData(updatedPackage), `Updated package "${updatedPackage.name}" for: ${updatedPackage.patient.firstName} ${updatedPackage.patient.lastName}`);
        res.json({
            success: true,
            data: updatedPackage,
            message: 'Package updated successfully',
        });
    }
    catch (error) {
        console.error('Error updating package:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid package data',
                details: error.errors,
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to update package',
        });
    }
};
// Cancel package
export const cancelPackage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
        }
        const packageData = await prisma.package.findUnique({
            where: { id },
            include: {
                patient: {
                    select: {
                        firstName: true,
                        lastName: true,
                    }
                }
            }
        });
        if (!packageData) {
            return res.status(404).json({
                success: false,
                error: 'Package not found',
            });
        }
        if (packageData.status === 'CANCELLED') {
            return res.status(400).json({
                success: false,
                error: 'Package is already cancelled',
            });
        }
        const updatedPackage = await prisma.package.update({
            where: { id },
            data: { status: 'CANCELLED' },
            include: {
                patient: {
                    select: {
                        firstName: true,
                        lastName: true,
                    }
                }
            }
        });
        // Log the cancellation in audit trail
        await AuditService.logUpdate(req, 'Package', id, { status: packageData.status }, { status: 'CANCELLED' }, `Cancelled package "${updatedPackage.name}" for: ${updatedPackage.patient.firstName} ${updatedPackage.patient.lastName}`);
        res.json({
            success: true,
            data: updatedPackage,
            message: 'Package cancelled successfully',
        });
    }
    catch (error) {
        console.error('Error cancelling package:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cancel package',
        });
    }
};
// Add payment to package
export const addPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, paymentMethod, paidSessionsCount, notes } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
        }
        // Validate input
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid payment amount is required',
            });
        }
        if (!['CASH', 'CARD', 'BANK_TRANSFER'].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid payment method',
            });
        }
        const packageData = await prisma.package.findUnique({
            where: { id },
            include: {
                patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                },
                payments: true,
            }
        });
        if (!packageData) {
            return res.status(404).json({
                success: false,
                error: 'Package not found',
            });
        }
        const totalPaid = packageData.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
        const remainingBalance = Number(packageData.finalPrice) - totalPaid;
        if (amount > remainingBalance) {
            return res.status(400).json({
                success: false,
                error: `Payment amount exceeds remaining balance of €${remainingBalance.toFixed(2)}`,
            });
        }
        const payment = await prisma.payment.create({
            data: {
                patientId: packageData.patientId,
                packageId: id,
                amount,
                paymentMethod,
                paidSessionsCount,
                notes,
                status: 'COMPLETED',
                paidAt: new Date(),
                createdById: userId,
            },
            include: {
                createdBy: {
                    select: {
                        firstName: true,
                        lastName: true,
                    }
                }
            }
        });
        // Log the payment in audit trail
        await AuditService.logCreate(req, 'Payment', payment.id, AuditService.cleanSensitiveData(payment), `Added payment of €${amount} for package "${packageData.name}" - ${packageData.patient.firstName} ${packageData.patient.lastName}`);
        res.status(201).json({
            success: true,
            data: payment,
            message: 'Payment added successfully',
        });
    }
    catch (error) {
        console.error('Error adding payment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add payment',
        });
    }
};
// Get package statistics
export const getPackageStats = async (req, res) => {
    try {
        const [totalPackages, activePackages, completedPackages, cancelledPackages, totalRevenue, thisMonthRevenue] = await Promise.all([
            prisma.package.count(),
            prisma.package.count({ where: { status: 'ACTIVE' } }),
            prisma.package.count({ where: { status: 'COMPLETED' } }),
            prisma.package.count({ where: { status: 'CANCELLED' } }),
            prisma.payment.aggregate({
                _sum: { amount: true },
                where: { status: 'COMPLETED' }
            }),
            prisma.payment.aggregate({
                _sum: { amount: true },
                where: {
                    status: 'COMPLETED',
                    paidAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                    }
                }
            })
        ]);
        res.json({
            success: true,
            data: {
                totalPackages,
                activePackages,
                completedPackages,
                cancelledPackages,
                totalRevenue: Number(totalRevenue._sum.amount || 0),
                thisMonthRevenue: Number(thisMonthRevenue._sum.amount || 0),
            },
        });
    }
    catch (error) {
        console.error('Error fetching package stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch package statistics',
        });
    }
};
//# sourceMappingURL=packageController.js.map