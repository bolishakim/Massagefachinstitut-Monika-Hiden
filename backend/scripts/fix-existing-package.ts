#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixExistingPackage() {
  console.log('🔧 Fixing existing package with incorrect session count...\n');
  
  try {
    // Find packages with session count = 1 but service session count > 1
    const packages = await prisma.package.findMany({
      include: {
        packageItems: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                sessionCount: true
              }
            }
          }
        },
        patient: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    const corrections = [];
    
    for (const pkg of packages) {
      for (const item of pkg.packageItems) {
        // If packageItem sessionCount is less than service sessionCount, it needs fixing
        if (item.sessionCount < item.service.sessionCount) {
          corrections.push({
            packageName: pkg.name,
            patientName: `${pkg.patient.firstName} ${pkg.patient.lastName}`,
            itemId: item.id,
            serviceName: item.service.name,
            currentSessionCount: item.sessionCount,
            correctSessionCount: item.service.sessionCount, // 1 instance × service sessions
          });
        }
      }
    }

    console.log(`Found ${corrections.length} package items needing correction:\n`);

    for (const correction of corrections) {
      console.log(`📦 Package: "${correction.packageName}" - ${correction.patientName}`);
      console.log(`   Service: "${correction.serviceName}"`);
      console.log(`   Fixing: ${correction.currentSessionCount} → ${correction.correctSessionCount} sessions\n`);

      await prisma.packageItem.update({
        where: { id: correction.itemId },
        data: { sessionCount: correction.correctSessionCount }
      });

      console.log(`✅ Fixed successfully\n`);
    }

    if (corrections.length === 0) {
      console.log('✅ No packages need correction - all session counts are already correct!');
    }
    
  } catch (error) {
    console.error('❌ Error fixing packages:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixExistingPackage()
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });