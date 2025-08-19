#!/usr/bin/env node

/**
 * Service Session Count Correction Script
 * 
 * This script fixes the sessionCount field for services that represent
 * multiple sessions but are incorrectly stored as 1 session.
 * 
 * Usage: npx tsx scripts/fix-service-session-counts.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define session count mappings based on service name patterns
const sessionCountRules = [
  // Multi-session voucher packages
  {
    pattern: /10.*\+.*1.*gratis|10.*plus.*1/i,
    sessionCount: 11,
    description: "10 + 1 gratis packages"
  },
  {
    pattern: /5.*\+.*1.*gratis|5.*plus.*1/i,
    sessionCount: 6,
    description: "5 + 1 gratis packages"
  },
  
  // Combination packages (multiple services in one)
  {
    pattern: /kombi.*und|combination.*and/i,
    sessionCount: 2,
    description: "Combination packages with 2 components"
  },
  
  // Extract number patterns for explicit multi-session services
  {
    pattern: /^(\d+)\s*(x|×)\s*(.+)/i,
    sessionCountExtractor: (match: RegExpMatchArray) => parseInt(match[1]),
    description: "Services with explicit count (e.g., '5x Massage')"
  },
  
  // Default single session services (fallback)
  {
    pattern: /.*/,
    sessionCount: 1,
    description: "Default single session services"
  }
];

function calculateSessionCount(serviceName: string): number {
  for (const rule of sessionCountRules) {
    const match = serviceName.match(rule.pattern);
    if (match) {
      if (rule.sessionCountExtractor && typeof rule.sessionCountExtractor === 'function') {
        return rule.sessionCountExtractor(match);
      }
      if (rule.sessionCount) {
        return rule.sessionCount;
      }
    }
  }
  return 1; // Default fallback
}

function getSessionRuleDescription(serviceName: string): string {
  for (const rule of sessionCountRules) {
    const match = serviceName.match(rule.pattern);
    if (match) {
      return rule.description;
    }
  }
  return "Default single session";
}

async function fixServiceSessionCounts() {
  console.log('🔧 Starting Service Session Count Correction...\n');
  
  try {
    // Get all services
    const services = await prisma.service.findMany({
      select: {
        id: true,
        name: true,
        sessionCount: true,
        category: true,
        isVoucher: true,
      },
      orderBy: { name: 'asc' }
    });

    console.log(`📊 Found ${services.length} services to analyze\n`);

    const corrections = [];
    
    // Analyze each service
    for (const service of services) {
      const correctSessionCount = calculateSessionCount(service.name);
      const ruleDescription = getSessionRuleDescription(service.name);
      
      if (service.sessionCount !== correctSessionCount) {
        corrections.push({
          id: service.id,
          name: service.name,
          currentCount: service.sessionCount,
          correctCount: correctSessionCount,
          rule: ruleDescription,
          category: service.category
        });
      }
    }

    console.log(`🎯 Found ${corrections.length} services requiring session count corrections:\n`);

    // Display corrections before applying
    corrections.forEach((correction, index) => {
      console.log(`${index + 1}. "${correction.name}"`);
      console.log(`   Category: ${correction.category}`);
      console.log(`   Current: ${correction.currentCount} → Correct: ${correction.correctCount} sessions`);
      console.log(`   Rule: ${correction.rule}\n`);
    });

    if (corrections.length === 0) {
      console.log('✅ All services already have correct session counts!');
      return;
    }

    // Apply corrections
    console.log('🔄 Applying corrections...\n');
    
    let successCount = 0;
    for (const correction of corrections) {
      try {
        await prisma.service.update({
          where: { id: correction.id },
          data: { sessionCount: correction.correctCount }
        });
        
        console.log(`✅ Updated "${correction.name}": ${correction.currentCount} → ${correction.correctCount}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to update "${correction.name}":`, error);
      }
    }

    console.log(`\n📈 Correction Summary:`);
    console.log(`   ✅ Successfully updated: ${successCount} services`);
    console.log(`   ❌ Failed to update: ${corrections.length - successCount} services`);

    // Verify corrections
    console.log('\n🔍 Verification - Services with session counts > 1:');
    const multiSessionServices = await prisma.service.findMany({
      where: { sessionCount: { gt: 1 } },
      select: { name: true, sessionCount: true, category: true },
      orderBy: { sessionCount: 'desc' }
    });

    multiSessionServices.forEach(service => {
      console.log(`   📦 ${service.name}: ${service.sessionCount} sessions (${service.category})`);
    });

    console.log(`\n✅ Service session count correction completed!`);
    console.log(`📋 Next step: Run package data correction to update existing packages`);

  } catch (error) {
    console.error('❌ Error during service session count correction:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script immediately
fixServiceSessionCounts()
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });

export { fixServiceSessionCounts, calculateSessionCount };