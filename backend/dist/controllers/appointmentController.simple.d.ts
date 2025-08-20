import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
        email?: string;
        role: string;
        firstName: string;
        lastName: string;
    };
}
export declare const appointmentController: {
    getAllAppointments: (req: AuthRequest, res: Response) => Promise<void>;
    getAppointmentById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    createAppointment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    updateAppointment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    deleteAppointment: (req: AuthRequest, res: Response) => Promise<void>;
    checkAvailability: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getCalendarAppointments: (req: AuthRequest, res: Response) => Promise<void>;
    createMultipleAppointments: (req: AuthRequest, res: Response) => Promise<void>;
    markAppointmentsAsPaid: (req: AuthRequest, res: Response) => Promise<void>;
    bulkDeleteAppointments: (req: AuthRequest, res: Response) => Promise<void>;
};
export {};
//# sourceMappingURL=appointmentController.simple.d.ts.map