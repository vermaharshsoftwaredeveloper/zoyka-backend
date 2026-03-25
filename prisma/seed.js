import bcrypt from 'bcryptjs';
import prisma from '../src/config/prisma.js';

async function main() {
    const adminEmail = 'admin@zoyka.com';

    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
    });

    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('Admin@123', 10);

        await prisma.user.create({
            data: {
                name: 'Zoyka Super Admin',
                email: adminEmail,
                mobile: '0000000000',
                password: hashedPassword,
                role: 'ADMIN',
                isEmailVerified: true,
            },
        });
        console.log('✅ Seed successful: Super Admin created. (Email: admin@zoyka.com, Pass: Admin@123)');
    } else {
        console.log('⚠️ Super Admin already exists. Skipping seed.');
    }
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    });