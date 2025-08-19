import { PrismaClient, Role, StaffSpecialization } from '@prisma/client';
import { PasswordUtils } from '../src/utils/password.js';

const prisma = new PrismaClient();

interface StaffUser {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  specialization: StaffSpecialization;
  password: string;
}

const staffUsers: StaffUser[] = [
  {
    email: 'stefan.konrad@medicalcenter.com',
    firstName: 'Stefan',
    lastName: 'Konrad',
    role: 'USER',
    specialization: 'MASSAGE',
    password: 'password123'
  },
  {
    email: 'simon.freisitzer@medicalcenter.com',
    firstName: 'Simon',
    lastName: 'Freisitzer',
    role: 'USER',
    specialization: 'MASSAGE',
    password: 'password123'
  },
  {
    email: 'monika.hiden@medicalcenter.com',
    firstName: 'Monika',
    lastName: 'Hiden',
    role: 'ADMIN',
    specialization: 'MEDICAL_MASSAGE', // Manager with medical massage background
    password: 'password123'
  },
  {
    email: 'barbara.eckerstorfer@medicalcenter.com',
    firstName: 'Barbara',
    lastName: 'Eckerstorfer',
    role: 'USER',
    specialization: 'MASSAGE',
    password: 'password123'
  },
  {
    email: 'stephan.hiden@medicalcenter.com',
    firstName: 'Stephan',
    lastName: 'Hiden',
    role: 'USER',
    specialization: 'MASSAGE',
    password: 'password123'
  },
  {
    email: 'hedra.ramandious@medicalcenter.com',
    firstName: 'Hedra',
    lastName: 'Ramandious',
    role: 'MODERATOR',
    specialization: 'PHYSIOTHERAPY',
    password: 'password123'
  },
  {
    email: 'katharina.marchold@medicalcenter.com',
    firstName: 'Katharina',
    lastName: 'Marchold',
    role: 'USER',
    specialization: 'MASSAGE',
    password: 'password123'
  },
  {
    email: 'flavius.null@medicalcenter.com',
    firstName: 'Flavius',
    lastName: 'Null',
    role: 'USER',
    specialization: 'MASSAGE',
    password: 'password123'
  }
];

async function addStaffUsers() {
  console.log('👥 Starting staff users creation...');
  
  try {
    for (const userData of staffUsers) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`⚠️  User ${userData.firstName} ${userData.lastName} (${userData.email}) already exists. Skipping.`);
        continue;
      }

      // Hash password
      const hashedPassword = await PasswordUtils.hash(userData.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          specialization: userData.specialization,
          emailVerified: true,
          isActive: true,
        },
      });

      console.log(`✅ Created user: ${user.firstName} ${user.lastName} (${user.role}) - ${user.email}`);
    }

    // Summary report
    const userCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });
    
    console.log('\n📊 User Summary by Role:');
    userCounts.forEach(count => {
      console.log(`   ${count.role}: ${count._count.role} users`);
    });

    const specializationCounts = await prisma.user.groupBy({
      by: ['specialization'],
      where: {
        specialization: {
          not: null
        }
      },
      _count: {
        specialization: true
      }
    });
    
    console.log('\n🎯 User Summary by Specialization:');
    specializationCounts.forEach(count => {
      console.log(`   ${count.specialization}: ${count._count.specialization} users`);
    });
    
    console.log('\n✅ Staff users creation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating staff users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addStaffUsers()
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });