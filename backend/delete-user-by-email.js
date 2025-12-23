const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteUserByEmail() {
  const emailToDelete = 'ivanatattooartshorts@gmail.com';
  
  try {
    console.log(`🔍 Looking for user with email: ${emailToDelete}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Find user by exact email (case-insensitive)
    const users = await prisma.user.findMany({
      where: {
        email: {
          equals: emailToDelete,
          mode: 'insensitive',
        },
      },
      include: {
        refreshTokens: true,
        smsVerificationCodes: true,
        addresses: true,
      },
    });
    
    if (users.length === 0) {
      console.log(`❌ No user found with email "${emailToDelete}"`);
      await prisma.$disconnect();
      return;
    }
    
    console.log(`\n📋 Found ${users.length} user(s):`);
    users.forEach((user, i) => {
      console.log(`\n${i + 1}. User ID: ${user.id}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Phone: ${user.phone || 'N/A'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Refresh Tokens: ${user.refreshTokens.length}`);
      console.log(`   SMS Codes: ${user.smsVerificationCodes.length}`);
      console.log(`   Addresses: ${user.addresses.length}`);
    });
    
    // Delete all found users
    for (const user of users) {
      console.log(`\n🗑️  Deleting user: ${user.email || user.id}`);
      
      // Delete user (cascade will delete related records)
      await prisma.user.delete({
        where: { id: user.id },
      });
      
      console.log(`✅ Successfully deleted user: ${user.email || user.id}`);
      console.log(`   - Deleted ${user.refreshTokens.length} refresh token(s)`);
      console.log(`   - Deleted ${user.smsVerificationCodes.length} SMS code(s)`);
      console.log(`   - Deleted ${user.addresses.length} address(es)`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All users deleted successfully!');
    console.log('   You can now register/login again with this email.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'P2025') {
      console.log('   (User was already deleted)');
    }
  } finally {
    await prisma.$disconnect();
  }
}

deleteUserByEmail();





