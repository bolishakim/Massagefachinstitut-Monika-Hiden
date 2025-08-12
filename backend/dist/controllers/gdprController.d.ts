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
 * Anonymous consent recording (for non-authenticated users)
 */
export declare const recordAnonymousConsent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=gdprController.d.ts.map