/**
 * Data retention cleanup job - runs daily at 2 AM
 * Implements automated data deletion per GDPR requirements
 */
export declare class DataRetentionJob {
    private static isRunning;
    private static cronJob;
    /**
     * Start the data retention cleanup job
     */
    static startCleanupJob(): void;
    /**
     * Stop the data retention cleanup job
     */
    static stopCleanupJob(): void;
    /**
     * Run cleanup immediately (for testing or manual cleanup)
     */
    static runCleanupNow(): Promise<{
        success: boolean;
        cleaned: number;
        errors: string[];
    }>;
    /**
     * Check if cleanup is currently running
     */
    static isCleanupRunning(): boolean;
    /**
     * Initialize retention policies on startup
     */
    static initializeRetentionPolicies(): Promise<void>;
}
export declare const manualCleanupHandler: (req: any, res: any) => Promise<any>;
//# sourceMappingURL=dataRetentionJob.d.ts.map