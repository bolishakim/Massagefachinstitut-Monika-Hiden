#!/usr/bin/env node

/**
 * Database Reset Script for Medical Center Application
 * 
 * This script:
 * 1. Clears all data from the database
 * 2. Creates 3 users with different roles (ADMIN, MODERATOR, USER)
 * 3. Initializes GDPR retention policies
 * 
 * Usage: node reset-database.js
 */

import { PrismaClient, Role } from '@prisma/client';
import { PasswordUtils } from './src/utils/password.ts';

const prisma = new PrismaClient();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

async function clearDatabase() {
  log('\n🧹 Clearing database...', colors.yellow);
  
  try {
    // Clear all tables in correct order (respecting foreign key constraints)
    const tablesToClear = [
      'gdpr_audit_logs',
      'audit_logs', 
      'consent_records',
      'data_export_requests',
      'data_retention_policies',
      'notifications',
      'user_sessions',
      'payments',
      'packages',
      'appointments',
      'patient_history',
      'patients',
      'services',
      'rooms',
      'staff_leaves',
      'staff_schedules',
      'users'
    ];
    
    // Disable foreign key checks
    await prisma.$executeRaw`SET session_replication_role = replica;`;
    
    for (const table of tablesToClear) {
      try {
        await prisma.$executeRawUnsafe(`DELETE FROM "${table}";`);
        log(`   ✅ Cleared ${table}`, colors.green);
      } catch (error) {
        if (!error.message.includes('does not exist')) {
          log(`   ⚠️  Warning clearing ${table}: ${error.message}`, colors.yellow);
        }
      }
    }
    
    // Re-enable foreign key checks
    await prisma.$executeRaw`SET session_replication_role = DEFAULT;`;
    
    log('✅ Database cleared successfully', colors.green);
    
  } catch (error) {
    log(`❌ Error clearing database: ${error.message}`, colors.red);
    throw error;
  }
}

async function createUsers() {
  log('\n👥 Creating users...', colors.blue);
  
  const userData = [
    {
      email: 'admin@medicalcenter.com',
      password: 'Admin123!',
      firstName: 'Dr. Admin',
      lastName: 'Manager',
      role: Role.ADMIN,
      specialization: 'MEDICAL_MASSAGE',
      phone: '+43 1 234 5601',
      description: 'System Administrator - Full access to all features'
    },
    {
      email: 'supervisor@medicalcenter.com', 
      password: 'Supervisor123!',
      firstName: 'Sarah',
      lastName: 'Wilson',
      role: Role.MODERATOR,
      specialization: 'PHYSIOTHERAPY',
      phone: '+43 1 234 5602',
      description: 'Staff Supervisor - Manages staff and patient records'
    },
    {
      email: 'staff@medicalcenter.com',
      password: 'Staff123!',
      firstName: 'Emma',
      lastName: 'Johnson', 
      role: Role.USER,
      specialization: 'MASSAGE',
      phone: '+43 1 234 5603',
      description: 'Staff Member - Basic patient management access'
    }
  ];
  
  const createdUsers = [];
  
  for (const user of userData) {
    try {
      const hashedPassword = await PasswordUtils.hash(user.password);
      
      const createdUser = await prisma.user.create({
        data: {
          email: user.email,
          password: hashedPassword,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          specialization: user.specialization,
          phone: user.phone,
          emailVerified: true,
          isActive: true,
        }
      });
      
      createdUsers.push({
        ...createdUser,
        plainPassword: user.password, // For display only
        description: user.description
      });
      
      log(`   ✅ Created ${user.role}: ${user.firstName} ${user.lastName} (${user.email})`, colors.green);
      
    } catch (error) {
      log(`   ❌ Failed to create user ${user.email}: ${error.message}`, colors.red);
      throw error;
    }
  }
  
  return createdUsers;
}

