export declare class PackageUpdater {
    /**
     * Updates the session counts for a package based on its appointments
     * @param packageId - The ID of the package to update
     */
    static updatePackageSessions(packageId: string): Promise<void>;
    /**
     * Updates package sessions for multiple packages
     * @param packageIds - Array of package IDs to update
     */
    static updateMultiplePackages(packageIds: string[]): Promise<void>;
    /**
     * Recalculates session counts for all packages
     * This is useful for fixing any inconsistencies
     */
    static recalculateAllPackages(): Promise<void>;
}
//# sourceMappingURL=packageUpdater.d.ts.map