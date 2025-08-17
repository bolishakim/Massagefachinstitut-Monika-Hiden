import { ConsentType, GDPRAction } from '@prisma/client';
import { Request } from 'express';
interface ConsentData {
    consentType: ConsentType;
    granted: boolean;
    consentString?: string;
    expiresAt?: Date;
}
interface DataExportResult {
    success: boolean;
    filePath?: string;
    requestId?: string;
    error?: string;
}
export declare class GDPRService {
    /**
     * Record user consent for data processing
     */
    static recordConsent(req: Request, userId: string | null, consentData: ConsentData): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Get user's current consent status
     */
    static getUserConsent(userId: string): Promise<Record<ConsentType, boolean>>;
    /**
     * Export all user data for GDPR compliance
     */
    static exportUserData(req: Request, userId: string): Promise<DataExportResult>;
    /**
     * Collect all user data for export
     */
    private static collectAllUserData;
    /**
     * Hard delete user and all related data (Right to Erasure)
     */
    static hardDeleteUser(req: Request, userId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Log GDPR-specific actions for compliance audit trail
     */
    static logGDPRAction(req: Request, userId: string | null, action: GDPRAction, dataType: string, recordId: string | null, legalBasis: string, purpose: string, automated?: boolean, consentId?: string): Promise<void>;
    /**
     * Clean up expired data per retention policies
     */
    static cleanupExpiredData(): Promise<{
        cleaned: number;
        errors: string[];
    }>;
    /**
     * Clean up expired export files from disk
     */
    private static cleanupExportFiles;
    /**
     * Hard delete patient and all related medical data (GDPR Article 17 - Right to Erasure)
     * This overrides the 30-year medical data retention when legally requested
     */
    static hardDeletePatient(req: Request, patientId: string, requestedBy?: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Bulk hard delete patients (GDPR Article 17)
     */
    static bulkHardDeletePatients(req: Request, patientIds: string[], requestedBy?: string): Promise<{
        success: boolean;
        deletedCount: number;
        errors: string[];
    }>;
    /**
     * Export patient data for GDPR compliance (specific patient)
     */
    static exportPatientData(req: Request, patientId: string): Promise<DataExportResult>;
    /**
     * Initialize default retention policies
     */
    static initializeRetentionPolicies(): Promise<void>;
}
export {};
//# sourceMappingURL=gdprService.d.ts.map