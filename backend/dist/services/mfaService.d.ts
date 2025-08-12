import speakeasy from 'speakeasy';
export interface MFASetupResult {
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
}
export interface MFAVerificationResult {
    success: boolean;
    error?: string;
}
export declare class MFAService {
    private static readonly APP_NAME;
    private static readonly ENCRYPTION_KEY;
    /**
     * Generate a new TOTP secret for a user
     */
    static generateSecret(userEmail: string): speakeasy.GeneratedSecret;
    /**
     * Generate QR code URL for TOTP setup
     */
    static generateQRCode(secret: string): Promise<string>;
    /**
     * Verify TOTP token
     */
    static verifyToken(token: string, secret: string): boolean;
    /**
     * Encrypt TOTP secret for database storage
     */
    static encryptSecret(secret: string): string;
    /**
     * Decrypt TOTP secret from database
     */
    static decryptSecret(encryptedSecret: string): string;
    /**
     * Generate backup codes for recovery
     */
    static generateBackupCodes(count?: number): string[];
    /**
     * Hash backup codes for secure storage
     */
    static hashBackupCodes(codes: string[]): Promise<string[]>;
    /**
     * Verify backup code
     */
    static verifyBackupCode(code: string, hashedCodes: string[]): Promise<boolean>;
    /**
     * Setup MFA for a user (generate secret and backup codes)
     */
    static setupMFA(userId: string): Promise<MFASetupResult>;
    /**
     * Enable MFA after successful token verification
     */
    static enableMFA(userId: string, token: string): Promise<MFAVerificationResult>;
    /**
     * Disable MFA for a user
     */
    static disableMFA(userId: string, token: string): Promise<MFAVerificationResult>;
    /**
     * Verify MFA token during login
     */
    static verifyMFALogin(userId: string, token: string): Promise<MFAVerificationResult>;
    /**
     * Generate new backup codes for a user
     */
    static regenerateBackupCodes(userId: string): Promise<{
        success: boolean;
        codes?: string[];
        error?: string;
    }>;
    /**
     * Check if user has MFA enabled
     */
    static isMFAEnabled(userId: string): Promise<boolean>;
}
//# sourceMappingURL=mfaService.d.ts.map