async function createDataRetentionPolicies() {
  log('\n📋 Creating GDPR data retention policies...', colors.cyan);
  
  const retentionPolicies = [
    {
      dataType: 'User',
      retentionPeriod: 2555, // 7 years in days (after last activity)
      description: 'Staff user accounts - 7 years after termination',
      legalBasis: 'Austrian Employment Law - Record keeping requirements'
    },
    {
      dataType: 'Patient',
      retentionPeriod: 10958, // 30 years in days
      description: 'Patient personal data - 30 years as per Austrian Medical Practice Act',
      legalBasis: 'Austrian Medical Practice Act (ÄrzteG) § 51 - Medical record retention'
    },
    {
      dataType: 'PatientHistory',
      retentionPeriod: 10958, // 30 years in days
      description: 'Medical history and treatment records - 30 years',
      legalBasis: 'Austrian Medical Practice Act (ÄrzteG) § 51 - Medical record retention'
    },
    {
      dataType: 'AuditLog',
      retentionPeriod: 2555, // 7 years in days
      description: 'System audit logs - 7 years for security and compliance',
      legalBasis: 'GDPR Article 5(1)(e) - Storage limitation principle'
    },
    {
      dataType: 'GDPRAuditLog',
      retentionPeriod: 2555, // 7 years in days  
      description: 'GDPR compliance audit logs - 7 years for regulatory audits',
      legalBasis: 'GDPR Article 30 - Records of processing activities'
    },
    {
      dataType: 'ConsentRecord',
      retentionPeriod: 2555, // 7 years in days
      description: 'Consent records - 7 years after withdrawal',
      legalBasis: 'GDPR Article 7 - Consent documentation requirements'
    }
  ];
  
  for (const policy of retentionPolicies) {
    try {
      await prisma.dataRetentionPolicy.create({
        data: policy
      });
      
      log(`   ✅ Created policy: ${policy.dataType} (${Math.round(policy.retentionPeriod/365)} years)`, colors.green);
      
    } catch (error) {
      log(`   ❌ Failed to create retention policy for ${policy.dataType}: ${error.message}`, colors.red);
    }
  }
}

async function displaySummary(users) {
  log('\n🎉 Database Reset Complete!', colors.green);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.white);
  
  log('\n👤 Created Users:', colors.blue);
  users.forEach(user => {
    log(`\n   🏥 ${user.role}:`, colors.yellow);
    log(`      Name: ${user.firstName} ${user.lastName}`, colors.white);
    log(`      Email: ${user.email}`, colors.white);
    log(`      Password: ${user.plainPassword}`, colors.white);
    log(`      Phone: ${user.phone}`, colors.white);
    log(`      Specialization: ${user.specialization}`, colors.white);
    log(`      Description: ${user.description}`, colors.cyan);
  });
  
  log('\n📋 GDPR Retention Policies:', colors.blue);
  log('   ✅ Patient records: 30 years (Austrian Medical Practice Act)', colors.green);
  log('   ✅ Staff records: 7 years (Employment Law)', colors.green);
  log('   ✅ Audit logs: 7 years (GDPR compliance)', colors.green);
  log('   ✅ Consent records: 7 years (GDPR requirements)', colors.green);
  
  log('\n🔗 Next Steps:', colors.magenta);
  log('   1. Start the backend server: npm run dev', colors.white);
  log('   2. Login with any of the credentials above', colors.white);
  log('   3. Test the audit logging features', colors.white);
  log('   4. Create test patients to see audit reports', colors.white);
  
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.white);
}

async function main() {
  log('🏥 Medical Center Database Reset Script', colors.magenta);
  log('=====================================', colors.magenta);
  
  try {
    // Connect to database
    await prisma.$connect();
    log('✅ Connected to database', colors.green);
    
    // Clear database
    await clearDatabase();
    
    // Create users
    const users = await createUsers();
    
    // Create GDPR policies
    await createDataRetentionPolicies();
    
    // Display summary
    await displaySummary(users);
    
  } catch (error) {
    log(`\n❌ Script failed: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle script interruption
process.on('SIGINT', async () => {
  log('\n\n⚠️  Script interrupted by user', colors.yellow);
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  log('\n\n⚠️  Script terminated', colors.yellow);
  await prisma.$disconnect();
  process.exit(0);
});

// Run the script
main().catch(async (error) => {
  log(`❌ Unexpected error: ${error.message}`, colors.red);
  await prisma.$disconnect();
  process.exit(1);
});