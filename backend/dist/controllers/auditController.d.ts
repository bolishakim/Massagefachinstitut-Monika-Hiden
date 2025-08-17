import { Request, Response } from 'express';
import { Role } from '@prisma/client';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: Role;
    };
}
export declare const auditController: {
    getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getGDPRAuditLogs(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getPatientAccessReport(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getSystemActivitySummary(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getSecurityEvents(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getMyAuditLogs(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getComplianceReport(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getAuditDashboard(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getAuditLogFilterOptions(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getGDPRLogFilterOptions(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
};
export {};
//# sourceMappingURL=auditController.d.ts.map