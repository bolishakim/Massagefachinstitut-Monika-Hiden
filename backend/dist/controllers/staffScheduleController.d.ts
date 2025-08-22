import type { Request, Response } from 'express';
export declare const getStaffSchedules: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getStaffScheduleById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createStaffSchedule: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateStaffSchedule: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteStaffSchedule: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getSchedulesByStaff: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=staffScheduleController.d.ts.map