import prisma from './db.js';
import { AppointmentStatus, PackageStatus } from '@prisma/client';

export class PackageUpdater {
  /**
   * Updates the session counts for a package based on its appointments
   * @param packageId - The ID of the package to update
   */
  static async updatePackageSessions(packageId: string): Promise<void> {
    try {
      // Get all appointments for this package (excluding cancelled ones)
      const appointments = await prisma.appointment.findMany({
        where: {
          packageId,
          status: {
            not: AppointmentStatus.CANCELLED
          }
        },
        select: {
          serviceId: true,
          status: true
        }
      });

      // Get package items to update
      const packageItems = await prisma.packageItem.findMany({
        where: { packageId }
      });

      // Count used sessions per service (only COMPLETED and NO_SHOW)
      const usedSessionsMap = new Map<string, number>();
      
      // Count remaining sessions per service (all appointments excluding CANCELLED)
      const remainingSessionsMap = new Map<string, number>();
      
      appointments.forEach(appointment => {
        // Count all non-cancelled appointments as "remaining sessions used"
        const currentRemaining = remainingSessionsMap.get(appointment.serviceId) || 0;
        remainingSessionsMap.set(appointment.serviceId, currentRemaining + 1);
        
        // Count only completed and no-show appointments as "used sessions"
        if (appointment.status === AppointmentStatus.COMPLETED || appointment.status === AppointmentStatus.NO_SHOW) {
          const currentUsed = usedSessionsMap.get(appointment.serviceId) || 0;
          usedSessionsMap.set(appointment.serviceId, currentUsed + 1);
        }
      });

      // Update each package item with the used sessions count (COMPLETED + NO_SHOW)
      for (const item of packageItems) {
        const usedCount = usedSessionsMap.get(item.serviceId) || 0;
        
        await prisma.packageItem.update({
          where: { id: item.id },
          data: { completedCount: usedCount }
        });
      }

      // Check if all sessions are used (COMPLETED or NO_SHOW)
      const allUsed = packageItems.every(item => {
        const usedCount = usedSessionsMap.get(item.serviceId) || 0;
        return usedCount >= item.sessionCount;
      });

      // Get current package status
      const currentPackage = await prisma.package.findUnique({
        where: { id: packageId },
        select: { status: true }
      });

      // Update package status if needed
      if (allUsed && currentPackage?.status !== PackageStatus.COMPLETED) {
        await prisma.package.update({
          where: { id: packageId },
          data: { status: PackageStatus.COMPLETED }
        });
      } else if (!allUsed && currentPackage?.status === PackageStatus.COMPLETED) {
        // Reopen package if sessions were not all used
        await prisma.package.update({
          where: { id: packageId },
          data: { status: PackageStatus.ACTIVE }
        });
      }
    } catch (error) {
      console.error('Error updating package sessions:', error);
      throw error;
    }
  }

  /**
   * Updates package sessions for multiple packages
   * @param packageIds - Array of package IDs to update
   */
  static async updateMultiplePackages(packageIds: string[]): Promise<void> {
    for (const packageId of packageIds) {
      await this.updatePackageSessions(packageId);
    }
  }

  /**
   * Recalculates session counts for all packages
   * This is useful for fixing any inconsistencies
   */
  static async recalculateAllPackages(): Promise<void> {
    try {
      // Get all active packages
      const packages = await prisma.package.findMany({
        where: {
          status: {
            not: 'CANCELLED'
          }
        },
        select: { id: true }
      });

      console.log(`Recalculating sessions for ${packages.length} packages...`);

      for (const pkg of packages) {
        await this.updatePackageSessions(pkg.id);
      }

      console.log('All packages recalculated successfully');
    } catch (error) {
      console.error('Error recalculating all packages:', error);
      throw error;
    }
  }
}