import { AuditAction } from '@prisma/client';
import { Request } from 'express';
interface AuditLogData {
    userId: string;
    action: AuditAction;
    tableName: string;
    recordId: string;
    oldValues?: any;
    newValues?: any;
    description?: string;
    ipAddress?: string;
    userAgent?: string;
}
export declare class AuditService {
    /**
     * Create an audit log entry
     */
    static createAuditLog(data: AuditLogData): Promise<void>;
    /**
     * Extract user info from request (assuming user is attached via auth middleware)
     */
    static getUserFromRequest(req: Request): {
        userId: string;
        ipAddress?: string;
        userAgent?: string;
    };
    /**
     * Log creation of a record
     */
    static logCreate(req: Request, tableName: string, recordId: string, newValues: any, description?: string): Promise<void>;
    /**
     * Log update of a record
     */
    static logUpdate(req: Request, tableName: string, recordId: string, oldValues: any, newValues: any, description?: string): Promise<void>;
    /**
     * Log deletion of a record
     */
    static logDelete(req: Request, tableName: string, recordId: string, oldValues: any, description?: string): Promise<void>;
    /**
     * Clean sensitive data from values before logging
     */
    static cleanSensitiveData(data: any): any;
}
export {};
//# sourceMappingURL=auditService.d.ts.map