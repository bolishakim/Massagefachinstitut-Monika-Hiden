import { Request, Response } from 'express';
export declare const getPackages: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPackageById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createPackage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updatePackage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const cancelPackage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const addPayment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPackageStats: (req: Request, res: Response) => Promise<void>;
export declare const recalculateAllPackageSessions: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=packageController.d.ts.map