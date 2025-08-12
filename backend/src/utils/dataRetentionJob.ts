import cron from 'node-cron';
import { GDPRService } from '../services/gdprService.js';

/**
 * Data retention cleanup job - runs daily at 2 AM
 * Implements automated data deletion per GDPR requirements
 */
export class DataRetentionJob {
  private static isRunning = false;
  private static cronJob: cron.ScheduledTask | null = null;

  /**
   * Start the data retention cleanup job
   */
  static startCleanupJob(): void {
    console.log('🧹 Starting GDPR data retention cleanup job...');

    // Run every day at 2:00 AM
    this.cronJob = cron.schedule('0 2 * * *', async () => {
      if (this.isRunning) {
        console.log('Data cleanup already running, skipping...');
        return;
      }

      this.isRunning = true;
      console.log('🧹 Running automated data retention cleanup...');

      try {
        const result = await GDPRService.cleanupExpiredData();
        
        console.log(`✅ Data cleanup completed: ${result.cleaned} records cleaned`);
        
        if (result.errors.length > 0) {
          console.error('❌ Cleanup errors:');
          result.errors.forEach(error => console.error(`  - ${error}`));
        }
      } catch (error) {
        console.error('❌ Data cleanup failed:', error);
      } finally {
        this.isRunning = false;
      }
    }, {
      scheduled: true,
      timezone: 'Europe/Vienna', // Austrian timezone
    });

    console.log('✅ Data retention cleanup job scheduled (daily at 2:00 AM CET)');
  }

  /**
   * Stop the data retention cleanup job
   */
  static stopCleanupJob(): void {
    if (this.cronJob) {
      this.cronJob.destroy();
      this.cronJob = null;
      console.log('🛑 Data retention cleanup job stopped');
    }
  }

  /**
   * Run cleanup immediately (for testing or manual cleanup)
   */
  static async runCleanupNow(): Promise<{ success: boolean; cleaned: number; errors: string[] }> {
    if (this.isRunning) {
      return {
        success: false,
        cleaned: 0,
        errors: ['Cleanup is already running'],
      };
    }

    this.isRunning = true;
    console.log('🧹 Running manual data retention cleanup...');

    try {
      const result = await GDPRService.cleanupExpiredData();
      console.log(`✅ Manual cleanup completed: ${result.cleaned} records cleaned`);
      
      return {
        success: true,
        cleaned: result.cleaned,
        errors: result.errors,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Manual cleanup failed:', errorMessage);
      
      return {
        success: false,
        cleaned: 0,
        errors: [errorMessage],
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Check if cleanup is currently running
   */
  static isCleanupRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Initialize retention policies on startup
   */
  static async initializeRetentionPolicies(): Promise<void> {
    try {
      console.log('📋 Initializing GDPR retention policies...');
      await GDPRService.initializeRetentionPolicies();
      console.log('✅ GDPR retention policies initialized');
    } catch (error) {
      console.error('❌ Failed to initialize retention policies:', error);
    }
  }
}

// Add manual cleanup endpoint for administrators
export const manualCleanupHandler = async (req: any, res: any) => {
  try {
    const user = req.user;
    
    // Only allow administrators to run manual cleanup
    if (user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Administrative privileges required',
      });
    }

    if (DataRetentionJob.isCleanupRunning()) {
      return res.status(409).json({
        success: false,
        error: 'Data cleanup is already running',
      });
    }

    const result = await DataRetentionJob.runCleanupNow();

    res.json({
      success: result.success,
      message: result.success 
        ? `Cleanup completed: ${result.cleaned} records cleaned`
        : 'Cleanup failed',
      data: {
        recordsCleaned: result.cleaned,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error('Error in manual cleanup handler:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run data cleanup',
    });
  }
};