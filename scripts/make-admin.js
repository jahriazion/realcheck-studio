const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userEmail = 'jahriahoho@gmail.com'; // Your email address

  try {
    const user = await prisma.user.update({
      where: { email: userEmail },
      data: { 
        isAdmin: true,
        subscriptionStatus: 'active' // Also ensure you have pro status
      },
    });
    console.log(`✅ User updated to admin status: ${user.email}`);
    console.log(`   - Admin: ${user.isAdmin}`);
    console.log(`   - Pro Status: ${user.subscriptionStatus}`);
  } catch (error) {
    console.error(`❌ Error updating user: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

main();