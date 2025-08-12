interface ConnectionStats {
    isHealthy: boolean;
    lastCheck: Date;
    uptime: number;
    failureCount: number;
    lastError?: string;
}
declare class DatabaseConnectionMonitor {
    private stats;
    private startTime;
    checkConnection(): Promise<ConnectionStats>;
    private reconnect;
    getStats(): ConnectionStats;
    startMonitoring(intervalMs?: number): void;
    logMemoryUsage(): void;
    startMemoryMonitoring(intervalMs?: number): void;
}
export declare const connectionMonitor: DatabaseConnectionMonitor;
export default connectionMonitor;
//# sourceMappingURL=connectionMonitor.d.ts.map