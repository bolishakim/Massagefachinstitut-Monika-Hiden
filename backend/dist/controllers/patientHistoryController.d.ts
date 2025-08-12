import { Request, Response } from 'express';
export declare const getPatientHistory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPatientHistoryById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createPatientHistory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updatePatientHistory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deletePatientHistory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=patientHistoryController.d.ts.map