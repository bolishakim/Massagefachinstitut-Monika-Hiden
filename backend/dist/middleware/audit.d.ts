import { Request, Response, NextFunction } from 'express';
/**
 * Middleware to add audit information to request context
 */
export declare const auditMiddleware: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Helper function to get user ID from request
 */
export declare const getUserId: (req: Request) => string | null;
/**
 * Interface to extend Express Request with audit helpers
 */
declare global {
    namespace Express {
        interface Request {
            audit?: {
                logCreate: (tableName: string, recordId: string, newValues: any, description?: string) => Promise<void>;
                logUpdate: (tableName: string, recordId: string, oldValues: any, newValues: any, description?: string) => Promise<void>;
                logDelete: (tableName: string, recordId: string, oldValues: any, description?: string) => Promise<void>;
                getUserId: () => string | null;
            };
        }
    }
}
//# sourceMappingURL=audit.d.ts.map