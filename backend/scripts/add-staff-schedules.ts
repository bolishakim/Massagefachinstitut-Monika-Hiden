import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface StaffScheduleData {
  firstName: string;
  lastName: string;
  schedules: {
    dayOfWeek: number; // 0=Sunday, 1=Monday, etc.
    startTime: string;
    endTime: string;
    breakStartTime?: string;
    breakEndTime?: string;
  }[];
}

const staffSchedules: StaffScheduleData[] = [
  {
    firstName: 'Barbara',
    lastName: 'Eckerstorfer',
    schedules: [
      { dayOfWeek: 1, startTime: '07:00', endTime: '14:00' }, // Monday
      { dayOfWeek: 3, startTime: '07:00', endTime: '16:30' }, // Wednesday
      { dayOfWeek: 4, startTime: '11:30', endTime: '20:00' }, // Thursday
    ]
  },
  {
    firstName: 'Stefan',
    lastName: 'Konrad',
    schedules: [
      { dayOfWeek: 1, startTime: '07:00', endTime: '20:00', breakStartTime: '13:00', breakEndTime: '15:00' }, // Monday
      { dayOfWeek: 2, startTime: '07:00', endTime: '15:00' }, // Tuesday
      { dayOfWeek: 4, startTime: '07:00', endTime: '20:00', breakStartTime: '13:00', breakEndTime: '15:00' }, // Thursday
      { dayOfWeek: 5, startTime: '07:00', endTime: '15:00' }, // Friday
    ]
  },
  {
    firstName: 'Stephan',
    lastName: 'Hiden',
    schedules: [
      { dayOfWeek: 2, startTime: '09:00', endTime: '15:00' }, // Tuesday
      { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '14:00' }, // Wednesday
      { dayOfWeek: 4, startTime: '09:00', endTime: '15:00' }, // Thursday
      { dayOfWeek: 5, startTime: '09:00', endTime: '16:00', breakStartTime: '11:30', breakEndTime: '13:00' }, // Friday
    ]
  },
  {
    firstName: 'Katharina',
    lastName: 'Marchold',
    schedules: [
      { dayOfWeek: 1, startTime: '13:00', endTime: '20:30' }, // Monday
      { dayOfWeek: 2, startTime: '07:30', endTime: '14:00' }, // Tuesday
      { dayOfWeek: 3, startTime: '08:00', endTime: '14:00' }, // Wednesday
      { dayOfWeek: 4, startTime: '06:00', endTime: '14:00' }, // Thursday
    ]
  },
  {
    firstName: 'Flavius',
    lastName: 'Null',
    schedules: [
      { dayOfWeek: 2, startTime: '13:00', endTime: '20:00' }, // Tuesday
    ]
  },
  {
    firstName: 'Simon',
    lastName: 'Freisitzer',
    schedules: [
      { dayOfWeek: 2, startTime: '15:00', endTime: '20:00' }, // Tuesday
      { dayOfWeek: 3, startTime: '15:00', endTime: '20:00' }, // Wednesday
      { dayOfWeek: 4, startTime: '15:00', endTime: '20:00' }, // Thursday
      { dayOfWeek: 5, startTime: '15:00', endTime: '20:00' }, // Friday
    ]
  },
  {
    firstName: 'Hedra',
    lastName: 'Ramandious',
    schedules: [
      { dayOfWeek: 1, startTime: '08:00', endTime: '16:30' }, // Monday
      { dayOfWeek: 2, startTime: '10:30', endTime: '19:00' }, // Tuesday
      { dayOfWeek: 3, startTime: '08:00', endTime: '16:30' }, // Wednesday
      { dayOfWeek: 4, startTime: '08:00', endTime: '16:30' }, // Thursday
      { dayOfWeek: 5, startTime: '10:30', endTime: '19:00' }, // Friday
    ]
  }
];

async function addStaffSchedules() {
  console.log('📅 Starting staff schedules creation...\n');
  
  try {
    for (const staffData of staffSchedules) {
      // Find the user by name
      const user = await prisma.user.findFirst({
        where: {
          firstName: staffData.firstName,
          lastName: staffData.lastName
        }
      });

      if (!user) {
        console.log(`⚠️  User ${staffData.firstName} ${staffData.lastName} not found. Skipping.`);
        continue;
      }

      console.log(`\n👤 Processing schedules for ${staffData.firstName} ${staffData.lastName}:`);

      // Delete existing schedules for this staff member
      await prisma.staffSchedule.deleteMany({
        where: { staffId: user.id }
      });

      // Add new schedules
      for (const schedule of staffData.schedules) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        await prisma.staffSchedule.create({
          data: {
            staffId: user.id,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            breakStartTime: schedule.breakStartTime,
            breakEndTime: schedule.breakEndTime,
            isActive: true
          }
        });

        let scheduleInfo = `   ✅ ${dayNames[schedule.dayOfWeek]}: ${schedule.startTime} - ${schedule.endTime}`;
        if (schedule.breakStartTime && schedule.breakEndTime) {
          scheduleInfo += ` (Break: ${schedule.breakStartTime} - ${schedule.breakEndTime})`;
        }
        console.log(scheduleInfo);
      }
    }

    // Summary report
    console.log('\n📊 Schedule Summary:');
    
    const scheduleCount = await prisma.staffSchedule.count();
    console.log(`   Total schedules created: ${scheduleCount}`);
    
    const staffWithSchedules = await prisma.user.findMany({
      where: {
        staffSchedules: {
          some: {}
        }
      },
      include: {
        staffSchedules: true
      }
    });
    
    console.log(`   Staff members with schedules: ${staffWithSchedules.length}`);
    
    console.log('\n✅ Staff schedules creation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating staff schedules:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addStaffSchedules()
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });