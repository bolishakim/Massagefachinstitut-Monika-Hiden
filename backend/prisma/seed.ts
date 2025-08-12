import { PrismaClient, Role } from '@prisma/client';
import { PasswordUtils } from '../src/utils/password.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@medicalcenter.com' }
  });

  if (existingAdmin) {
    console.log('❌ Medical Center users already exist. Skipping seed.');
    return;
  }

  // Create admin user
  const adminPassword = await PasswordUtils.hash('Admin123');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@medicalcenter.com',
      password: adminPassword,
      firstName: 'Dr. Admin',
      lastName: 'Manager',
      role: Role.ADMIN,
      emailVerified: true,
      isActive: true,
      specialization: 'MEDICAL_MASSAGE',
    },
  });

  // Create moderator user (Staff Supervisor)
  const moderatorPassword = await PasswordUtils.hash('Moderator123');
  const moderator = await prisma.user.create({
    data: {
      email: 'supervisor@medicalcenter.com',
      password: moderatorPassword,
      firstName: 'Sarah',
      lastName: 'Wilson',
      role: Role.MODERATOR,
      emailVerified: true,
      isActive: true,
      specialization: 'PHYSIOTHERAPY',
    },
  });

  // Create regular user (Staff Member)
  const userPassword = await PasswordUtils.hash('User123');
  const user = await prisma.user.create({
    data: {
      email: 'staff@medicalcenter.com',
      password: userPassword,
      firstName: 'Emma',
      lastName: 'Johnson',
      role: Role.USER,
      emailVerified: true,
      isActive: true,
      specialization: 'MASSAGE',
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('👤 Created Medical Center Staff Users:');
  console.log(`   🏥 Admin: admin@medicalcenter.com (password: Admin123)`);
  console.log(`   👩‍⚕️ Supervisor: supervisor@medicalcenter.com (password: Moderator123)`);
  console.log(`   👨‍⚕️ Staff: staff@medicalcenter.com (password: User123)`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });