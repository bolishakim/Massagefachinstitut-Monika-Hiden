# Daily Staff Schedule View - Design Document

## Overview
Create a comprehensive daily schedule view showing staff availability, appointments, and time slots for the current day.

## Data Flow Architecture

### 1. **Data Sources Integration**

```typescript
interface DailyScheduleData {
  // Calendar configuration
  calendarSettings: CalendarSetting;
  
  // Staff data
  staffMembers: StaffMember[];
  
  // Schedule data for today
  scheduleData: {
    staffSchedules: StaffSchedule[];    // Regular hours
    staffLeaves: StaffLeave[];          // Absences
    appointments: Appointment[];         // Booked slots
  };
  
  // Supporting data
  rooms: Room[];
  services: Service[];
}
```

### 2. **Component Structure**

```
DailySchedulePage
├── ScheduleHeader (Date, Navigation)
├── TimeSlotGrid
│   ├── TimeColumn (08:00-20:00)
│   └── StaffColumns
│       ├── StaffHeader (Name, Specialization)
│       ├── AvailabilityBlocks
│       │   ├── WorkingHours (from StaffSchedule)
│       │   ├── BreakTime (grayed out)
│       │   └── LeaveBlocks (from StaffLeave)
│       └── AppointmentSlots
│           ├── BookedAppointment
│           ├── AvailableSlot
│           └── UnavailableSlot
└── ScheduleLegend
```

### 3. **Data Processing Logic**

#### Step 1: Load Calendar Settings
```typescript
const calendarSettings = await getCalendarSettings(userId);
// Determines: workingHours, timeSlotInterval, display preferences
```

#### Step 2: Get Active Staff for Today
```typescript
const activeStaff = await getActiveStaffMembers();
// Filter: Users with specialization, isActive=true
```

#### Step 3: Build Schedule Matrix
```typescript
for each staff member:
  1. Get regular schedule (StaffSchedule where dayOfWeek = today)
  2. Check for leave (StaffLeave where today between startDate-endDate)
  3. Get appointments (Appointment where staffId && scheduledDate = today)
  4. Calculate available slots based on:
     - Working hours minus break time
     - Minus approved leave time
     - Minus booked appointments
```

### 4. **Time Slot Calculation**

```typescript
interface TimeSlot {
  startTime: string;    // "09:00"
  endTime: string;      // "09:30"
  status: SlotStatus;
  appointment?: Appointment;
  isBreakTime?: boolean;
  conflictInfo?: string;
}

enum SlotStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  BREAK = 'break',
  UNAVAILABLE = 'unavailable',
  CONFLICT = 'conflict'
}
```

### 5. **Visual Design**

- **Grid Layout**: Time on Y-axis, Staff on X-axis
- **Color Coding**:
  - Green: Available slots
  - Blue: Booked appointments (use service.categoryColor)
  - Gray: Break time
  - Red: Conflicts/Unavailable
  - Yellow: Partially available
  
- **Interactive Elements**:
  - Click available slot → Create appointment
  - Click booked slot → View appointment details
  - Hover → Show tooltip with details

### 6. **Real-time Updates**

Use `autoRefreshInterval` from calendar_settings to:
- Refresh appointment data
- Update availability status
- Show new bookings/cancellations

### 7. **Conflict Detection**

Check for:
- Double bookings (same staff, overlapping times)
- Room conflicts (same room, overlapping times)
- Staff on leave but has appointments
- Appointments outside working hours

## API Endpoints Needed

1. `GET /api/calendar/daily-schedule?date=YYYY-MM-DD`
   - Returns all data needed for the daily view
   
2. `GET /api/calendar/settings/:userId?`
   - Returns calendar display preferences
   
3. `GET /api/staff/availability?date=YYYY-MM-DD&staffId=xxx`
   - Returns available time slots for a staff member

## Component Implementation Plan

1. Create `DailySchedulePage` component
2. Implement data fetching hooks
3. Build time slot grid renderer
4. Add appointment slot components
5. Implement click handlers for slot interaction
6. Add real-time refresh logic
7. Create responsive mobile view