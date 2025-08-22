import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
export declare const calendarController: {
    getCalendarSettings: (req: AuthRequest, res: Response) => Promise<void>;
    updateCalendarSettings: (req: AuthRequest, res: Response) => Promise<void>;
    getDailySchedule: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getStaffAvailability: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    checkConflicts: (req: AuthRequest, res: Response) => Promise<void>;
};
//# sourceMappingURL=calendarController.d.ts.map