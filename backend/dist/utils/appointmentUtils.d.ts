export declare function calculateEndTime(startTime: string, durationMinutes: number): string;
export declare function timeOverlaps(start1: string, end1: string, start2: string, end2: string): boolean;
export declare function timeToMinutes(time: string): number;
export declare function validateAppointmentTime(staffId: string, date: string | Date, startTime: string, endTime: string): Promise<boolean>;
export declare function checkTimeConflict(date: string | Date, startTime: string, endTime: string, roomId?: string, staffId?: string, excludeAppointmentId?: string): Promise<any[]>;
export declare function getAvailableTimeSlots(date: Date, staffId: string, serviceDuration: number, timeSlotInterval?: number): Promise<string[]>;
//# sourceMappingURL=appointmentUtils.d.ts.map