import { PrismaClient, Role, StaffSpecialization } from '@prisma/client';
import { PasswordUtils } from '../src/utils/password.js';

const prisma = new PrismaClient();

interface StaffUserUpdate {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: Role;
  specialization: StaffSpecialization;
}

const staffUpdates: StaffUserUpdate[] = [
  {
    email: 'stefan.konrad@medicalcenter.com',
    username: 'stefan.konrad',
    firstName: 'Stefan',
    lastName: 'Konrad',
    role: 'USER',
    specialization: 'MASSAGE'
  },
  {
    email: 'simon.freisitzer@medicalcenter.com',
    username: 'simon.freisitzer',
    firstName: 'Simon',
    lastName: 'Freisitzer',
    role: 'USER',
    specialization: 'MASSAGE'
  },
  {
    email: 'monika.hiden@medicalcenter.com',
    username: 'monika.hiden',
    firstName: 'Monika',
    lastName: 'Hiden',
    role: 'ADMIN',
    specialization: 'MEDICAL_MASSAGE'
  },
  {
    email: 'barbara.eckerstorfer@medicalcenter.com',
    username: 'barbara.eckerstorfer',
    firstName: 'Barbara',
    lastName: 'Eckerstorfer',
    role: 'USER',
    specialization: 'MASSAGE'
  },
  {
    email: 'stephan.hiden@medicalcenter.com',
    username: 'stephan.hiden',
    firstName: 'Stephan',
    lastName: 'Hiden',
    role: 'USER',
    specialization: 'MASSAGE'
  },
  {
    email: 'hedra.ramandious@medicalcenter.com',
    username: 'hedra.ramandious',
    firstName: 'Hedra',
    lastName: 'Ramandious',
    role: 'MODERATOR',
    specialization: 'PHYSIOTHERAPY'
  },
  {
    email: 'katharina.marchold@medicalcenter.com',
    username: 'katharina.marchold',
    firstName: 'Katharina',
    lastName: 'Marchold',
    role: 'USER',
    specialization: 'MASSAGE'
  },
  {
    email: 'flavius.null@medicalcenter.com',
    username: 'flavius.null',
    firstName: 'Flavius',
    lastName: 'Null',
    role: 'USER',
    specialization: 'MASSAGE'
  }
];

async function updateStaffWithUsernames() {
  console.log('🔄 Starting staff username updates...');
  
  try {
    for (const userUpdate of staffUpdates) {
      // Find user by email
      const existingUser = await prisma.user.findUnique({
        where: { email: userUpdate.email }
      });

      if (!existingUser) {
        console.log(`⚠️  User with email ${userUpdate.email} not found. Skipping.`);
        continue;
      }

      // Update user with username
      const updatedUser = await prisma.user.update({
        where: { email: userUpdate.email },
        data: {
          username: userUpdate.username,
          // Clear email to use username for login (optional - you can keep both)
          // email: null 
        }
      });

      console.log(`✅ Updated user: ${updatedUser.firstName} ${updatedUser.lastName} - username: ${updatedUser.username}`);
    }

    // Summary report
    const usernameUsers = await prisma.user.findMany({
      where: {
        username: {
          not: null
        }
      },
      select: {
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        role: true
      }
    });
    
    console.log(`\n📊 Users with usernames: ${usernameUsers.length}`);
    console.log('\n👤 Username-enabled users:');
    usernameUsers.forEach(user => {
      console.log(`   ${user.username} - ${user.firstName} ${user.lastName} (${user.role})`);
    });
    
    console.log('\n✅ Staff username updates completed successfully!');
    console.log('\n🔐 Staff can now login using:');
    console.log('   • Username: firstname.lastname (e.g., stefan.konrad)');
    console.log('   • Password: password123');
    console.log('   • Email login still works if email is present');
    
  } catch (error) {
    console.error('❌ Error updating staff usernames:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateStaffWithUsernames()
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });