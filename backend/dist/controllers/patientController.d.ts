import { Request, Response } from 'express';
export declare const getPatients: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPatientById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createPatient: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updatePatient: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deletePatient: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const bulkDeletePatients: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const reactivatePatient: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const hardDeletePatient: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const bulkHardDeletePatients: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const searchPatients: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=patientController.d.ts.map