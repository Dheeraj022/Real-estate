const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateReferralCode } = require('../utils/referralCode');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const name = 'admin';
    const email = 'dheerajadmin@gmail.com';
    const password = '123456';

    console.log('=== Creating Admin User ===\n');
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}\n`);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('⚠️  User with this email already exists!');
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Role: ${existingUser.role}`);
      
      // Update to admin if not already admin
      if (existingUser.role !== 'admin') {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: 'admin' }
        });
        console.log('✅ User role updated to admin!');
      } else {
        console.log('✅ User is already an admin.');
      }
      
      await prisma.$disconnect();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique referral code
    const referralCode = await generateReferralCode();

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'admin',
        referralCode,
        level: 0
      }
    });

    console.log('\n✅ Admin user created successfully!');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Referral Code: ${admin.referralCode}`);
    console.log('\n📝 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n🔗 Admin Login URL:');
    console.log(`   http://localhost:3000/admin/admin-login`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    await prisma.$disconnect();
    process.exit(1);
  }
}

createAdmin();

