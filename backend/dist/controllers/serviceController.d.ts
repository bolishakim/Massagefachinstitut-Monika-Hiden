import { Request, Response } from 'express';
export declare const getServices: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getServiceById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createService: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateService: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteService: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const bulkDeleteServices: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const reactivateService: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const searchServices: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getServiceStats: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=serviceController.d.ts.map