const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getLatestSmsCode() {
  try {
    // Get the most recent unused SMS code
    const code = await prisma.smsVerificationCode.findFirst({
      where: {
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (code) {
      console.log('\n📱 SMS VERIFICATION CODE:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Phone: ${code.phone}`);
      console.log(`Code: ${code.code}`);
      console.log(`Expires: ${code.expiresAt.toLocaleString()}`);
      console.log(`Created: ${code.createdAt.toLocaleString()}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else {
      console.log('❌ No active SMS codes found.');
      console.log('\nTrying to find any recent codes...\n');
      
      const recentCodes = await prisma.smsVerificationCode.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      });

      if (recentCodes.length > 0) {
        console.log('📋 Recent SMS codes (may be expired or used):');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        recentCodes.forEach((c, i) => {
          const expired = c.expiresAt < new Date();
          const used = c.isUsed;
          const status = expired ? '⏰ EXPIRED' : used ? '✅ USED' : '✅ ACTIVE';
          console.log(`${i + 1}. Phone: ${c.phone}`);
          console.log(`   Code: ${c.code} ${status}`);
          console.log(`   Created: ${c.createdAt.toLocaleString()}`);
          console.log('');
        });
      } else {
        console.log('❌ No SMS codes found in database.');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getLatestSmsCode();










