import { Request, Response, NextFunction } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}
export declare const enhancedAuditMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const patientAccessLogger: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export { enhancedAuditMiddleware as default };
//# sourceMappingURL=enhancedAuditMiddleware.d.ts.map