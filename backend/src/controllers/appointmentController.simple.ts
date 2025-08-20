import { Request, Response } from 'express';
import prisma from '../utils/db.js';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role: string;
    firstName: string;
    lastName: string;
  };
}

export const appointmentController = {
  // Get all appointments with basic filtering
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
        packageId
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};

      // Basic search by patient name
      if (search) {
        where.OR = [
          {
            patient: {
              OR: [
                { firstName: { contains: search as string, mode: 'insensitive' } },
                { lastName: { contains: search as string, mode: 'insensitive' } }
              ]
            }
          }
        ];
      }

      // Filters
      if (status) where.status = status;
      if (staffId) where.staffId = staffId;
      if (roomId) where.roomId = roomId;
      if (patientId) where.patientId = patientId;
      if (packageId) where.packageId = packageId;

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
    } catch (error) {
      console.error('Error fetching appointment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch appointment'
      });
    }
  },

  // Create appointment (simplified)
  createAppointment: async (req: AuthRequest, res: Response) => {
    try {
      const {
        patientId,
        packageId,
        serviceId,
        staffId,
        roomId,
        scheduledDate,
        startTime,
        notes
      } = req.body;

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

  // Update appointment (simplified)
  updateAppointment: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const appointment = await prisma.appointment.update({
        where: { id },
        data: {
          ...updateData,
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

      res.json({
        success: true,
        data: appointment
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update appointment'
      });
    }
  },

  // Delete (cancel) appointment
  deleteAppointment: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      await prisma.appointment.update({
        where: { id },
        data: {
          status: 'CANCELLED'
        }
      });

      res.json({
        success: true,
        message: 'Appointment cancelled successfully'
      });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel appointment'
      });
    }
  },

  // Check availability based on staff schedules and existing appointments
  checkAvailability: async (req: AuthRequest, res: Response) => {
    try {
      const { date, startTime, duration, serviceId, excludeAppointmentId } = req.query;
      
      if (!date || !startTime || !duration) {
        return res.status(400).json({
          success: false,
          error: 'Date, startTime, and duration are required'
        });
      }

      const appointmentDate = new Date(date as string);
      const dayOfWeek = appointmentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const durationMinutes = parseInt(duration as string);
      
      // Calculate end time
      const [hours, minutes] = (startTime as string).split(':').map(Number);
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
            { endTime: { gt: startTime as string } }
          ],
          ...(excludeAppointmentId && { id: { not: excludeAppointmentId as string } })
        },
        select: {
          staffId: true,
          roomId: true
        }
      });

      // Filter out staff who already have appointments at this time
      const staffWithoutConflicts = availableStaff.filter(staff => 
        !existingAppointments.some(apt => apt.staffId === staff.id)
      );

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
      const availableRooms = allRooms.filter(room =>
        !existingAppointments.some(apt => apt.roomId === room.id)
      );

      res.json({
        success: true,
        data: {
          availableStaff: staffWithoutConflicts,
          availableRooms: availableRooms,
          totalConflicts: existingAppointments.length
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

      const where: any = {
        status: { notIn: ['CANCELLED'] }
      };

      if (startDate && endDate) {
        where.scheduledDate = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      }

      if (staffId) where.staffId = staffId;
      if (roomId) where.roomId = roomId;

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
    } catch (error) {
      console.error('Error fetching calendar appointments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch calendar appointments'
      });
    }
  },

  // Placeholder for other methods
  createMultipleAppointments: async (req: AuthRequest, res: Response) => {
    res.status(501).json({
      success: false,
      error: 'Multiple appointments creation not yet implemented'
    });
  },

  markAppointmentsAsPaid: async (req: AuthRequest, res: Response) => {
    res.status(501).json({
      success: false,
      error: 'Mark as paid not yet implemented'
    });
  },

  bulkDeleteAppointments: async (req: AuthRequest, res: Response) => {
    res.status(501).json({
      success: false,
      error: 'Bulk delete not yet implemented'
    });
  }
};