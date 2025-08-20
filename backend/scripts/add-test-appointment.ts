import { prisma } from '../src/utils/db.js';

async function addTestAppointment() {
  try {
    console.log('🔍 Checking existing data...');

    // Check if we have the required data
    const patient = await prisma.patient.findFirst();
    const service = await prisma.service.findFirst();
    const user = await prisma.user.findFirst({
      where: { specialization: { not: null } }
    });
    const room = await prisma.room.findFirst();
    const servicePackage = await prisma.servicePackage.findFirst();

    if (!patient || !service || !user || !room || !servicePackage) {
      console.log('⚠️  Missing required data:');
      console.log('Patient:', !!patient);
      console.log('Service:', !!service);
      console.log('Staff User:', !!user);
      console.log('Room:', !!room);
      console.log('Package:', !!servicePackage);
      return;
    }

    console.log('✅ Found required data, creating test appointment...');

    // Create a test appointment for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        packageId: servicePackage.id,
        serviceId: service.id,
        staffId: user.id,
        roomId: room.id,
        scheduledDate: tomorrow,
        startTime: '10:00',
        endTime: '11:00',
        status: 'SCHEDULED',
        notes: 'Test appointment for debugging',
        createdById: user.id,
        hasConflict: false,
        isVisible: true
      },
      include: {
        patient: true,
        service: true,
        staff: true,
        room: true,
        package: true
      }
    });

    console.log('✅ Test appointment created:', {
      id: appointment.id,
      patient: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      service: appointment.service.name,
      date: appointment.scheduledDate.toLocaleDateString(),
      time: appointment.startTime
    });

  } catch (error) {
    console.error('❌ Error creating test appointment:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestAppointment();