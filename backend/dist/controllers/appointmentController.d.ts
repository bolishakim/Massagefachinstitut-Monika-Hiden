import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
export declare const appointmentController: {
    getAllAppointments: (req: AuthRequest, res: Response) => Promise<void>;
    getAppointmentById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    createAppointment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    createMultipleAppointments: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    updateAppointment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    deleteAppointment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    checkAvailability: (req: AuthRequest, res: Response) => Promise<void>;
    getCalendarAppointments: (req: AuthRequest, res: Response) => Promise<void>;
    markAppointmentsAsPaid: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    bulkDeleteAppointments: (req: AuthRequest, res: Response) => Promise<void>;
};
//# sourceMappingURL=appointmentController.d.ts.map