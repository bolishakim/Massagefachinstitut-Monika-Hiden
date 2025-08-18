import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPaymentStatus() {
  console.log('🔧 Starting payment status fix...');
  
  try {
    // Get all packages with their payments
    const packages = await prisma.package.findMany({
      include: {
        payments: {
          where: {
            status: 'COMPLETED' // All existing payments have this status
          }
        }
      }
    });

    console.log(`📦 Found ${packages.length} packages to review`);
    
    for (const pkg of packages) {
      const totalPaid = pkg.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const finalPrice = Number(pkg.finalPrice);
      
      let newPackagePaymentStatus: 'NONE' | 'PARTIALLY_PAID' | 'COMPLETED';
      let newPaymentRecordStatus: 'PARTIALLY_PAID' | 'COMPLETED';
      
      if (pkg.payments.length === 0) {
        // No payments made
        newPackagePaymentStatus = 'NONE';
        console.log(`📦 Package ${pkg.name}: No payments - setting to NONE`);
        
        await prisma.package.update({
          where: { id: pkg.id },
          data: { paymentStatus: newPackagePaymentStatus }
        });
        
        continue;
      }
      
      if (totalPaid >= finalPrice) {
        // Fully paid
        newPackagePaymentStatus = 'COMPLETED';
        newPaymentRecordStatus = 'COMPLETED';
        console.log(`📦 Package ${pkg.name}: Fully paid (${totalPaid}/${finalPrice}) - setting to COMPLETED`);
      } else {
        // Partially paid
        newPackagePaymentStatus = 'PARTIALLY_PAID';
        newPaymentRecordStatus = 'PARTIALLY_PAID';
        console.log(`📦 Package ${pkg.name}: Partially paid (${totalPaid}/${finalPrice}) - setting to PARTIALLY_PAID`);
      }
      
      // Update package status
      await prisma.package.update({
        where: { id: pkg.id },
        data: { paymentStatus: newPackagePaymentStatus }
      });
      
      // Update all payment records for this package
      await prisma.payment.updateMany({
        where: { 
          packageId: pkg.id,
          status: 'COMPLETED' // Only update existing COMPLETED records
        },
        data: { status: newPaymentRecordStatus }
      });
    }
    
    // Summary report
    const statusCounts = await prisma.package.groupBy({
      by: ['paymentStatus'],
      _count: {
        paymentStatus: true
      }
    });
    
    console.log('\n📊 Payment Status Summary:');
    statusCounts.forEach(count => {
      console.log(`   ${count.paymentStatus}: ${count._count.paymentStatus} packages`);
    });
    
    console.log('\n✅ Payment status fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing payment status:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixPaymentStatus()
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });