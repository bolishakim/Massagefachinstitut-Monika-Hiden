import { Request, Response } from 'express';
import { AuthRequest } from '../types/index.js';
import prisma from '../utils/db.js';
import { AppointmentStatus, PaymentStatus, Prisma } from '@prisma/client';
import { calculateEndTime, checkTimeConflict, validateAppointmentTime } from '../utils/appointmentUtils.js';

export const appointmentController = {
  // Get all appointments with filters
  getAllAppointments: async (req: AuthRequest, res: Response) => {
    try {
      const {
        page = '1',
        limit = '10',
        search = '',
        status,
        staffId,
        roomId,
        patientId,
        packageId,
        date,
        startDate,
        endDate,
        sortBy = 'scheduledDate',
        sortOrder = 'desc'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause
      const where: Prisma.AppointmentWhereInput = {};

      // Search by patient name or service name
      if (search) {
        where.OR = [
          {
            patient: {
              OR: [
                { firstName: { contains: search as string, mode: 'insensitive' } },
                { lastName: { contains: search as string, mode: 'insensitive' } }
              ]
            }
          },
          {
            service: {
              name: { contains: search as string, mode: 'insensitive' }
            }
          }
        ];
      }

      // Filters
      if (status) where.status = status as AppointmentStatus;
      if (staffId) where.staffId = staffId as string;
      if (roomId) where.roomId = roomId as string;
      if (patientId) where.patientId = patientId as string;
      if (packageId) where.packageId = packageId as string;

      // Date filters
      if (date) {
        const targetDate = new Date(date as string);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        where.scheduledDate = {
          gte: targetDate,
          lt: nextDay
        };
      } else if (startDate || endDate) {
        where.scheduledDate = {};
        if (startDate) where.scheduledDate.gte = new Date(startDate as string);
        if (endDate) where.scheduledDate.lte = new Date(endDate as string);
      }

      // Build orderBy
      const orderBy: Prisma.AppointmentOrderByWithRelationInput = {};
      if (sortBy === 'patient') {
        orderBy.patient = { firstName: sortOrder as 'asc' | 'desc' };
      } else if (sortBy === 'service') {
        orderBy.service = { name: sortOrder as 'asc' | 'desc' };
      } else {
        orderBy[sortBy as keyof Prisma.AppointmentOrderByWithRelationInput] = sortOrder as 'asc' | 'desc';
      }

      // Get appointments
      const [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
          where,
          include: {
            patient: true,
            package: {
              include: {
                payments: true
              }
            },
            service: true,
            staff: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                specialization: true
              }
            },
            room: true
          },
          orderBy,
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
    } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch appointments'
      });
    }
  },

  // Get appointment by ID
  getAppointmentById: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: {
          patient: true,
          package: {
            include: {
              packageItems: {
                include: {
                  service: true
                }
              },
              payments: true
            }
          },
          service: true,
          staff: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              specialization: true
            }
          },
          room: true,
          patientHistory: {
            orderBy: { recordedAt: 'desc' },
            take: 1
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
    } catch (error) {
      console.error('Error fetching appointment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch appointment'
      });
    }
  },

  // Create single appointment
  createAppointment: async (req: AuthRequest, res: Response) => {
    try {
      const { patientId, packageId, serviceId, staffId, roomId, scheduledDate, startTime, notes, payment } = req.body;
      const userId = req.user!.id;

      // Validate package belongs to patient and is active
      const packageData = await prisma.package.findFirst({
        where: {
          id: packageId,
          patientId,
          status: 'ACTIVE'
        },
        include: {
          packageItems: {
            where: { serviceId },
            include: { service: true }
          }
        }
      });

      if (!packageData) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or inactive package for this patient'
        });
      }

      // Check if service is in package and has remaining sessions
      const packageItem = packageData.packageItems[0];
      if (!packageItem) {
        return res.status(400).json({
          success: false,
          error: 'Service not found in package'
        });
      }

      if (packageItem.completedCount >= packageItem.sessionCount) {
        return res.status(400).json({
          success: false,
          error: 'No remaining sessions for this service'
        });
      }

      // Get service duration
      const service = packageItem.service;
      const endTime = calculateEndTime(startTime, service.duration);

      // Validate appointment time against staff schedule
      const isValidTime = await validateAppointmentTime(staffId, scheduledDate, startTime, endTime);
      if (!isValidTime) {
        return res.status(400).json({
          success: false,
          error: 'Appointment time is outside staff working hours'
        });
      }

      // Check for conflicts
      const conflicts = await checkTimeConflict(scheduledDate, startTime, endTime, roomId, staffId);
      if (conflicts.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Time slot conflicts with existing appointments',
          conflicts
        });
      }

      // Create appointment
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
          createdById: userId,
          hasConflict: false
        },
        include: {
          patient: true,
          package: true,
          service: true,
          staff: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              specialization: true
            }
          },
          room: true
        }
      });

      // Create payment if provided
      if (payment) {
        await prisma.payment.create({
          data: {
            patientId,
            packageId,
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
            paidSessionsCount: payment.paidSessionsCount || 1,
            status: 'COMPLETED',
            paidAt: new Date(),
            createdById: userId,
            notes: `Payment for appointment on ${new Date(scheduledDate).toLocaleDateString()}`
          }
        });

        // Update package payment status
        await updatePackagePaymentStatus(packageId);
      }

      res.status(201).json({
        success: true,
        data: appointment
      });
    } catch (error) {
      console.error('Error creating appointment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create appointment'
      });
    }
  },

  // Create multiple appointments
  createMultipleAppointments: async (req: AuthRequest, res: Response) => {
    try {
      const { patientId, packageId, appointments, payment } = req.body;
      const userId = req.user!.id;

      // Validate package
      const packageData = await prisma.package.findFirst({
        where: {
          id: packageId,
          patientId,
          status: 'ACTIVE'
        },
        include: {
          packageItems: {
            include: { service: true }
          }
        }
      });

      if (!packageData) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or inactive package for this patient'
        });
      }

      const createdAppointments = [];
      const errors = [];

      // Process each appointment
      for (const appt of appointments) {
        try {
          // Check service in package
          const packageItem = packageData.packageItems.find(pi => pi.serviceId === appt.serviceId);
          if (!packageItem) {
            errors.push(`Service ${appt.serviceId} not in package`);
            continue;
          }

          // Check remaining sessions
          const usedSessions = await prisma.appointment.count({
            where: {
              packageId,
              serviceId: appt.serviceId,
              status: { notIn: ['CANCELLED'] }
            }
          });

          if (usedSessions >= packageItem.sessionCount) {
            errors.push(`No remaining sessions for service ${packageItem.service.name}`);
            continue;
          }

          // Calculate end time
          const endTime = calculateEndTime(appt.startTime, packageItem.service.duration);

          // Validate time
          const isValidTime = await validateAppointmentTime(appt.staffId, appt.scheduledDate, appt.startTime, endTime);
          if (!isValidTime) {
            errors.push(`Invalid time for ${appt.scheduledDate} ${appt.startTime}`);
            continue;
          }

          // Check conflicts
          const conflicts = await checkTimeConflict(appt.scheduledDate, appt.startTime, endTime, appt.roomId, appt.staffId);
          if (conflicts.length > 0) {
            errors.push(`Conflict for ${appt.scheduledDate} ${appt.startTime}`);
            continue;
          }

          // Create appointment
          const created = await prisma.appointment.create({
            data: {
              patientId,
              packageId,
              serviceId: appt.serviceId,
              staffId: appt.staffId,
              roomId: appt.roomId,
              scheduledDate: new Date(appt.scheduledDate),
              startTime: appt.startTime,
              endTime,
              status: 'SCHEDULED',
              notes: appt.notes,
              createdById: userId,
              hasConflict: false
            }
          });

          createdAppointments.push(created);
        } catch (error) {
          console.error('Error creating appointment:', error);
          errors.push(`Failed to create appointment: ${error}`);
        }
      }

      // Create payment if provided and appointments were created
      if (payment && createdAppointments.length > 0) {
        await prisma.payment.create({
          data: {
            patientId,
            packageId,
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
            paidSessionsCount: payment.paidSessionsCount || createdAppointments.length,
            status: 'COMPLETED',
            paidAt: new Date(),
            createdById: userId,
            notes: `Payment for ${createdAppointments.length} appointments`
          }
        });

        await updatePackagePaymentStatus(packageId);
      }

      res.status(201).json({
        success: true,
        data: {
          created: createdAppointments,
          errors
        }
      });
    } catch (error) {
      console.error('Error creating multiple appointments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create appointments'
      });
    }
  },

  // Update appointment
  updateAppointment: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { staffId, roomId, scheduledDate, startTime, status, notes } = req.body;
      const userId = req.user!.id;

      // Get existing appointment
      const existing = await prisma.appointment.findUnique({
        where: { id },
        include: { service: true }
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Appointment not found'
        });
      }

      const updateData: Prisma.AppointmentUpdateInput = {
        modifiedById: userId,
        updatedAt: new Date()
      };

      // Handle status change
      if (status) {
        updateData.status = status;

        // Update package item completed count if completing appointment
        if (status === 'COMPLETED' && existing.status !== 'COMPLETED' && existing.packageId) {
          await prisma.packageItem.updateMany({
            where: {
              packageId: existing.packageId,
              serviceId: existing.serviceId
            },
            data: {
              completedCount: { increment: 1 }
            }
          });
        }
      }

      // Handle rescheduling
      if (staffId || roomId || scheduledDate || startTime) {
        const newStaffId = staffId || existing.staffId;
        const newRoomId = roomId || existing.roomId;
        const newDate = scheduledDate || existing.scheduledDate.toISOString();
        const newStartTime = startTime || existing.startTime;
        const endTime = calculateEndTime(newStartTime, existing.service.duration);

        // Validate new time
        const isValidTime = await validateAppointmentTime(newStaffId, newDate, newStartTime, endTime);
        if (!isValidTime) {
          return res.status(400).json({
            success: false,
            error: 'New appointment time is outside staff working hours'
          });
        }

        // Check conflicts
        const conflicts = await checkTimeConflict(newDate, newStartTime, endTime, newRoomId, newStaffId, id);
        if (conflicts.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'New time slot conflicts with existing appointments',
            conflicts
          });
        }

        if (staffId) updateData.staffId = staffId;
        if (roomId) updateData.roomId = roomId;
        if (scheduledDate) updateData.scheduledDate = new Date(scheduledDate);
        if (startTime) {
          updateData.startTime = startTime;
          updateData.endTime = endTime;
        }
      }

      if (notes !== undefined) updateData.notes = notes;

      // Update appointment
      const updated = await prisma.appointment.update({
        where: { id },
        data: updateData,
        include: {
          patient: true,
          package: true,
          service: true,
          staff: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              specialization: true
            }
          },
          room: true
        }
      });

      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update appointment'
      });
    }
  },

  // Delete appointment
  deleteAppointment: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const appointment = await prisma.appointment.findUnique({
        where: { id }
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: 'Appointment not found'
        });
      }

      // Update status to cancelled instead of hard delete
      await prisma.appointment.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          modifiedById: req.user!.id
        }
      });

      res.json({
        success: true,
        message: 'Appointment cancelled successfully'
      });
    } catch (error) {
      console.error('Error deleting appointment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete appointment'
      });
    }
  },

  // Check availability
  checkAvailability: async (req: AuthRequest, res: Response) => {
    try {
      const { date, startTime, duration, serviceId, excludeAppointmentId } = req.query;
      
      const appointmentDate = new Date(date as string);
      const durationMinutes = parseInt(duration as string);
      const endTime = calculateEndTime(startTime as string, durationMinutes);

      // Get all staff members
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
              dayOfWeek: appointmentDate.getDay(),
              isActive: true
            }
          }
        }
      });

      // Get all rooms
      const allRooms = await prisma.room.findMany({
        where: { isActive: true }
      });

      // Get conflicting appointments
      const conflicts = await prisma.appointment.findMany({
        where: {
          scheduledDate: appointmentDate,
          status: { notIn: ['CANCELLED'] },
          id: excludeAppointmentId ? { not: excludeAppointmentId as string } : undefined,
          OR: [
            {
              AND: [
                { startTime: { lte: startTime as string } },
                { endTime: { gt: startTime as string } }
              ]
            },
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } }
              ]
            },
            {
              AND: [
                { startTime: { gte: startTime as string } },
                { endTime: { lte: endTime } }
              ]
            }
          ]
        },
        select: {
          staffId: true,
          roomId: true
        }
      });

      // Filter available staff
      const busyStaffIds = conflicts.map(c => c.staffId);
      const availableStaff = allStaff.filter(staff => {
        // Check if staff works on this day
        if (staff.staffSchedules.length === 0) return false;
        
        const schedule = staff.staffSchedules[0];
        
        // Check if appointment time is within work hours
        if (startTime < schedule.startTime || endTime > schedule.endTime) return false;
        
        // Check if appointment time is during break
        if (schedule.breakStartTime && schedule.breakEndTime) {
          const isInBreak = (
            (startTime >= schedule.breakStartTime && startTime < schedule.breakEndTime) ||
            (endTime > schedule.breakStartTime && endTime <= schedule.breakEndTime) ||
            (startTime <= schedule.breakStartTime && endTime >= schedule.breakEndTime)
          );
          if (isInBreak) return false;
        }
        
        // Check if staff is busy
        return !busyStaffIds.includes(staff.id);
      });

      // Filter available rooms
      const busyRoomIds = conflicts.map(c => c.roomId);
      const availableRooms = allRooms.filter(room => !busyRoomIds.includes(room.id));

      res.json({
        success: true,
        data: {
          availableStaff,
          availableRooms,
          totalConflicts: conflicts.length
        }
      });
    } catch (error) {
      console.error('Error checking availability:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check availability'
      });
    }
  },

  // Get calendar appointments
  getCalendarAppointments: async (req: AuthRequest, res: Response) => {
    try {
      const { startDate, endDate, staffId, roomId } = req.query;

      const where: Prisma.AppointmentWhereInput = {
        status: { notIn: ['CANCELLED'] }
      };

      if (startDate && endDate) {
        where.scheduledDate = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      }

      if (staffId) where.staffId = staffId as string;
      if (roomId) where.roomId = roomId as string;

      const appointments = await prisma.appointment.findMany({
        where,
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
          staff: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          room: {
            select: {
              id: true,
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
    } catch (error) {
      console.error('Error fetching calendar appointments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch calendar appointments'
      });
    }
  },

  // Mark appointments as paid
  markAppointmentsAsPaid: async (req: AuthRequest, res: Response) => {
    try {
      const { appointmentIds, payment } = req.body;
      const userId = req.user!.id;

      // Get appointments
      const appointments = await prisma.appointment.findMany({
        where: {
          id: { in: appointmentIds },
          status: { notIn: ['CANCELLED'] }
        },
        include: {
          package: true
        }
      });

      if (appointments.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid appointments found'
        });
      }

      // Group by patient and package
      const groupedAppointments = appointments.reduce((acc, appt) => {
        const key = `${appt.patientId}-${appt.packageId}`;
        if (!acc[key]) {
          acc[key] = {
            patientId: appt.patientId,
            packageId: appt.packageId,
            appointments: []
          };
        }
        acc[key].appointments.push(appt);
        return acc;
      }, {} as Record<string, any>);

      // Create payments
      const payments = [];
      for (const group of Object.values(groupedAppointments)) {
        const paymentData = await prisma.payment.create({
          data: {
            patientId: group.patientId,
            packageId: group.packageId,
            amount: payment.amount / Object.keys(groupedAppointments).length,
            paymentMethod: payment.paymentMethod,
            paidSessionsCount: group.appointments.length,
            status: 'COMPLETED',
            paidAt: new Date(),
            createdById: userId,
            notes: payment.notes || `Payment for ${group.appointments.length} appointments`
          }
        });
        payments.push(paymentData);

        // Update package payment status
        if (group.packageId) {
          await updatePackagePaymentStatus(group.packageId);
        }
      }

      res.json({
        success: true,
        data: {
          payments,
          appointmentCount: appointments.length
        }
      });
    } catch (error) {
      console.error('Error marking appointments as paid:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process payment'
      });
    }
  },

  // Bulk delete appointments (Admin only)
  bulkDeleteAppointments: async (req: AuthRequest, res: Response) => {
    try {
      const { appointmentIds } = req.body;

      const result = await prisma.appointment.updateMany({
        where: {
          id: { in: appointmentIds }
        },
        data: {
          status: 'CANCELLED',
          modifiedById: req.user!.id
        }
      });

      res.json({
        success: true,
        data: {
          cancelledCount: result.count
        }
      });
    } catch (error) {
      console.error('Error bulk deleting appointments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to bulk delete appointments'
      });
    }
  }
};

// Helper function to update package payment status
async function updatePackagePaymentStatus(packageId: string) {
  const packageData = await prisma.package.findUnique({
    where: { id: packageId },
    include: {
      packageItems: true,
      payments: {
        where: { status: 'COMPLETED' }
      }
    }
  });

  if (!packageData) return;

  const totalSessions = packageData.packageItems.reduce((sum, item) => sum + item.sessionCount, 0);
  const paidSessions = packageData.payments.reduce((sum, payment) => sum + (payment.paidSessionsCount || 0), 0);
  
  let paymentStatus: PaymentStatus;
  if (paidSessions === 0) {
    paymentStatus = 'NONE';
  } else if (paidSessions >= totalSessions) {
    paymentStatus = 'COMPLETED';
  } else {
    paymentStatus = 'PARTIALLY_PAID';
  }

  await prisma.package.update({
    where: { id: packageId },
    data: { paymentStatus }
  });
}