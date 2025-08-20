/**
 * Utility function to calculate the actual session count from a service name.
 * This handles multi-session services like "10 Teilmassage + 1 Teilmassage gratis" = 11 sessions
 */
export declare function calculateSessionCountFromServiceName(serviceName: string): number;
/**
 * Helper function to get the total actual sessions for a package item
 */
export declare function getTotalSessionsForPackageItem(packageItemCount: number, serviceSessionCount: number): number;
/**
 * Helper function to get the total used sessions for a package item
 */
export declare function getUsedSessionsForPackageItem(completedCount: number, serviceSessionCount: number): number;
//# sourceMappingURL=sessionCalculator.d.ts.map