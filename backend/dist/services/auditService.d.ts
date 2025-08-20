import { AuditAction } from '@prisma/client';
import { Request } from 'express';
export interface AuditQuery {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    action?: string;
    resource?: string;
    resourceId?: string;
    ipAddress?: string;
    page?: number;
    limit?: number;
}
export interface PatientAccessReport {
    patientId: string;
    patientName: string;
    accessCount: number;
    lastAccessed: Date;
    accessedBy: Array<{
        userId: string;
        userName: string;
        role: string;
        accessCount: number;
        lastAccessed: Date;
    }>;
    individualAccesses?: Array<{
        id: string;
        timestamp: Date;
        userId: string;
        userName: string;
        userEmail: string;
        userRole: string;
        action: string;
        source: string;
        ipAddress?: string;
        userAgent?: string;
        dataType: string;
        accessType: string;
        purpose: string;
        legalBasis: string;
    }>;
}
export interface SystemActivitySummary {
    totalActions: number;
    uniqueUsers: number;
    topActions: Array<{
        action: string;
        count: number;
    }>;
    hourlyDistribution: Array<{
        hour: number;
        count: number;
    }>;
    userActivity: Array<{
        userId: string;
        userName: string;
        role: string;
        actionCount: number;
        lastActivity: Date;
    }>;
}
export interface SecurityEvent {
    id: string;
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    userId?: string;
    userName?: string;
    ipAddress?: string;
    timestamp: Date;
    details: any;
}
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
declare class EnhancedAuditService {
    static createAuditLog(data: AuditLogData): Promise<void>;
    static getUserFromRequest(req: Request): {
        userId: string;
        ipAddress?: string;
        userAgent?: string;
    };
    static logCreate(req: Request, tableName: string, recordId: string, newValues: any, description?: string): Promise<void>;
    static logUpdate(req: Request, tableName: string, recordId: string, oldValues: any, newValues: any, description?: string): Promise<void>;
    static logDelete(req: Request, tableName: string, recordId: string, oldValues: any, description?: string): Promise<void>;
    static cleanSensitiveData(data: any): any;
    getAuditLogs(query: AuditQuery): Promise<{
        logs: ({
            user: {
                id: string;
                email: string | null;
                firstName: string;
                lastName: string;
                role: import("@prisma/client").$Enums.Role;
            };
        } & {
            userId: string;
            id: string;
            createdAt: Date;
            action: import("@prisma/client").$Enums.AuditAction;
            tableName: string;
            recordId: string;
            oldValues: import("@prisma/client/runtime/library").JsonValue | null;
            newValues: import("@prisma/client/runtime/library").JsonValue | null;
            description: string | null;
            ipAddress: string | null;
            userAgent: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getGDPRAuditLogs(query: AuditQuery): Promise<{
        logs: ({
            user: {
                id: string;
                email: string | null;
                firstName: string;
                lastName: string;
                role: import("@prisma/client").$Enums.Role;
            } | null;
        } & {
            userId: string | null;
            id: string;
            createdAt: Date;
            action: import("@prisma/client").$Enums.GDPRAction;
            recordId: string | null;
            ipAddress: string | null;
            userAgent: string | null;
            dataType: string;
            legalBasis: string | null;
            purpose: string;
            consentId: string | null;
            automated: boolean;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getPatientAccessReport(patientId?: string, days?: number): Promise<PatientAccessReport[]>;
    private groupIntoAccessSessions;
    private groupLogsIntoSessions;
    private processPatientAccessSession;
    private processPatientAccessLog;
    private extractPatientIdFromAuditLog;
    private getDetailedAccessSessions;
    private generateAccessSummary;
    getSystemActivitySummary(days?: number): Promise<SystemActivitySummary>;
    getSecurityEvents(hours?: number): Promise<SecurityEvent[]>;
    getAuditLogFilterOptions(): Promise<{
        actions: {
            value: import("@prisma/client").$Enums.AuditAction;
            label: string;
        }[];
        resources: {
            value: string;
            label: string;
        }[];
        users: {
            value: string;
            label: string;
            role: import("@prisma/client").$Enums.Role;
        }[];
    }>;
    getGDPRLogFilterOptions(): Promise<{
        actions: {
            value: import("@prisma/client").$Enums.GDPRAction;
            label: string;
        }[];
        dataTypes: {
            value: string;
            label: string;
        }[];
        users: {
            value: string;
            label: string;
            role: import("@prisma/client").$Enums.Role;
        }[];
    }>;
}
export declare const AuditService: typeof EnhancedAuditService;
declare const _default: EnhancedAuditService;
export default _default;
//# sourceMappingURL=auditService.d.ts.map