import { PrismaClient, Role } from '@prisma/client';
import { PasswordUtils } from '../src/utils/password.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@example.com' }
  });

  if (existingAdmin) {
    console.log('❌ Admin user already exists. Skipping seed.');
    return;
  }

  // Create admin user
  const adminPassword = await PasswordUtils.hash('Admin123!@#');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
      emailVerified: true,
      isActive: true,
    },
  });

  // Create moderator user
  const moderatorPassword = await PasswordUtils.hash('Moderator123!@#');
  const moderator = await prisma.user.create({
    data: {
      email: 'moderator@example.com',
      password: moderatorPassword,
      firstName: 'Moderator',
      lastName: 'User',
      role: Role.MODERATOR,
      emailVerified: true,
      isActive: true,
    },
  });

  // Create regular user
  const userPassword = await PasswordUtils.hash('User123!@#');
  const user = await prisma.user.create({
    data: {
      email: 'user@example.com',
      password: userPassword,
      firstName: 'Regular',
      lastName: 'User',
      role: Role.USER,
      emailVerified: true,
      isActive: true,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('👤 Created users:');
  console.log(`   Admin: admin@example.com (password: Admin123!@#)`);
  console.log(`   Moderator: moderator@example.com (password: Moderator123!@#)`);
  console.log(`   User: user@example.com (password: User123!@#)`);
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