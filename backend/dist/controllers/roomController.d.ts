import { Request, Response } from 'express';
export declare const getRooms: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getRoomById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createRoom: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateRoom: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteRoom: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const bulkDeleteRooms: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const reactivateRoom: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const searchRooms: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getRoomStats: (req: Request, res: Response) => Promise<void>;
export declare const getRoomAvailability: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=roomController.d.ts.map