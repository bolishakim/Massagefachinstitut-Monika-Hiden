import { Request, Response } from 'express';
/**
 * Record user consent for data processing
 */
export declare const recordConsent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Record multiple consents at once (for consent banner)
 */
export declare const recordBulkConsent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get user's current consent status
 */
export declare const getUserConsent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Export user data (GDPR Article 20 - Data Portability)
 */
export declare const exportUserData: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Download exported data file
 */
export declare const downloadExport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Request account deletion (GDPR Article 17 - Right to Erasure)
 */
export declare const requestAccountDeletion: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get GDPR compliance information (for privacy page)
 */
export declare const getComplianceInfo: (req: Request, res: Response) => Promise<void>;
/**
 * Request patient data deletion (GDPR Article 17 - Right to Erasure for Medical Data)
 */
export declare const requestPatientDeletion: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Bulk delete patients (GDPR Article 17 - Admin only)
 */
export declare const bulkDeletePatients: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Export specific patient data (GDPR Article 20 - Data Portability for Medical Data)
 */
export declare const exportPatientData: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Download patient export file
 */
export declare const downloadPatientExport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Anonymous consent recording (for non-authenticated users)
 */
export declare const recordAnonymousConsent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=gdprController.d.ts.map