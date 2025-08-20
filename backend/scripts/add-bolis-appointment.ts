import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addAppointmentForBolis() {
  try {
    console.log('🔍 Looking for patient Bolis Hakim...');

    // Find Bolis Hakim
    const patient = await prisma.patient.findFirst({
      where: {
        OR: [
          { firstName: { contains: 'Bolis', mode: 'insensitive' } },
          { firstName: { contains: 'bolis', mode: 'insensitive' } },
          { lastName: { contains: 'Hakim', mode: 'insensitive' } },
          { lastName: { contains: 'hakim', mode: 'insensitive' } }
        ]
      }
    });

    if (!patient) {
      console.log('❌ Patient Bolis Hakim not found. Available patients:');
      const allPatients = await prisma.patient.findMany({
        select: { firstName: true, lastName: true, phone: true }
      });
      allPatients.forEach(p => {
        console.log(`  - ${p.firstName} ${p.lastName} (${p.phone || 'No phone'})`);
      });
      return;
    }

    console.log(`✅ Found patient: ${patient.firstName} ${patient.lastName}`);

    // Get required data for appointment
    const [service, staff, room, servicePackage] = await Promise.all([
      prisma.service.findFirst(),
      prisma.user.findFirst({
        where: { 
          isActive: true,
          specialization: { not: null }
        }
      }),
      prisma.room.findFirst({ where: { isActive: true } }),
      prisma.package.findFirst({
        where: { patientId: patient.id }
      })
    ]);

    if (!service || !staff || !room) {
      console.log('❌ Missing required data:');
      console.log(`Service: ${!!service}`);
      console.log(`Staff: ${!!staff}`);
      console.log(`Room: ${!!room}`);
      return;
    }

    // If no package exists for this patient, create one
    let packageToUse = servicePackage;
    if (!packageToUse) {
      console.log('📦 Creating service package for Bolis...');
      packageToUse = await prisma.package.create({
        data: {
          name: `Behandlungspaket für ${patient.firstName}`,
          patientId: patient.id,
          totalPrice: 150.00,
          discountAmount: 0.00,
          finalPrice: 150.00,
          status: 'ACTIVE',
          paymentStatus: 'PARTIALLY_PAID',
          createdById: staff.id,
          packageItems: {
            create: [
              {
                serviceId: service.id,
                sessionCount: 5,
                completedCount: 0
              }
            ]
          }
        }
      });
    }

    console.log(`✅ Using package: ${packageToUse.name}`);

    // Create appointment for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0); // 2:00 PM

    // Calculate end time based on service duration
    const startTime = '14:00';
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + service.duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        packageId: packageToUse.id,
        serviceId: service.id,
        staffId: staff.id,
        roomId: room.id,
        scheduledDate: tomorrow,
        startTime,
        endTime,
        status: 'SCHEDULED',
        notes: 'Testtermin für Bolis Hakim - Terminplanung Demo',
        createdById: staff.id,
        hasConflict: false,
        isVisible: true
      },
      include: {
        patient: {
          select: { firstName: true, lastName: true, phone: true }
        },
        service: {
          select: { name: true, duration: true }
        },
        staff: {
          select: { firstName: true, lastName: true }
        },
        room: {
          select: { name: true }
        },
        package: {
          select: { name: true }
        }
      }
    });

    console.log('🎉 Appointment created successfully!');
    console.log('📋 Details:');
    console.log(`   Patient: ${appointment.patient.firstName} ${appointment.patient.lastName}`);
    console.log(`   Service: ${appointment.service.name} (${appointment.service.duration} min)`);
    console.log(`   Staff: ${appointment.staff.firstName} ${appointment.staff.lastName}`);
    console.log(`   Room: ${appointment.room.name}`);
    console.log(`   Package: ${appointment.package?.name}`);
    console.log(`   Date: ${appointment.scheduledDate.toLocaleDateString('de-DE')}`);
    console.log(`   Time: ${appointment.startTime} - ${appointment.endTime}`);
    console.log(`   Status: ${appointment.status}`);
    console.log(`   ID: ${appointment.id}`);

    // Create another appointment for today to have more test data
    const today = new Date();
    today.setHours(10, 30, 0, 0); // 10:30 AM

    const todayEndTime = `11:${30 + service.duration}`.padStart(5, '0');
    
    const todayAppointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        packageId: packageToUse.id,
        serviceId: service.id,
        staffId: staff.id,
        roomId: room.id,
        scheduledDate: today,
        startTime: '10:30',
        endTime: todayEndTime,
        status: 'COMPLETED',
        notes: 'Abgeschlossener Termin für Demo-Zwecke',
        createdById: staff.id,
        hasConflict: false,
        isVisible: true
      }
    });

    console.log('🎉 Second appointment created for today (completed status)!');
    console.log(`   Date: ${todayAppointment.scheduledDate.toLocaleDateString('de-DE')}`);
    console.log(`   Time: ${todayAppointment.startTime} - ${todayAppointment.endTime}`);
    console.log(`   Status: ${todayAppointment.status}`);

  } catch (error) {
    console.error('❌ Error creating appointment:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addAppointmentForBolis();