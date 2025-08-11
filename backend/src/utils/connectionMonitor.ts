import prisma from './db.js';

interface ConnectionStats {
  isHealthy: boolean;
  lastCheck: Date;
  uptime: number;
  failureCount: number;
  lastError?: string;
}

class DatabaseConnectionMonitor {
  private stats: ConnectionStats = {
    isHealthy: true,
    lastCheck: new Date(),
    uptime: 0,
    failureCount: 0,
  };

  private startTime = new Date();

  async checkConnection(): Promise<ConnectionStats> {
    try {
      const startTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      this.stats = {
        isHealthy: true,
        lastCheck: new Date(),
        uptime: Date.now() - this.startTime.getTime(),
        failureCount: this.stats.failureCount,
      };

      if (responseTime > 5000) {
        console.warn(`⚠️  Slow database response: ${responseTime}ms`);
      }

    } catch (error) {
      this.stats = {
        isHealthy: false,
        lastCheck: new Date(),
        uptime: Date.now() - this.startTime.getTime(),
        failureCount: this.stats.failureCount + 1,
        lastError: error instanceof Error ? error.message : 'Unknown error',
      };

      console.error('❌ Database connection check failed:', error);
      
      // Attempt to reconnect if connection is lost
      try {
        await this.reconnect();
      } catch (reconnectError) {
        console.error('❌ Failed to reconnect:', reconnectError);
      }
    }

    return this.stats;
  }

  private async reconnect(): Promise<void> {
    console.log('🔄 Attempting to reconnect to database...');
    await prisma.$disconnect();
    await prisma.$connect();
    console.log('✅ Database reconnected successfully');
  }

  getStats(): ConnectionStats {
    return { ...this.stats };
  }

  startMonitoring(intervalMs: number = 2 * 60 * 1000): void {
    console.log(`📊 Starting database connection monitoring (interval: ${intervalMs / 1000}s)`);
    
    setInterval(async () => {
      const stats = await this.checkConnection();
      
      if (stats.failureCount > 0 && stats.failureCount % 5 === 0) {
        console.warn(`⚠️  Database has failed ${stats.failureCount} times`);
      }
    }, intervalMs);
  }

  // Memory usage monitoring
  logMemoryUsage(): void {
    const usage = process.memoryUsage();
    console.log('📊 Memory Usage:', {
      rss: `${Math.round(usage.rss / 1024 / 1024 * 100) / 100} MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100} MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100} MB`,
      external: `${Math.round(usage.external / 1024 / 1024 * 100) / 100} MB`,
    });
  }

  startMemoryMonitoring(intervalMs: number = 10 * 60 * 1000): void {
    console.log(`📊 Starting memory monitoring (interval: ${intervalMs / 1000}s)`);
    
    setInterval(() => {
      this.logMemoryUsage();
      
      // Force garbage collection in development if available
      if (process.env.NODE_ENV === 'development' && global.gc) {
        global.gc();
        console.log('🗑️  Forced garbage collection');
      }
    }, intervalMs);
  }
}

export const connectionMonitor = new DatabaseConnectionMonitor();
export default connectionMonitor;