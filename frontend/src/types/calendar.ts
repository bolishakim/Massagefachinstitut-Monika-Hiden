// Calendar-specific type definitions

export interface CalendarSettings {
  id: string;
  userId?: string;
  workingHoursStart: string;    // "08:00"
  workingHoursEnd: string;      // "20:00"
  timeSlotInterval: number;     // 30 minutes
  showWeekends: boolean;
  defaultView: 'day' | 'week' | 'month';
  showStaffAvailability: boolean;
  showRoomInfo: boolean;
  autoRefreshInterval: number;  // seconds
  createdAt: string;
  updatedAt: string;
}

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  specialization?: string;
  isActive: boolean;
}

export interface StaffSchedule {
  id: string;
  staffId: string;
  dayOfWeek: number;      // 0=Sunday, 1=Monday, etc.
  startTime: string;      // "09:00"
  endTime: string;        // "17:00"
  breakStartTime?: string;
  breakEndTime?: string;
  isActive: boolean;
}

export interface StaffLeave {
  id: string;
  staffId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  isApproved: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  packageId?: string;
  serviceId: string;
  staffId: string;
  roomId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  service?: {
    id: string;
    name: string;
    duration: number;
    categoryColor: string;
  };
  room?: {
    id: string;
    name: string;
  };
}

export interface StaffScheduleData {
  staffMembers: StaffMember[];
  schedules: StaffSchedule[];
  leaves: StaffLeave[];
  appointments: Appointment[];
  rooms: any[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  status: SlotStatus;
  appointment?: Appointment;
  isBreakTime?: boolean;
  conflictInfo?: string;
}

export type SlotStatus = 'available' | 'booked' | 'break' | 'unavailable' | 'conflict';

// API Response types
export interface CalendarApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}