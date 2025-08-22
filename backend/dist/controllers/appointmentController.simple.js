import prisma from '../utils/db.js';
import { PackageUpdater } from '../utils/packageUpdater.js';
export const appointmentController = {
    // Get all appointments with basic filtering
    getAllAppointments: async (req, res) => {
        try {
            const { page = '1', limit = '10', search = '', status, staffId, roomId, patientId, packageId, date } = req.query;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;
            const where = {};
            // Basic search by patient name
            if (search) {
                where.OR = [
                    {
                        patient: {
                            OR: [
                                { firstName: { contains: search, mode: 'insensitive' } },
                                { lastName: { contains: search, mode: 'insensitive' } }
                            ]
                        }
                    }
                ];
            }
            // Filters
            if (status)
                where.status = status;
            if (staffId)
                where.staffId = staffId;
            if (roomId)
                where.roomId = roomId;
            if (patientId)
                where.patientId = patientId;
            if (packageId)
                where.packageId = packageId;
            // Date filter - filter by specific date (daily filter)
            if (date) {
                const filterDate = new Date(date);
                // Set time to start and end of day for proper filtering
                const startOfDay = new Date(filterDate);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(filterDate);
                endOfDay.setHours(23, 59, 59, 999);
                where.scheduledDate = {
                    gte: startOfDay,
                    lte: endOfDay
                };
            }
            const [appointments, total] = await Promise.all([
                prisma.appointment.findMany({
                    where,
                    include: {
                        patient: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                phone: true,
                                email: true
                            }
                        },
                        package: {
                            select: {
                                id: true,
                                name: true,
                                finalPrice: true,
                                paymentStatus: true
                            }
                        },
                        service: {
                            select: {
                                id: true,
                                name: true,
                                duration: true,
                                price: true,
                                categoryColor: true
                            }
                        },
                        staff: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                specialization: true
                            }
                        },
                        room: {
                            select: {
                                id: true,
                                name: true,
                                description: true
                            }
                        }
                    },
                    orderBy: { scheduledDate: 'desc' },
                    skip,
                    take: limitNum
                }),
                prisma.appointment.count({ where })
            ]);
            res.json({
                success: true,
                data: appointments,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            });
        }
        catch (error) {
            console.error('Error fetching appointments:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch appointments'
            });
        }
    },
    // Get appointment by ID
    getAppointmentById: async (req, res) => {
        try {
            const { id } = req.params;
            const appointment = await prisma.appointment.findUnique({
                where: { id },
                include: {
                    patient: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            email: true
                        }
                    },
                    package: {
                        include: {
                            packageItems: {
                                include: {
                                    service: {
                                        select: {
                                            id: true,
                                            name: true,
                                            duration: true,
                                            price: true
                                        }
                                    }
                                }
                            },
                            payments: {
                                select: {
                                    id: true,
                                    amount: true,
                                    status: true,
                                    paidAt: true,
                                    paidSessionsCount: true
                                }
                            }
                        }
                    },
                    service: {
                        select: {
                            id: true,
                            name: true,
                            duration: true,
                            price: true,
                            categoryColor: true
                        }
                    },
                    staff: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            specialization: true
                        }
                    },
                    room: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            features: true
                        }
                    }
                }
            });
            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    error: 'Appointment not found'
                });
            }
            res.json({
                success: true,
                data: appointment
            });
        }
        catch (error) {
            console.error('Error fetching appointment:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch appointment'
            });
        }
    },
    // Create appointment (simplified)
    createAppointment: async (req, res) => {
        try {
            const { patientId, packageId, serviceId, staffId, roomId, scheduledDate, startTime, notes } = req.body;
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }
            // Get service to calculate end time
            const service = await prisma.service.findUnique({
                where: { id: serviceId }
            });
            if (!service) {
                return res.status(400).json({
                    success: false,
                    error: 'Service not found'
                });
            }
            // Validate package session limit if appointment is linked to a package
            if (packageId) {
                // Get package with its items to check session limits
                const packageData = await prisma.package.findUnique({
                    where: { id: packageId },
                    include: {
                        packageItems: {
                            where: { serviceId },
                            select: {
                                sessionCount: true
                            }
                        }
                    }
                });
                if (!packageData) {
                    return res.status(400).json({
                        success: false,
                        error: 'Package not found'
                    });
                }
                // Find the package item for this service
                const packageItem = packageData.packageItems.find(item => item);
                if (!packageItem) {
                    return res.status(400).json({
                        success: false,
                        error: 'This service is not included in the selected package'
                    });
                }
                // Count existing active appointments (all statuses except CANCELLED) for this package and service
                const activeAppointmentsCount = await prisma.appointment.count({
                    where: {
                        packageId,
                        serviceId,
                        status: { not: 'CANCELLED' }
                    }
                });
                // Check if adding this appointment would exceed the session limit
                if (activeAppointmentsCount >= packageItem.sessionCount) {
                    return res.status(400).json({
                        success: false,
                        error: `Termin kann nicht erstellt werden. Dieses Paket erlaubt nur ${packageItem.sessionCount} Sitzung(en) für diese Behandlung. Es existieren bereits ${activeAppointmentsCount} aktive Termine. Bitte stornieren Sie zuerst einen bestehenden Termin oder wenden Sie sich an die Verwaltung.`
                    });
                }
            }
            // Check for duplicate appointment (same patient at same date and time - regardless of package, room, or therapist)
            const existingAppointment = await prisma.appointment.findFirst({
                where: {
                    patientId,
                    scheduledDate: new Date(scheduledDate),
                    startTime,
                    status: { not: 'CANCELLED' } // Exclude cancelled appointments
                },
                include: {
                    patient: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    },
                    service: {
                        select: {
                            name: true
                        }
                    },
                    staff: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            });
            if (existingAppointment) {
                return res.status(400).json({
                    success: false,
                    error: `Der Patient ${existingAppointment.patient.firstName} ${existingAppointment.patient.lastName} hat bereits einen Termin am ${new Date(scheduledDate).toLocaleDateString('de-DE')} um ${startTime} Uhr (${existingAppointment.service.name} mit ${existingAppointment.staff.firstName} ${existingAppointment.staff.lastName}). Ein Patient kann nicht zwei Termine zur gleichen Zeit haben.`
                });
            }
            // Calculate end time
            const [hours, minutes] = startTime.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes + service.duration;
            const endHours = Math.floor(totalMinutes / 60);
            const endMinutes = totalMinutes % 60;
            const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
            const appointment = await prisma.appointment.create({
                data: {
                    patientId,
                    packageId,
                    serviceId,
                    staffId,
                    roomId,
                    scheduledDate: new Date(scheduledDate),
                    startTime,
                    endTime,
                    status: 'SCHEDULED',
                    notes,
                    createdById: req.user.id,
                    hasConflict: false,
                    isVisible: true
                },
                include: {
                    patient: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    },
                    service: {
                        select: {
                            name: true
                        }
                    }
                }
            });
            // Update package sessions if appointment is linked to a package
            if (appointment.packageId) {
                try {
                    await PackageUpdater.updatePackageSessions(appointment.packageId);
                }
                catch (updateError) {
                    console.error('Error updating package sessions:', updateError);
                    // Don't fail the appointment creation, just log the error
                }
            }
            res.status(201).json({
                success: true,
                data: appointment
            });
        }
        catch (error) {
            console.error('Error creating appointment:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create appointment'
            });
        }
    },
    // Update appointment (simplified)
    updateAppointment: async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = req.body;
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }
            // Convert scheduledDate string to Date object if present
            const processedData = { ...updateData };
            if (processedData.scheduledDate) {
                processedData.scheduledDate = new Date(processedData.scheduledDate);
            }
            // If startTime is being updated, we need to recalculate the endTime
            if (processedData.startTime) {
                // First, get the appointment with its service to know the duration
                const appointmentWithService = await prisma.appointment.findUnique({
                    where: { id },
                    include: {
                        service: {
                            select: {
                                duration: true
                            }
                        }
                    }
                });
                if (!appointmentWithService) {
                    return res.status(404).json({
                        success: false,
                        error: 'Termin nicht gefunden'
                    });
                }
                if (!appointmentWithService.service) {
                    return res.status(400).json({
                        success: false,
                        error: 'Termin hat keine zugeordnete Behandlung'
                    });
                }
                // Calculate new end time based on the new start time and original duration
                const [hours, minutes] = processedData.startTime.split(':').map(Number);
                const duration = appointmentWithService.service.duration || 30; // Default to 30 minutes if not set
                const totalMinutes = hours * 60 + minutes + duration;
                const endHours = Math.floor(totalMinutes / 60);
                const endMinutes = totalMinutes % 60;
                processedData.endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
            }
            // Validate if trying to mark appointment as completed or no show
            if (processedData.status === 'COMPLETED' || processedData.status === 'NO_SHOW') {
                // First fetch the appointment to check its scheduled date and time
                const existingAppointment = await prisma.appointment.findUnique({
                    where: { id },
                    select: {
                        scheduledDate: true,
                        startTime: true,
                        endTime: true
                    }
                });
                if (!existingAppointment) {
                    return res.status(404).json({
                        success: false,
                        error: 'Termin nicht gefunden'
                    });
                }
                // For COMPLETED, use end time; for NO_SHOW, use start time
                const appointmentDate = new Date(existingAppointment.scheduledDate);
                if (processedData.status === 'COMPLETED') {
                    const [endHours, endMinutes] = existingAppointment.endTime.split(':').map(Number);
                    appointmentDate.setHours(endHours, endMinutes, 0, 0);
                }
                else if (processedData.status === 'NO_SHOW') {
                    const [startHours, startMinutes] = existingAppointment.startTime.split(':').map(Number);
                    appointmentDate.setHours(startHours, startMinutes, 0, 0);
                }
                const now = new Date();
                // Check if appointment time is in the future
                if (appointmentDate > now) {
                    const statusText = processedData.status === 'COMPLETED' ? 'abgeschlossen' : '"No Show"';
                    return res.status(400).json({
                        success: false,
                        error: `Ein zukünftiger Termin kann nicht als ${statusText} markiert werden.`
                    });
                }
            }
            // Get the original appointment to check if packageId or status changed
            const originalAppointment = await prisma.appointment.findUnique({
                where: { id },
                select: { packageId: true, status: true }
            });
            const appointment = await prisma.appointment.update({
                where: { id },
                data: {
                    ...processedData,
                    updatedAt: new Date()
                },
                include: {
                    patient: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    },
                    service: {
                        select: {
                            name: true
                        }
                    }
                }
            });
            // Update package sessions if status changed or package changed
            const statusChanged = originalAppointment?.status !== appointment.status;
            const packageChanged = originalAppointment?.packageId !== appointment.packageId;
            if (statusChanged || packageChanged) {
                const packageIdsToUpdate = new Set();
                // Add old package if exists
                if (originalAppointment?.packageId) {
                    packageIdsToUpdate.add(originalAppointment.packageId);
                }
                // Add new package if exists
                if (appointment.packageId) {
                    packageIdsToUpdate.add(appointment.packageId);
                }
                // Update all affected packages
                for (const packageId of packageIdsToUpdate) {
                    try {
                        await PackageUpdater.updatePackageSessions(packageId);
                    }
                    catch (updateError) {
                        console.error('Error updating package sessions:', updateError);
                        // Don't fail the appointment update, just log the error
                    }
                }
            }
            res.json({
                success: true,
                data: appointment
            });
        }
        catch (error) {
            console.error('Error updating appointment:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update appointment'
            });
        }
    },
    // Delete (cancel) appointment
    deleteAppointment: async (req, res) => {
        try {
            const { id } = req.params;
            // Get the appointment to check if it has a package
            const appointment = await prisma.appointment.findUnique({
                where: { id },
                select: { packageId: true }
            });
            await prisma.appointment.update({
                where: { id },
                data: {
                    status: 'CANCELLED'
                }
            });
            // Update package sessions if appointment was linked to a package
            if (appointment?.packageId) {
                try {
                    await PackageUpdater.updatePackageSessions(appointment.packageId);
                }
                catch (updateError) {
                    console.error('Error updating package sessions:', updateError);
                    // Don't fail the cancellation, just log the error
                }
            }
            res.json({
                success: true,
                message: 'Appointment cancelled successfully'
            });
        }
        catch (error) {
            console.error('Error cancelling appointment:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to cancel appointment'
            });
        }
    },
    // Check availability based on staff schedules and existing appointments
    checkAvailability: async (req, res) => {
        try {
            const { date, startTime, duration, serviceId, excludeAppointmentId } = req.query;
            if (!date || !startTime || !duration) {
                return res.status(400).json({
                    success: false,
                    error: 'Date, startTime, and duration are required'
                });
            }
            const appointmentDate = new Date(date);
            const dayOfWeek = appointmentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const durationMinutes = parseInt(duration);
            // Calculate end time
            const [hours, minutes] = startTime.split(':').map(Number);
            const startMinutes = hours * 60 + minutes;
            const endMinutes = startMinutes + durationMinutes;
            const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;
            // Get all staff with their schedules for the requested day
            const allStaff = await prisma.user.findMany({
                where: {
                    isActive: true,
                    specialization: { not: null }
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    specialization: true,
                    staffSchedules: {
                        where: {
                            dayOfWeek: dayOfWeek
                        },
                        select: {
                            startTime: true,
                            endTime: true,
                            breakStartTime: true,
                            breakEndTime: true
                        }
                    }
                }
            });
            // Filter staff based on schedule availability
            const availableStaff = allStaff.filter(staff => {
                // Check if staff has a schedule for this day
                if (staff.staffSchedules.length === 0) {
                    return false; // No schedule for this day
                }
                const schedule = staff.staffSchedules[0];
                // Check if requested time falls within working hours
                const workStart = schedule.startTime;
                const workEnd = schedule.endTime;
                if (startTime < workStart || endTime > workEnd) {
                    return false; // Outside working hours
                }
                // Check if appointment conflicts with break time (if exists)
                if (schedule.breakStartTime && schedule.breakEndTime) {
                    const breakStart = schedule.breakStartTime;
                    const breakEnd = schedule.breakEndTime;
                    // Check if appointment overlaps with break
                    if (!(endTime <= breakStart || startTime >= breakEnd)) {
                        return false; // Conflicts with break time
                    }
                }
                return true;
            });
            // Get existing appointments for the same date/time to check conflicts
            const existingAppointments = await prisma.appointment.findMany({
                where: {
                    scheduledDate: appointmentDate,
                    status: { notIn: ['CANCELLED'] },
                    AND: [
                        { startTime: { lt: endTime } },
                        { endTime: { gt: startTime } }
                    ],
                    ...(excludeAppointmentId && { id: { not: excludeAppointmentId } })
                },
                select: {
                    staffId: true,
                    roomId: true
                }
            });
            // Filter out staff who already have appointments at this time
            const staffWithoutConflicts = availableStaff.filter(staff => !existingAppointments.some(apt => apt.staffId === staff.id));
            // Get all available rooms
            const allRooms = await prisma.room.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    features: true
                }
            });
            // Filter out rooms that are already booked
            const availableRooms = allRooms.filter(room => !existingAppointments.some(apt => apt.roomId === room.id));
            res.json({
                success: true,
                data: {
                    availableStaff: staffWithoutConflicts,
                    availableRooms: availableRooms,
                    totalConflicts: existingAppointments.length
                }
            });
        }
        catch (error) {
            console.error('Error checking availability:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to check availability'
            });
        }
    },
    // Get calendar appointments
    getCalendarAppointments: async (req, res) => {
        try {
            const { startDate, endDate, staffId, roomId } = req.query;
            const where = {
                status: { notIn: ['CANCELLED'] }
            };
            if (startDate && endDate) {
                where.scheduledDate = {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                };
            }
            if (staffId)
                where.staffId = staffId;
            if (roomId)
                where.roomId = roomId;
            const appointments = await prisma.appointment.findMany({
                where,
                include: {
                    patient: {
                        select: {
                            firstName: true,
                            lastName: true,
                            phone: true
                        }
                    },
                    service: {
                        select: {
                            name: true,
                            duration: true,
                            categoryColor: true
                        }
                    },
                    staff: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    },
                    room: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: [
                    { scheduledDate: 'asc' },
                    { startTime: 'asc' }
                ]
            });
            res.json({
                success: true,
                data: appointments
            });
        }
        catch (error) {
            console.error('Error fetching calendar appointments:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch calendar appointments'
            });
        }
    },
    // Placeholder for other methods
    createMultipleAppointments: async (req, res) => {
        res.status(501).json({
            success: false,
            error: 'Multiple appointments creation not yet implemented'
        });
    },
    markAppointmentsAsPaid: async (req, res) => {
        res.status(501).json({
            success: false,
            error: 'Mark as paid not yet implemented'
        });
    },
    bulkDeleteAppointments: async (req, res) => {
        res.status(501).json({
            success: false,
            error: 'Bulk delete not yet implemented'
        });
    }
};
//# sourceMappingURL=appointmentController.simple.js.map