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

      // Count completed sessions per service
      const completedCountsMap = new Map<string, number>();
      
      // Count all non-cancelled appointments per service
      const totalCountsMap = new Map<string, number>();
      
      appointments.forEach(appointment => {
        // Count total appointments per service
        const currentTotal = totalCountsMap.get(appointment.serviceId) || 0;
        totalCountsMap.set(appointment.serviceId, currentTotal + 1);
        
        // Count completed appointments
        if (appointment.status === AppointmentStatus.COMPLETED) {
          const currentCount = completedCountsMap.get(appointment.serviceId) || 0;
          completedCountsMap.set(appointment.serviceId, currentCount + 1);
        }
      });

      // Update each package item with the completed count
      for (const item of packageItems) {
        const completedCount = completedCountsMap.get(item.serviceId) || 0;
        
        await prisma.packageItem.update({
          where: { id: item.id },
          data: { completedCount }
        });
      }

      // Check if all sessions are completed
      const allCompleted = packageItems.every(item => {
        const completedCount = completedCountsMap.get(item.serviceId) || 0;
        return completedCount >= item.sessionCount;
      });

      // Get current package status
      const currentPackage = await prisma.package.findUnique({
        where: { id: packageId },
        select: { status: true }
      });

      // Update package status if needed
      if (allCompleted && currentPackage?.status !== PackageStatus.COMPLETED) {
        await prisma.package.update({
          where: { id: packageId },
          data: { status: PackageStatus.COMPLETED }
        });
      } else if (!allCompleted && currentPackage?.status === PackageStatus.COMPLETED) {
        // Reopen package if sessions were uncompleted
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