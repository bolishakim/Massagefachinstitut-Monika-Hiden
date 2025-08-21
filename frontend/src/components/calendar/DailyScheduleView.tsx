import React, { useState, useEffect, useMemo } from 'react';
import { format, parse, addMinutes, isWithinInterval, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { User, Calendar, Clock, AlertCircle, Coffee } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { calendarService } from '@/services/calendar';
import { 
  CalendarSettings, 
  StaffScheduleData, 
  TimeSlot, 
  SlotStatus,
  StaffMember,
  Appointment
} from '@/types/calendar';

interface DailyScheduleViewProps {
  date: Date;
  userId?: string;
  onRefresh?: () => void;
}

export function DailyScheduleView({ date, userId, onRefresh }: DailyScheduleViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings | null>(null);
  const [scheduleData, setScheduleData] = useState<StaffScheduleData | null>(null);

  // Load calendar settings and schedule data
  useEffect(() => {
    loadScheduleData();
  }, [date, userId]);

  const loadScheduleData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load calendar settings and daily schedule in parallel
      const [settingsRes, scheduleRes] = await Promise.all([
        calendarService.getCalendarSettings(userId),
        calendarService.getDailySchedule(date)
      ]);

      if (settingsRes.success && settingsRes.data) {
        setCalendarSettings(settingsRes.data);
      }

      if (scheduleRes.success && scheduleRes.data) {
        setScheduleData(scheduleRes.data);
      } else {
        console.error('Schedule API Error:', scheduleRes);
        setError(scheduleRes.error || 'Fehler beim Laden des Zeitplans');
      }
    } catch (err) {
      console.error('Error loading schedule:', err);
      setError('Fehler beim Laden des Zeitplans');
    } finally {
      setLoading(false);
    }
  };

  // Generate time slots based on calendar settings
  const timeSlots = useMemo(() => {
    if (!calendarSettings) return [];

    const slots: string[] = [];
    const startTime = parse(calendarSettings.workingHoursStart, 'HH:mm', new Date());
    const endTime = parse(calendarSettings.workingHoursEnd, 'HH:mm', new Date());
    let currentTime = startTime;

    while (currentTime < endTime) {
      slots.push(format(currentTime, 'HH:mm'));
      currentTime = addMinutes(currentTime, calendarSettings.timeSlotInterval);
    }

    return slots;
  }, [calendarSettings]);

  // Get slot status for a specific staff member and time
  const getSlotStatus = (
    staff: StaffMember, 
    timeSlot: string,
    appointments: Appointment[],
    schedules: any[],
    leaves: any[]
  ): { status: SlotStatus; appointment?: Appointment; info?: string } => {
    // Check if staff is on leave
    const onLeave = leaves.some(leave => 
      leave.staffId === staff.id && 
      isSameDay(new Date(leave.startDate), date) // Simplified check
    );
    if (onLeave) {
      return { status: 'unavailable', info: 'Abwesend' };
    }

    // Check regular schedule
    const dayOfWeek = date.getDay();
    const schedule = schedules.find(s => 
      s.staffId === staff.id && s.dayOfWeek === dayOfWeek
    );

    if (!schedule) {
      return { status: 'unavailable', info: 'Nicht geplant' };
    }

    // Check if time is within working hours
    const slotTime = parse(timeSlot, 'HH:mm', new Date());
    const workStart = parse(schedule.startTime, 'HH:mm', new Date());
    const workEnd = parse(schedule.endTime, 'HH:mm', new Date());

    if (slotTime < workStart || slotTime >= workEnd) {
      return { status: 'unavailable' };
    }

    // Check if it's break time
    if (schedule.breakStartTime && schedule.breakEndTime) {
      const breakStart = parse(schedule.breakStartTime, 'HH:mm', new Date());
      const breakEnd = parse(schedule.breakEndTime, 'HH:mm', new Date());
      if (slotTime >= breakStart && slotTime < breakEnd) {
        return { status: 'break', info: 'Pause' };
      }
    }

    // Check for appointments that overlap with this time slot
    const appointment = appointments.find(apt => {
      if (apt.staffId !== staff.id || apt.status === 'CANCELLED') {
        return false;
      }

      // Parse appointment start time
      const aptStart = parse(apt.startTime, 'HH:mm', new Date());
      
      // Calculate appointment end time based on service duration
      let aptEnd;
      if (apt.endTime) {
        // Use endTime if available
        aptEnd = parse(apt.endTime, 'HH:mm', new Date());
      } else if (apt.service?.duration) {
        // Calculate end time from service duration
        aptEnd = addMinutes(aptStart, apt.service.duration);
      } else {
        // Default to 30 minutes if no duration info
        aptEnd = addMinutes(aptStart, 30);
      }
      
      const slotStart = parse(timeSlot, 'HH:mm', new Date());
      const slotEnd = addMinutes(slotStart, calendarSettings?.timeSlotInterval || 15);

      // Check if appointment overlaps with this time slot
      return (aptStart < slotEnd && aptEnd > slotStart);
    });

    if (appointment) {
      return { status: 'booked', appointment };
    }

    return { status: 'available' };
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </Card>
    );
  }

  if (!scheduleData || !calendarSettings) {
    return null;
  }

  const { staffMembers, schedules, leaves, appointments } = scheduleData;

  // Debug log appointments to see their structure
  React.useEffect(() => {
    if (appointments.length > 0) {
      console.log('Sample appointment data:', appointments[0]);
    }
  }, [appointments]);

  return (
    <Card className="p-4 overflow-hidden">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">
          Tagesplan für {format(date, 'EEEE, dd. MMMM yyyy', { locale: de })}
        </h3>
        <p className="text-muted-foreground">
          {staffMembers.length} Mitarbeiter • {timeSlots.length} Zeitslots • Scroll horizontal für mehr Mitarbeiter
        </p>
      </div>
      
      <div className="overflow-x-auto border rounded-lg">
        <div className="min-w-max bg-background">
          {/* Schedule Grid */}
          <div className="grid gap-2 p-2" style={{gridTemplateColumns: `160px repeat(${staffMembers.length}, 220px)`}}>
            {/* Time Column Header */}
            <div className="sticky top-0 bg-background z-10 pb-3">
              <div className="flex items-center justify-center gap-2 font-semibold bg-secondary/30 p-3 rounded-lg h-16">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Zeit</span>
              </div>
            </div>
            
            {/* Staff Headers */}
            {staffMembers.map(staff => (
              <div key={staff.id} className="sticky top-0 bg-background z-10 pb-3">
                <div className="p-3 bg-muted rounded-lg h-16 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-3 w-3" />
                    <span className="font-semibold text-xs">
                      {staff.firstName} {staff.lastName}
                    </span>
                  </div>
                  {staff.specialization && (
                    <Badge variant="secondary" className="text-xs">
                      {staff.specialization}
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {/* Time Slots */}
            {timeSlots.map(timeSlot => (
              <React.Fragment key={timeSlot}>
                {/* Time Label */}
                <div className="flex items-center justify-center bg-secondary/20 rounded-lg p-2 h-12 font-medium text-sm">
                  {timeSlot}
                </div>
                
                {/* Staff Slots */}
                {staffMembers.map(staff => {
                  const slot = getSlotStatus(staff, timeSlot, appointments, schedules, leaves);
                  
                  return (
                    <div
                      key={`${staff.id}-${timeSlot}`}
                      className={`p-2 rounded-lg border transition-all duration-200 cursor-pointer h-12 flex items-center justify-center ${
                        slot.status === 'available' 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 hover:scale-105'
                          : slot.status === 'booked'
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:scale-105'
                          : slot.status === 'unavailable'
                          ? 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
                          : slot.status === 'break'
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                          : ''
                      }`}
                      onClick={() => {
                        if (slot.status === 'available') {
                          console.log('Create appointment:', staff.id, timeSlot);
                        } else if (slot.appointment) {
                          console.log('View appointment:', slot.appointment);
                        }
                      }}
                    >
                      <div className="text-center w-full">
                        {slot.status === 'available' && (
                          <div className="text-xs text-green-700 dark:text-green-300 font-semibold">
                            Frei
                          </div>
                        )}
                        
                        {slot.status === 'booked' && slot.appointment && (
                          <div className="space-y-0">
                            {/* Show patient name only in the first slot of the appointment */}
                            {slot.appointment.startTime === timeSlot ? (
                              <>
                                <div className="text-xs font-semibold text-blue-800 dark:text-blue-200 truncate">
                                  {slot.appointment.patient?.firstName} {slot.appointment.patient?.lastName}
                                </div>
                                <div className="text-xs text-blue-600 dark:text-blue-300 truncate">
                                  {slot.appointment.service?.name} ({slot.appointment.service?.duration || 30}min)
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-blue-600 dark:text-blue-300">
                                ···
                              </div>
                            )}
                          </div>
                        )}
                        
                        {slot.status === 'break' && (
                          <div className="flex items-center justify-center gap-1">
                            <Coffee className="h-3 w-3 text-yellow-600" />
                            <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                              Pause
                            </span>
                          </div>
                        )}
                        
                        {slot.status === 'unavailable' && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            -
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded" />
            <span>Verfügbar</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded" />
            <span>Gebucht</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded" />
            <span>Pause</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 dark:bg-gray-900/30 border border-gray-300 dark:border-gray-700 rounded" />
            <span>Nicht verfügbar</span>
          </div>
        </div>
      </div>
    </Card>
  );
}