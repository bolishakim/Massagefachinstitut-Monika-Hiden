#!/usr/bin/env node

/**
 * Package Session Count Correction Script
 * 
 * This script fixes the sessionCount field in PackageItems to reflect
 * the corrected service session counts. It updates existing packages
 * that were created before service session counts were fixed.
 * 
 * Usage: npx tsx scripts/fix-package-session-counts.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPackageSessionCounts() {
  console.log('🔧 Starting Package Session Count Correction...\n');
  
  try {
    // Get all packages with their package items and services
    const packages = await prisma.package.findMany({
      include: {
        packageItems: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                sessionCount: true,
              }
            }
          }
        },
        patient: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Found ${packages.length} packages to analyze\n`);

    const corrections = [];
    
    // Analyze each package
    for (const pkg of packages) {
      for (const item of pkg.packageItems) {
        const service = item.service;
        
        // Calculate what the session count should be based on current service data
        // The packageItem.sessionCount should be the number of instances × service.sessionCount
        
        // First, we need to determine how many instances were originally intended
        // Since the old logic was: instances × 1 (because service.sessionCount was 1)
        // The current item.sessionCount represents the original instances count
        
        // If service now has sessionCount > 1, we need to update the packageItem
        if (service.sessionCount > 1) {
          const originalInstances = Math.floor(item.sessionCount / service.sessionCount);
          const correctTotalSessions = originalInstances * service.sessionCount;
          
          // Only correct if the calculation results in a different value
          if (item.sessionCount !== correctTotalSessions && correctTotalSessions > 0) {
            corrections.push({
              packageId: pkg.id,
              packageName: pkg.name,
              patientName: `${pkg.patient.firstName} ${pkg.patient.lastName}`,
              itemId: item.id,
              serviceName: service.name,
              currentSessionCount: item.sessionCount,
              correctSessionCount: correctTotalSessions,
              originalInstances,
              serviceSessionCount: service.sessionCount,
            });
          }
        }
      }
    }

    console.log(`🎯 Found ${corrections.length} package items requiring session count corrections:\n`);

    // Display corrections before applying
    corrections.forEach((correction, index) => {
      console.log(`${index + 1}. Package: "${correction.packageName}"`);
      console.log(`   Patient: ${correction.patientName}`);
      console.log(`   Service: "${correction.serviceName}"`);
      console.log(`   Original instances: ${correction.originalInstances} × ${correction.serviceSessionCount} sessions each`);
      console.log(`   Current: ${correction.currentSessionCount} → Correct: ${correction.correctSessionCount} sessions\n`);
    });

    if (corrections.length === 0) {
      console.log('✅ All package items already have correct session counts!');
      return;
    }

    // Apply corrections
    console.log('🔄 Applying corrections...\n');
    
    let successCount = 0;
    for (const correction of corrections) {
      try {
        await prisma.packageItem.update({
          where: { id: correction.itemId },
          data: { sessionCount: correction.correctSessionCount }
        });
        
        console.log(`✅ Updated package "${correction.packageName}" - ${correction.serviceName}: ${correction.currentSessionCount} → ${correction.correctSessionCount}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to update package item for "${correction.packageName}":`, error);
      }
    }

    console.log(`\n📈 Correction Summary:`);
    console.log(`   ✅ Successfully updated: ${successCount} package items`);
    console.log(`   ❌ Failed to update: ${corrections.length - successCount} package items`);

    // Verification - Show packages with multi-session items
    console.log('\n🔍 Verification - Packages with items having session counts > 1:');
    const multiSessionPackages = await prisma.package.findMany({
      include: {
        packageItems: {
          where: { sessionCount: { gt: 1 } },
          include: {
            service: {
              select: { name: true, sessionCount: true }
            }
          }
        },
        patient: {
          select: { firstName: true, lastName: true }
        }
      },
      where: {
        packageItems: {
          some: { sessionCount: { gt: 1 } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    multiSessionPackages.forEach(pkg => {
      console.log(`   📦 ${pkg.name} - ${pkg.patient.firstName} ${pkg.patient.lastName}`);
      pkg.packageItems.forEach(item => {
        const instances = Math.floor(item.sessionCount / item.service.sessionCount);
        console.log(`      - ${item.service.name}: ${item.sessionCount} total sessions (${instances} × ${item.service.sessionCount})`);
      });
    });

    console.log(`\n✅ Package session count correction completed!`);
    console.log(`📋 Multi-session service package logic is now fully functional`);

  } catch (error) {
    console.error('❌ Error during package session count correction:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script immediately
fixPackageSessionCounts()
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });

export { fixPackageSessionCounts };