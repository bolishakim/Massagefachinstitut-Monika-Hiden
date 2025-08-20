import prisma from './db.js';
import { Prisma } from '@prisma/client';

// Calculate end time based on start time and duration
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

// Check if time strings overlap
export function timeOverlaps(start1: string, end1: string, start2: string, end2: string): boolean {
  return start1 < end2 && end1 > start2;
}

// Convert time string to minutes for comparison
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Validate appointment time against staff schedule
export async function validateAppointmentTime(
  staffId: string,
  date: string | Date,
  startTime: string,
  endTime: string
): Promise<boolean> {
  const appointmentDate = new Date(date);
  const dayOfWeek = appointmentDate.getDay();

  // Get staff schedule for the day
  const schedule = await prisma.staffSchedule.findFirst({
    where: {
      staffId,
      dayOfWeek,
      isActive: true
    }
  });

  if (!schedule) {
    return false; // Staff doesn't work on this day
  }

  // Check if appointment is within working hours
  if (startTime < schedule.startTime || endTime > schedule.endTime) {
    return false;
  }

  // Check if appointment overlaps with break time
  if (schedule.breakStartTime && schedule.breakEndTime) {
    if (timeOverlaps(startTime, endTime, schedule.breakStartTime, schedule.breakEndTime)) {
      return false;
    }
  }

  return true;
}

// Check for time conflicts with existing appointments
export async function checkTimeConflict(
  date: string | Date,
  startTime: string,
  endTime: string,
  roomId?: string,
  staffId?: string,
  excludeAppointmentId?: string
): Promise<any[]> {
  const appointmentDate = new Date(date);
  
  const where: Prisma.AppointmentWhereInput = {
    scheduledDate: appointmentDate,
    status: { notIn: ['CANCELLED'] },
    OR: []
  };

  if (excludeAppointmentId) {
    where.id = { not: excludeAppointmentId };
  }

  // Check for time overlap
  where.AND = [
    {
      OR: [
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } }
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
            { startTime: { gte: startTime } },
            { endTime: { lte: endTime } }
          ]
        }
      ]
    }
  ];

  // Check room or staff conflicts
  const orConditions = [];
  if (roomId) {
    orConditions.push({ roomId });
  }
  if (staffId) {
    orConditions.push({ staffId });
  }

  if (orConditions.length > 0) {
    where.OR = orConditions;
  }

  const conflicts = await prisma.appointment.findMany({
    where,
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
      },
      room: {
        select: {
          name: true
        }
      }
    }
  });

  return conflicts;
}

// Get available time slots for a specific date
export async function getAvailableTimeSlots(
  date: Date,
  staffId: string,
  serviceDuration: number,
  timeSlotInterval: number = 30
): Promise<string[]> {
  const dayOfWeek = date.getDay();
  
  // Get staff schedule
  const schedule = await prisma.staffSchedule.findFirst({
    where: {
      staffId,
      dayOfWeek,
      isActive: true
    }
  });

  if (!schedule) {
    return [];
  }

  // Get existing appointments for the staff on this date
  const appointments = await prisma.appointment.findMany({
    where: {
      staffId,
      scheduledDate: date,
      status: { notIn: ['CANCELLED'] }
    },
    orderBy: { startTime: 'asc' }
  });

  const availableSlots: string[] = [];
  const startMinutes = timeToMinutes(schedule.startTime);
  const endMinutes = timeToMinutes(schedule.endTime);

  // Generate all possible time slots
  for (let minutes = startMinutes; minutes + serviceDuration <= endMinutes; minutes += timeSlotInterval) {
    const slotStart = minutesToTime(minutes);
    const slotEnd = minutesToTime(minutes + serviceDuration);

    // Skip if in break time
    if (schedule.breakStartTime && schedule.breakEndTime) {
      if (timeOverlaps(slotStart, slotEnd, schedule.breakStartTime, schedule.breakEndTime)) {
        continue;
      }
    }

    // Check if slot conflicts with existing appointments
    let hasConflict = false;
    for (const appt of appointments) {
      if (timeOverlaps(slotStart, slotEnd, appt.startTime, appt.endTime)) {
        hasConflict = true;
        break;
      }
    }

    if (!hasConflict) {
      availableSlots.push(slotStart);
    }
  }

  return availableSlots;
}

// Convert minutes to time string
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}