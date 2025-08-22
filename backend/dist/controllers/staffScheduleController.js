import { z } from 'zod';
import prisma from '../utils/db.js';
// Validation schemas
const createStaffScheduleSchema = z.object({
    staffId: z.string().uuid('Invalid staff ID'),
    dayOfWeek: z.number().int().min(0).max(6), // 0=Sunday, 6=Saturday
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid start time format (HH:MM)'),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid end time format (HH:MM)'),
    breakStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid break start time format (HH:MM)').optional(),
    breakEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid break end time format (HH:MM)').optional(),
    isActive: z.boolean().optional().default(true),
});
const updateStaffScheduleSchema = z.object({
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid start time format (HH:MM)').optional(),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid end time format (HH:MM)').optional(),
    breakStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid break start time format (HH:MM)').optional(),
    breakEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid break end time format (HH:MM)').optional(),
    isActive: z.boolean().optional(),
});
const querySchema = z.object({
    staffId: z.string().uuid().optional(),
    dayOfWeek: z.string().optional().transform((val) => val ? parseInt(val) : undefined),
    isActive: z.string().optional().transform((val) => val === 'true' ? true : val === 'false' ? false : undefined),
});
// Get all staff schedules with optional filtering
export const getStaffSchedules = async (req, res) => {
    try {
        const { staffId, dayOfWeek, isActive } = querySchema.parse(req.query);
        // Build where clause for filtering
        const where = {};
        if (staffId)
            where.staffId = staffId;
        if (dayOfWeek !== undefined)
            where.dayOfWeek = dayOfWeek;
        if (isActive !== undefined)
            where.isActive = isActive;
        const schedules = await prisma.staffSchedule.findMany({
            where,
            include: {
                staff: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                        email: true,
                        specialization: true,
                        role: true,
                        isActive: true,
                    },
                },
            },
            orderBy: [
                { staffId: 'asc' },
                { dayOfWeek: 'asc' },
            ],
        });
        res.json({
            success: true,
            data: schedules,
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors,
            });
        }
        console.error('Error fetching staff schedules:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch staff schedules',
        });
    }
};
// Get staff schedule by ID
export const getStaffScheduleById = async (req, res) => {
    try {
        const { id } = req.params;
        const schedule = await prisma.staffSchedule.findUnique({
            where: { id },
            include: {
                staff: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                        email: true,
                        specialization: true,
                        role: true,
                        isActive: true,
                    },
                },
            },
        });
        if (!schedule) {
            return res.status(404).json({
                success: false,
                error: 'Staff schedule not found',
            });
        }
        res.json({
            success: true,
            data: schedule,
        });
    }
    catch (error) {
        console.error('Error fetching staff schedule:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch staff schedule',
        });
    }
};
// Create new staff schedule
export const createStaffSchedule = async (req, res) => {
    try {
        const validatedData = createStaffScheduleSchema.parse(req.body);
        // Check if staff exists
        const staff = await prisma.user.findUnique({
            where: { id: validatedData.staffId },
            select: { id: true, isActive: true },
        });
        if (!staff) {
            return res.status(404).json({
                success: false,
                error: 'Staff member not found',
            });
        }
        // Check for existing schedule for this staff member on this day
        const existingSchedule = await prisma.staffSchedule.findUnique({
            where: {
                staffId_dayOfWeek: {
                    staffId: validatedData.staffId,
                    dayOfWeek: validatedData.dayOfWeek,
                },
            },
        });
        if (existingSchedule) {
            return res.status(409).json({
                success: false,
                error: 'A schedule already exists for this staff member on this day of the week',
            });
        }
        // Validate time logic
        if (validatedData.startTime >= validatedData.endTime) {
            return res.status(400).json({
                success: false,
                error: 'Start time must be before end time',
            });
        }
        if (validatedData.breakStartTime && validatedData.breakEndTime) {
            if (validatedData.breakStartTime >= validatedData.breakEndTime) {
                return res.status(400).json({
                    success: false,
                    error: 'Break start time must be before break end time',
                });
            }
            if (validatedData.breakStartTime < validatedData.startTime || validatedData.breakEndTime > validatedData.endTime) {
                return res.status(400).json({
                    success: false,
                    error: 'Break times must be within working hours',
                });
            }
        }
        const schedule = await prisma.staffSchedule.create({
            data: validatedData,
            include: {
                staff: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                        email: true,
                        specialization: true,
                        role: true,
                        isActive: true,
                    },
                },
            },
        });
        res.status(201).json({
            success: true,
            data: schedule,
            message: 'Staff schedule created successfully',
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors,
            });
        }
        console.error('Error creating staff schedule:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create staff schedule',
        });
    }
};
// Update staff schedule
export const updateStaffSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = updateStaffScheduleSchema.parse(req.body);
        // Check if schedule exists
        const existingSchedule = await prisma.staffSchedule.findUnique({
            where: { id },
            include: { staff: true },
        });
        if (!existingSchedule) {
            return res.status(404).json({
                success: false,
                error: 'Staff schedule not found',
            });
        }
        // Merge existing data with updates for validation
        const mergedData = {
            startTime: validatedData.startTime || existingSchedule.startTime,
            endTime: validatedData.endTime || existingSchedule.endTime,
            breakStartTime: validatedData.breakStartTime !== undefined ? validatedData.breakStartTime : existingSchedule.breakStartTime,
            breakEndTime: validatedData.breakEndTime !== undefined ? validatedData.breakEndTime : existingSchedule.breakEndTime,
        };
        // Validate time logic
        if (mergedData.startTime >= mergedData.endTime) {
            return res.status(400).json({
                success: false,
                error: 'Start time must be before end time',
            });
        }
        if (mergedData.breakStartTime && mergedData.breakEndTime) {
            if (mergedData.breakStartTime >= mergedData.breakEndTime) {
                return res.status(400).json({
                    success: false,
                    error: 'Break start time must be before break end time',
                });
            }
            if (mergedData.breakStartTime < mergedData.startTime || mergedData.breakEndTime > mergedData.endTime) {
                return res.status(400).json({
                    success: false,
                    error: 'Break times must be within working hours',
                });
            }
        }
        const updatedSchedule = await prisma.staffSchedule.update({
            where: { id },
            data: validatedData,
            include: {
                staff: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                        email: true,
                        specialization: true,
                        role: true,
                        isActive: true,
                    },
                },
            },
        });
        res.json({
            success: true,
            data: updatedSchedule,
            message: 'Staff schedule updated successfully',
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors,
            });
        }
        console.error('Error updating staff schedule:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update staff schedule',
        });
    }
};
// Delete staff schedule
export const deleteStaffSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if schedule exists
        const schedule = await prisma.staffSchedule.findUnique({
            where: { id },
            include: { staff: true },
        });
        if (!schedule) {
            return res.status(404).json({
                success: false,
                error: 'Staff schedule not found',
            });
        }
        await prisma.staffSchedule.delete({
            where: { id },
        });
        res.json({
            success: true,
            message: 'Staff schedule deleted successfully',
        });
    }
    catch (error) {
        console.error('Error deleting staff schedule:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete staff schedule',
        });
    }
};
// Get schedules grouped by staff member
export const getSchedulesByStaff = async (req, res) => {
    try {
        const { isActive } = querySchema.parse(req.query);
        const staffSchedules = await prisma.user.findMany({
            where: {
                role: { in: ['USER', 'MODERATOR'] }, // Only staff members
                isActive: isActive !== undefined ? isActive : true,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                email: true,
                specialization: true,
                role: true,
                isActive: true,
                staffSchedules: {
                    orderBy: { dayOfWeek: 'asc' },
                },
            },
            orderBy: [
                { lastName: 'asc' },
                { firstName: 'asc' },
            ],
        });
        res.json({
            success: true,
            data: staffSchedules,
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors,
            });
        }
        console.error('Error fetching schedules by staff:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch schedules by staff',
        });
    }
};
//# sourceMappingURL=staffScheduleController.js.map