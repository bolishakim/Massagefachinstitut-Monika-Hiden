import { apiService } from './api';
import { format } from 'date-fns';
import { 
  CalendarSettings, 
  StaffScheduleData, 
  CalendarApiResponse 
} from '@/types/calendar';

class CalendarService {
  private baseUrl = '/calendar';

  /**
   * Get calendar settings for a user
   */
  async getCalendarSettings(userId?: string): Promise<CalendarApiResponse<CalendarSettings>> {
    try {
      const url = userId 
        ? `${this.baseUrl}/settings/${userId}`
        : `${this.baseUrl}/settings`;
      
      const response = await apiService.get<CalendarApiResponse<CalendarSettings>>(url);
      return response;
    } catch (error) {
      console.error('Error fetching calendar settings:', error);
      return {
        success: false,
        error: 'Fehler beim Laden der Kalendereinstellungen'
      };
    }
  }

  /**
   * Update calendar settings
   */
  async updateCalendarSettings(
    settings: Partial<CalendarSettings>, 
    userId?: string
  ): Promise<CalendarApiResponse<CalendarSettings>> {
    try {
      const url = userId 
        ? `${this.baseUrl}/settings/${userId}`
        : `${this.baseUrl}/settings`;
      
      const response = await apiService.put<CalendarApiResponse<CalendarSettings>>(url, settings);
      return response.data;
    } catch (error) {
      console.error('Error updating calendar settings:', error);
      return {
        success: false,
        error: 'Fehler beim Aktualisieren der Kalendereinstellungen'
      };
    }
  }

  /**
   * Get daily schedule data
   */
  async getDailySchedule(date: Date): Promise<CalendarApiResponse<StaffScheduleData>> {
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const response = await apiService.get<CalendarApiResponse<StaffScheduleData>>(
        `${this.baseUrl}/daily-schedule?date=${formattedDate}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching daily schedule:', error);
      return {
        success: false,
        error: 'Fehler beim Laden des Tagesplans'
      };
    }
  }

  /**
   * Get staff availability for a specific date
   */
  async getStaffAvailability(
    staffId: string, 
    date: Date
  ): Promise<CalendarApiResponse<any>> {
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const response = await apiService.get<CalendarApiResponse<any>>(
        `${this.baseUrl}/staff-availability?staffId=${staffId}&date=${formattedDate}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching staff availability:', error);
      return {
        success: false,
        error: 'Fehler beim Laden der Mitarbeiterverfügbarkeit'
      };
    }
  }

  /**
   * Get calendar events for a date range
   */
  async getCalendarEvents(
    startDate: Date,
    endDate: Date,
    filters?: {
      staffId?: string;
      roomId?: string;
      serviceId?: string;
      patientId?: string;
    }
  ): Promise<CalendarApiResponse<any[]>> {
    try {
      const params = new URLSearchParams({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        ...filters
      });

      const response = await apiService.get<CalendarApiResponse<any[]>>(
        `${this.baseUrl}/events?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return {
        success: false,
        error: 'Fehler beim Laden der Kalendereinträge'
      };
    }
  }

  /**
   * Check for conflicts when scheduling
   */
  async checkConflicts(data: {
    staffId: string;
    roomId: string;
    date: Date;
    startTime: string;
    duration: number;
    excludeAppointmentId?: string;
  }): Promise<CalendarApiResponse<any>> {
    try {
      const response = await apiService.post<CalendarApiResponse<any>>(
        `${this.baseUrl}/check-conflicts`,
        {
          ...data,
          date: format(data.date, 'yyyy-MM-dd')
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return {
        success: false,
        error: 'Fehler beim Prüfen von Konflikten'
      };
    }
  }
}

export const calendarService = new CalendarService();