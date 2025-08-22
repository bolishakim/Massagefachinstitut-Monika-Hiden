import prisma from '../utils/db.js';
import { startOfDay, endOfDay } from 'date-fns';
export const calendarController = {
    // Get calendar settings for a user
    getCalendarSettings: async (req, res) => {
        try {
            const userId = req.params.userId || req.user?.id;
            // First try to get user-specific settings
            let settings = await prisma.calendarSetting.findUnique({
                where: { userId }
            });
            // If no user-specific settings, get default settings (where userId is null)
            if (!settings) {
                settings = await prisma.calendarSetting.findFirst({
                    where: { userId: null }
                });
            }
            // If still no settings, create default settings
            if (!settings) {
                settings = await prisma.calendarSetting.create({
                    data: {
                        userId: null,
                        workingHoursStart: "08:00",
                        workingHoursEnd: "20:00",
                        timeSlotInterval: 15,
                        showWeekends: false,
                        defaultView: "day",
                        showStaffAvailability: true,
                        showRoomInfo: true,
                        autoRefreshInterval: 300
                    }
                });
            }
            res.json({
                success: true,
                data: settings
            });
        }
        catch (error) {
            console.error('Error fetching calendar settings:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch calendar settings'
            });
        }
    },
    // Update calendar settings
    updateCalendarSettings: async (req, res) => {
        try {
            const userId = req.params.userId || req.user?.id;
            const updates = req.body;
            // Check if settings exist
            const existing = await prisma.calendarSetting.findUnique({
                where: { userId }
            });
            let settings;
            if (existing) {
                // Update existing settings
                settings = await prisma.calendarSetting.update({
                    where: { userId },
                    data: updates
                });
            }
            else {
                // Create new user-specific settings
                settings = await prisma.calendarSetting.create({
                    data: {
                        ...updates,
                        userId
                    }
                });
            }
            res.json({
                success: true,
                data: settings
            });
        }
        catch (error) {
            console.error('Error updating calendar settings:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update calendar settings'
            });
        }
    },
    // Get daily schedule data
    getDailySchedule: async (req, res) => {
        try {
            const { date } = req.query;
            if (!date) {
                return res.status(400).json({
                    success: false,
                    error: 'Date parameter is required'
                });
            }
            const scheduleDate = new Date(date);
            const dayOfWeek = scheduleDate.getDay();
            // Get all active staff members (users with specialization)
            const staffMembers = await prisma.user.findMany({
                where: {
                    isActive: true,
                    specialization: { not: null }
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    specialization: true,
                    email: true,
                    phone: true
                }
            });
            // Get staff schedules for the day
            const schedules = await prisma.staffSchedule.findMany({
                where: {
                    dayOfWeek,
                    isActive: true,
                    staffId: { in: staffMembers.map(s => s.id) }
                }
            });
            // Get staff leaves that include this date
            const leaves = await prisma.staffLeave.findMany({
                where: {
                    startDate: { lte: endOfDay(scheduleDate) },
                    endDate: { gte: startOfDay(scheduleDate) },
                    isApproved: true,
                    staffId: { in: staffMembers.map(s => s.id) }
                }
            });
            // Get appointments for the day
            const appointments = await prisma.appointment.findMany({
                where: {
                    scheduledDate: {
                        gte: startOfDay(scheduleDate),
                        lte: endOfDay(scheduleDate)
                    },
                    status: { notIn: ['CANCELLED'] }
                },
                include: {
                    patient: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phone: true
                        }
                    },
                    service: {
                        select: {
                            id: true,
                            name: true,
                            duration: true,
                            categoryColor: true
                        }
                    },
                    room: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });
            // Get all rooms
            const rooms = await prisma.room.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    features: true
                }
            });
            res.json({
                success: true,
                data: {
                    staffMembers,
                    schedules,
                    leaves,
                    appointments,
                    rooms
                }
            });
        }
        catch (error) {
            console.error('Error fetching daily schedule:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch daily schedule'
            });
        }
    },
    // Get staff availability for a specific date
    getStaffAvailability: async (req, res) => {
        try {
            const { staffId, date } = req.query;
            if (!staffId || !date) {
                return res.status(400).json({
                    success: false,
                    error: 'Staff ID and date are required'
                });
            }
            const scheduleDate = new Date(date);
            const dayOfWeek = scheduleDate.getDay();
            // Get staff schedule for the day
            const schedule = await prisma.staffSchedule.findFirst({
                where: {
                    staffId: staffId,
                    dayOfWeek,
                    isActive: true
                }
            });
            // Check if staff is on leave
            const leave = await prisma.staffLeave.findFirst({
                where: {
                    staffId: staffId,
                    startDate: { lte: endOfDay(scheduleDate) },
                    endDate: { gte: startOfDay(scheduleDate) },
                    isApproved: true
                }
            });
            // Get staff appointments for the day
            const appointments = await prisma.appointment.findMany({
                where: {
                    staffId: staffId,
                    scheduledDate: {
                        gte: startOfDay(scheduleDate),
                        lte: endOfDay(scheduleDate)
                    },
                    status: { notIn: ['CANCELLED'] }
                },
                include: {
                    service: true
                }
            });
            res.json({
                success: true,
                data: {
                    schedule,
                    leave,
                    appointments,
                    isAvailable: !!schedule && !leave
                }
            });
        }
        catch (error) {
            console.error('Error fetching staff availability:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch staff availability'
            });
        }
    },
    // Check for scheduling conflicts
    checkConflicts: async (req, res) => {
        try {
            const { staffId, roomId, date, startTime, duration, excludeAppointmentId } = req.body;
            const scheduleDate = new Date(date);
            // Calculate end time
            const [hours, minutes] = startTime.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes + duration;
            const endHours = Math.floor(totalMinutes / 60);
            const endMinutes = totalMinutes % 60;
            const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
            // Build where clause for conflict check
            const whereClause = {
                scheduledDate: {
                    gte: startOfDay(scheduleDate),
                    lte: endOfDay(scheduleDate)
                },
                status: { notIn: ['CANCELLED'] }
            };
            if (excludeAppointmentId) {
                whereClause.id = { not: excludeAppointmentId };
            }
            // Check staff conflicts
            const staffConflicts = await prisma.appointment.findMany({
                where: {
                    ...whereClause,
                    staffId,
                    OR: [
                        // New appointment starts during existing appointment
                        {
                            startTime: { lte: startTime },
                            endTime: { gt: startTime }
                        },
                        // New appointment ends during existing appointment
                        {
                            startTime: { lt: endTime },
                            endTime: { gte: endTime }
                        },
                        // New appointment completely contains existing appointment
                        {
                            startTime: { gte: startTime },
                            endTime: { lte: endTime }
                        }
                    ]
                },
                include: {
                    patient: true,
                    service: true
                }
            });
            // Check room conflicts
            const roomConflicts = await prisma.appointment.findMany({
                where: {
                    ...whereClause,
                    roomId,
                    OR: [
                        {
                            startTime: { lte: startTime },
                            endTime: { gt: startTime }
                        },
                        {
                            startTime: { lt: endTime },
                            endTime: { gte: endTime }
                        },
                        {
                            startTime: { gte: startTime },
                            endTime: { lte: endTime }
                        }
                    ]
                },
                include: {
                    patient: true,
                    service: true,
                    staff: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            });
            res.json({
                success: true,
                data: {
                    hasConflicts: staffConflicts.length > 0 || roomConflicts.length > 0,
                    staffConflicts,
                    roomConflicts
                }
            });
        }
        catch (error) {
            console.error('Error checking conflicts:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to check conflicts'
            });
        }
    }
};
//# sourceMappingURL=calendarController.js.map