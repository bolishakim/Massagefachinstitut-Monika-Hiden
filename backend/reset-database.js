#!/usr/bin/env node

/**
 * Database Reset Script for Medical Center Application
 * 
 * This script:
 * 1. Clears all data from the database
 * 2. Creates 3 users with different roles (ADMIN, MODERATOR, USER)
 * 3. Creates 24 comprehensive medical services
 * 4. Creates 5 treatment rooms (physiotherapy, massage, infrared chair)
 * 5. Initializes GDPR retention policies
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

async function createServices(adminUserId) {
  log('\n🏥 Creating medical services...', colors.magenta);
  
  const services = [
    // Basic Massage Services
    {
      name: 'Teilmassage 30 min',
      description: 'Gezielte Massage bestimmter Körperbereiche zur Entspannung und Schmerzlinderung',
      category: 'MASSAGE',
      price: 30.00,
      duration: 30
    },
    {
      name: 'Heilmassage 30 min',
      description: 'Therapeutische Massage zur medizinischen Behandlung und Rehabilitation',
      category: 'HEILMASSAGE',
      price: 30.00,
      duration: 30
    },
    {
      name: 'Teilmassage 45 min',
      description: 'Erweiterte Teilmassage für tiefere Entspannung und Behandlung',
      category: 'MASSAGE',
      price: 43.00,
      duration: 45
    },
    {
      name: 'Heilmassage 45 min',
      description: 'Erweiterte therapeutische Massage für umfassende medizinische Behandlung',
      category: 'HEILMASSAGE',
      price: 43.00,
      duration: 45
    },
    {
      name: 'Teilmassage Kinder/Schüler 30 min',
      description: 'Sanfte Massage speziell für Kinder und Schüler zu reduzierten Preisen',
      category: 'MASSAGE',
      price: 24.00,
      duration: 30
    },
    {
      name: 'Heilmassage Kinder/Schüler 30 min',
      description: 'Therapeutische Massage für Kinder und Schüler zu reduzierten Preisen',
      category: 'HEILMASSAGE',
      price: 24.00,
      duration: 30
    },
    {
      name: 'Ganzkörpermassage 60 min',
      description: 'Komplette Ganzkörpermassage für totale Entspannung und Wohlbefinden',
      category: 'MASSAGE',
      price: 58.00,
      duration: 60
    },
    
    // Specialized Massage Techniques
    {
      name: 'Fußreflexzonenmassage 30 min',
      description: 'Therapeutische Fußmassage mit Fokus auf Reflexzonen zur Heilungsförderung',
      category: 'PHYSIOTHERAPY',
      price: 35.00,
      duration: 30
    },
    {
      name: 'Segmentmassage 30 min',
      description: 'Spezielle Massagetechnik mit Fokus auf Körpersegmente und Nervenbahnen',
      category: 'HEILMASSAGE',
      price: 35.00,
      duration: 30
    },
    {
      name: 'Bindegewebsmassage 30 min',
      description: 'Tiefengewebsmassage mit Fokus auf Bindegewebe und Faszien',
      category: 'HEILMASSAGE',
      price: 35.00,
      duration: 30
    },
    {
      name: 'Akupunktmassage 30 min',
      description: 'Massagetherapie kombiniert mit Akupunkturprinzipien und Druckpunkten',
      category: 'HEILMASSAGE',
      price: 35.00,
      duration: 30
    },
    {
      name: 'Ohrakupunktmassage 30 min',
      description: 'Spezialisierte Ohrmassage mit Akupunkturprinzipien für ganzheitliche Heilung',
      category: 'HEILMASSAGE',
      price: 35.00,
      duration: 30
    },
    
    // Lymphatic Drainage Services
    {
      name: 'Lymphdrainage 30 min',
      description: 'Sanfte Massagetechnik zur Stimulation des Lymphsystems und Schwellungsreduktion',
      category: 'HEILMASSAGE',
      price: 35.00,
      duration: 30
    },
    {
      name: 'Lymphdrainage 45 min',
      description: 'Erweiterte Lymphdrainage für umfassende Entgiftung und Heilung',
      category: 'HEILMASSAGE',
      price: 52.50,
      duration: 45
    },
    {
      name: 'Lymphdrainage 60 min',
      description: 'Vollständige Lymphdrainage-Sitzung für maximalen therapeutischen Nutzen',
      category: 'HEILMASSAGE',
      price: 63.00,
      duration: 60
    },
    
    // Specialized Treatments
    {
      name: 'Dorn-Breuss Behandlung 60 min',
      description: 'Ganzheitliche Wirbelsäulentherapie kombiniert Dorn-Methode und Breuss-Massage',
      category: 'PHYSIOTHERAPY',
      price: 65.00,
      duration: 60
    },
    {
      name: 'Dorn-Breuss Behandlung 90 min',
      description: 'Erweiterte Dorn-Breuss Behandlung für umfassende Wirbelsäulen- und Muskeltherapie',
      category: 'PHYSIOTHERAPY',
      price: 90.00,
      duration: 90
    },
    
    // Additional Wellness Services
    {
      name: 'Moorpackungen (2 Stk.) 30 min',
      description: 'Natürliche Moortherapie-Packungen für Tiefenwärmebehandlung und Muskelentspannung',
      category: 'INFRARED_CHAIR',
      price: 14.00,
      duration: 30
    },
    {
      name: 'SEN-RELAX PLUS Tiefenwärmeliege 30 min',
      description: 'Fortgeschrittene Tiefenwärmetherapie mit spezieller Wärmebett-Technologie',
      category: 'INFRARED_CHAIR',
      price: 14.00,
      duration: 30
    },
    
    // Combination Packages
    {
      name: 'Kombi: SEN-RELAX PLUS Tiefenwärmeliege 30 min und Teilmassage 30 min',
      description: 'Kombinationsbehandlung: 30 min Tiefenwärmetherapie gefolgt von 30 min Teilmassage',
      category: 'COMBINATION',
      price: 44.00,
      duration: 60
    },
    {
      name: '10 Teilmassage + 1 Teilmassage gratis',
      description: 'Paketangebot: Kaufen Sie 10 Teilmassagen und erhalten Sie 1 zusätzliche Massage gratis',
      category: 'VOUCHER',
      price: 300.00,
      duration: 30
    },
    
    // Additional Physiotherapy Services
    {
      name: 'Physiotherapie 30 min',
      description: 'Physiotherapie-Behandlungssitzung zur Rehabilitation und Mobilitätsverbesserung',
      category: 'PHYSIOTHERAPY',
      price: 48.00,
      duration: 30
    },
    {
      name: 'Physiotherapie 45 min',
      description: 'Erweiterte Physiotherapie-Sitzung für umfassende Behandlung und Bewegungstherapie',
      category: 'PHYSIOTHERAPY',
      price: 72.00,
      duration: 45
    },
    {
      name: 'Physiotherapie 60 min',
      description: 'Umfassende Physiotherapie-Sitzung für vollständige Rehabilitation und therapeutische Übungen',
      category: 'PHYSIOTHERAPY',
      price: 96.00,
      duration: 60
    }
  ];
  
  let createdCount = 0;
  for (const service of services) {
    try {
      await prisma.service.create({
        data: {
          name: service.name,
          description: service.description,
          category: service.category,
          price: service.price,
          duration: service.duration,
          createdById: adminUserId,
          isActive: true
        }
      });
      
      createdCount++;
      log(`   ✅ Created: ${service.name} (${service.duration}min - €${service.price})`, colors.green);
      
    } catch (error) {
      log(`   ❌ Failed to create service ${service.name}: ${error.message}`, colors.red);
    }
  }
  
  log(`\n✅ Created ${createdCount} medical services`, colors.green);
}

async function createRooms(adminUserId) {
  log('\n🏢 Erstelle Behandlungsräume...', colors.cyan);
  
  const rooms = [
    {
      name: 'Raum 1',
      description: 'Physiotherapie Behandlungsraum - Ausgestattet für Rehabilitation und therapeutische Übungen',
      features: ['Physiotherapie-Geräte', 'Übungsmatten', 'Sprossenwand', 'Gleichgewichtstraining', 'Klimaanlage'],
      capacity: 1
    },
    {
      name: 'Raum 2', 
      description: 'Massage Behandlungsraum - Komfortable Umgebung für Massagetherapie',
      features: ['Massageliege', 'Musikanlage', 'Stimmungsbeleuchtung', 'Klimaregelung', 'Aufbewahrungsschrank'],
      capacity: 1
    },
    {
      name: 'Raum 3',
      description: 'Massage Behandlungsraum - Komfortable Umgebung für Massagetherapie', 
      features: ['Massageliege', 'Musikanlage', 'Stimmungsbeleuchtung', 'Klimaregelung', 'Aufbewahrungsschrank'],
      capacity: 1
    },
    {
      name: 'Raum 4',
      description: 'Massage Behandlungsraum - Komfortable Umgebung für Massagetherapie',
      features: ['Massageliege', 'Musikanlage', 'Stimmungsbeleuchtung', 'Klimaregelung', 'Aufbewahrungsschrank'], 
      capacity: 1
    },
    {
      name: 'Raum 5',
      description: 'Infrarot-Stuhl Raum - Spezialisierter Bereich für Wärmetherapie',
      features: ['Infrarot-Stuhl', 'Klimaregelung', 'Lesematerial', 'Sichtschutz', 'Timer-Steuerung'],
      capacity: 1
    }
  ];
  
  let createdCount = 0;
  for (const room of rooms) {
    try {
      await prisma.room.create({
        data: {
          name: room.name,
          description: room.description,
          features: room.features,
          capacity: room.capacity,
          createdById: adminUserId,
          isActive: true
        }
      });
      
      createdCount++;
      log(`   ✅ Created: ${room.name} - ${room.description}`, colors.green);
      
    } catch (error) {
      log(`   ❌ Failed to create room ${room.name}: ${error.message}`, colors.red);
    }
  }
  
  log(`\n✅ ${createdCount} Behandlungsräume erstellt`, colors.green);
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
  
  log('\n🏥 Medical Services:', colors.blue);
  log('   ✅ 24 comprehensive medical services created', colors.green);
  log('   ✅ Massage services (€24-€300)', colors.green);
  log('   ✅ Medical massage & lymphatic drainage (€30-€63)', colors.green);
  log('   ✅ Physiotherapy sessions (€48-€96)', colors.green);
  log('   ✅ Specialized treatments (€14-€90)', colors.green);
  
  log('\n🏢 Behandlungsräume:', colors.blue);
  log('   ✅ 5 Behandlungsräume erstellt', colors.green);
  log('   ✅ Raum 1: Physiotherapie Behandlungsraum', colors.green);
  log('   ✅ Räume 2-4: Massage Behandlungsräume', colors.green);
  log('   ✅ Raum 5: Infrarot-Stuhl Raum', colors.green);
  
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
    
    // Create medical services (pass admin user for createdById)
    await createServices(users[0].id);
    
    // Create treatment rooms (pass admin user for createdById)
    await createRooms(users[0].id);
    
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