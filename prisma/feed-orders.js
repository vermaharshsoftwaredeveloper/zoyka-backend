import bcrypt from "bcryptjs";
import prisma from "../src/config/prisma.js";

const TARGET_EMAIL = "bpmnayak143@gmail.com";

const main = async () => {
    console.log(`🚀 Starting Order Feeder for: ${TARGET_EMAIL}`);

    // 1. Find or Create the Target User
    const hashedPassword = await bcrypt.hash("Password@123", 10);
    const user = await prisma.user.upsert({
        where: { email: TARGET_EMAIL },
        update: {},
        create: {
            email: TARGET_EMAIL,
            mobile: "9998887776", // Dummy mobile
            name: "BPM Nayak",
            role: "USER",
            password: hashedPassword,
            isEmailVerified: true,
        },
    });
    console.log(`✅ User verified: ${user.name} (${user.id})`);

    // 2. Find or Create an Address for this User
    let address = await prisma.address.findFirst({ where: { userId: user.id } });
    if (!address) {
        address = await prisma.address.create({
            data: {
                userId: user.id,
                type: "HOME",
                isDefault: true,
                fullName: user.name,
                phoneNumber: user.mobile,
                line1: "10x Developer Street",
                district: "Indore",
                state: "Madhya Pradesh",
                pincode: "452001",
            },
        });
        console.log(`✅ Created new address for user`);
    }

    // 3. Fetch some existing products to order
    const products = await prisma.product.findMany({ take: 3 });
    if (products.length === 0) {
        console.error("🚨 No products found in the database! Please run 'npx prisma db seed' first.");
        return;
    }

    // 4. Create 3 distinct orders with different statuses
    console.log(`⏳ Pumping orders into the database...`);
    const statuses = ["DELIVERED", "SHIPPED", "PLACED"];

    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const quantity = i + 1; // Order 1, 2, or 3 items

        const order = await prisma.order.create({
            data: {
                userId: user.id,
                addressId: address.id,
                productId: product.id,
                status: statuses[i], // Rotate statuses
                quantity: quantity,
                unitPrice: product.price,
                totalAmount: product.price * quantity,
                notes: `Auto-generated test order from script`,
            },
        });
        console.log(`🛒 Order Created: ${product.title} | Qty: ${quantity} | Status: ${statuses[i]} | Total: ₹${order.totalAmount}`);
    }

    console.log(`\n🎉 BOOM! Orders successfully fed for ${TARGET_EMAIL}!`);
};

main()
    .catch((e) => {
        console.error("❌ Script Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });