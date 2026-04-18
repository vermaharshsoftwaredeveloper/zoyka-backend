// prisma/seed.js
import prisma from "../src/config/prisma.js";
import { hashPassword } from "../src/modules/auth/utils/password.utils.js";

const main = async () => {
    console.log("🌱 Starting Minimal Seed...");

    // ==========================================
    // 1. ADMIN USER
    // ==========================================
    console.log("⏳ Seeding Admin User...");
    const hashedPassword = await hashPassword("Zoykah@admin1234##");

    const adminEmail = "admin@zoyka.com";
    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            password: hashedPassword,
            name: "Super Admin",
            mobile: "9000000001",
            role: "ADMIN"
        },
        create: {
            email: adminEmail,
            mobile: "9000000001",
            name: "Super Admin",
            role: "ADMIN",
            password: hashedPassword,
            isEmailVerified: true
        },
    });

    // ==========================================
    // 2. DEPARTMENT
    // ==========================================
    console.log("⏳ Seeding Department: Artisan's Touch...");
    await prisma.department.upsert({
        where: { name: "Artisan's Touch" },
        update: {},
        create: {
            name: "Artisan's Touch",
            slug: "artisans-touch",
            description: "Handcrafted artisan products",
            isActive: true
        },
    });

    console.log("\n✅ MINIMAL SEED COMPLETED SUCCESSFULLY! 🎉");
};

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });