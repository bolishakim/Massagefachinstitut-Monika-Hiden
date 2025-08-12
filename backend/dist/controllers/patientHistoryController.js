import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuditService } from '../services/auditService';
const prisma = new PrismaClient();
// Validation schemas
const createPatientHistorySchema = z.object({
    patientId: z.string().uuid('Invalid patient ID'),
    packageId: z.string().uuid().optional(),
    appointmentId: z.string().uuid().optional(),
    // ANAMNESE (Medical History)
    mainSubjectiveProblem: z.string().optional(),
    symptomHistory: z.string().optional(),
    previousCourseAndTherapy: z.string().optional(),
    patientGoals: z.string().optional(),
    // ALLGEMEINE INSPEKTION (General Inspection)
    activityStatus: z.string().optional(),
    trunkAndHeadParticularities: z.string().optional(),
    edemaTrophicsAtrophies: z.string().optional(),
    notes: z.string().optional(),
    recordedAt: z.string().optional().transform(val => val ? new Date(val) : new Date()),
});
const updatePatientHistorySchema = createPatientHistorySchema.partial();
const querySchema = z.object({
    page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1)).optional().default(1),
    limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(100)).optional().default(20),
    patientId: z.string().uuid().optional(),
    search: z.string().optional(),
    sortBy: z.enum(['recordedAt', 'createdAt']).optional().default('recordedAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
// Get all patient history entries with pagination and filters
export const getPatientHistory = async (req, res) => {
    try {
        const query = querySchema.parse(req.query);
        // Build where clause
        const where = {};
        // Filter by patient if specified
        if (query.patientId) {
            where.patientId = query.patientId;
        }
        // Add search filter
        if (query.search) {
            where.OR = [
                { generalImpression: { contains: query.search, mode: 'insensitive' } },
                { medicalHistory: { contains: query.search, mode: 'insensitive' } },
                { mainSubjectiveProblem: { contains: query.search, mode: 'insensitive' } },
                { notes: { contains: query.search, mode: 'insensitive' } },
                { patient: {
                        OR: [
                            { firstName: { contains: query.search, mode: 'insensitive' } },
                            { lastName: { contains: query.search, mode: 'insensitive' } }
                        ]
                    } },
            ];
        }
        // Calculate pagination
        const skip = (query.page - 1) * query.limit;
        // Get patient history entries with pagination
        const [entries, total] = await Promise.all([
            prisma.patientHistory.findMany({
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
                            dateOfBirth: true,
                        }
                    },
                    package: {
                        select: {
                            id: true,
                            name: true,
                        }
                    },
                    appointment: {
                        select: {
                            id: true,
                            scheduledDate: true,
                            service: {
                                select: {
                                    name: true,
                                }
                            }
                        }
                    }
                },
            }),
            prisma.patientHistory.count({ where }),
        ]);
        // Calculate pagination info
        const pages = Math.ceil(total / query.limit);
        res.json({
            success: true,
            data: entries,
            pagination: {
                page: query.page,
                limit: query.limit,
                total,
                pages,
            },
        });
    }
    catch (error) {
        console.error('Error fetching patient history:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid query parameters',
                details: error.errors,
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to fetch patient history',
        });
    }
};
// Get single patient history entry by ID
export const getPatientHistoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const entry = await prisma.patientHistory.findUnique({
            where: { id },
            include: {
                patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        dateOfBirth: true,
                        email: true,
                        phone: true,
                    }
                },
                package: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                appointment: {
                    select: {
                        id: true,
                        scheduledDate: true,
                        startTime: true,
                        endTime: true,
                        service: {
                            select: {
                                name: true,
                                nameGerman: true,
                            }
                        },
                        staff: {
                            select: {
                                firstName: true,
                                lastName: true,
                            }
                        }
                    }
                }
            },
        });
        if (!entry) {
            return res.status(404).json({
                success: false,
                error: 'Patient history entry not found',
            });
        }
        res.json({
            success: true,
            data: entry,
        });
    }
    catch (error) {
        console.error('Error fetching patient history entry:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch patient history entry',
        });
    }
};
// Create new patient history entry
export const createPatientHistory = async (req, res) => {
    try {
        const data = createPatientHistorySchema.parse(req.body);
        // Verify patient exists
        const patient = await prisma.patient.findUnique({
            where: { id: data.patientId },
            select: { id: true }
        });
        if (!patient) {
            return res.status(400).json({
                success: false,
                error: 'Patient not found',
            });
        }
        // Verify package exists if provided
        if (data.packageId) {
            const packageExists = await prisma.package.findUnique({
                where: { id: data.packageId },
                select: { id: true }
            });
            if (!packageExists) {
                return res.status(400).json({
                    success: false,
                    error: 'Package not found',
                });
            }
        }
        // Verify appointment exists if provided
        if (data.appointmentId) {
            const appointmentExists = await prisma.appointment.findUnique({
                where: { id: data.appointmentId },
                select: { id: true }
            });
            if (!appointmentExists) {
                return res.status(400).json({
                    success: false,
                    error: 'Appointment not found',
                });
            }
        }
        // Get user ID from request for audit tracking
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
        }
        const entry = await prisma.patientHistory.create({
            data: {
                ...data,
                createdById: userId, // Add audit field
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
        // Log the creation in audit trail
        await AuditService.logCreate(req, 'PatientHistory', entry.id, AuditService.cleanSensitiveData(entry), `Created patient history entry for: ${entry.patient.firstName} ${entry.patient.lastName}`);
        res.status(201).json({
            success: true,
            data: entry,
            message: 'Patient history entry created successfully',
        });
    }
    catch (error) {
        console.error('Error creating patient history entry:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors,
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to create patient history entry',
        });
    }
};
// Update patient history entry
export const updatePatientHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const data = updatePatientHistorySchema.parse(req.body);
        // Check if entry exists
        const existingEntry = await prisma.patientHistory.findUnique({
            where: { id },
        });
        if (!existingEntry) {
            return res.status(404).json({
                success: false,
                error: 'Patient history entry not found',
            });
        }
        const entry = await prisma.patientHistory.update({
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
        res.json({
            success: true,
            data: entry,
            message: 'Patient history entry updated successfully',
        });
    }
    catch (error) {
        console.error('Error updating patient history entry:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors,
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to update patient history entry',
        });
    }
};
// Delete patient history entry
export const deletePatientHistory = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if entry exists
        const existingEntry = await prisma.patientHistory.findUnique({
            where: { id },
        });
        if (!existingEntry) {
            return res.status(404).json({
                success: false,
                error: 'Patient history entry not found',
            });
        }
        await prisma.patientHistory.delete({
            where: { id },
        });
        res.json({
            success: true,
            message: 'Patient history entry deleted successfully',
        });
    }
    catch (error) {
        console.error('Error deleting patient history entry:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete patient history entry',
        });
    }
};
//# sourceMappingURL=patientHistoryController.js.map