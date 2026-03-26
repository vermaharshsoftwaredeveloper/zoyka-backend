import bcrypt from "bcryptjs";
import prisma from "../src/config/prisma.js";

const IMG_BASE = "https://images.unsplash.com";

const hashPassword = (plain) => bcrypt.hash(plain, 10);

const getTableColumns = async (tableName) => {
    const rows = await prisma.$queryRaw`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${tableName}
    `;

    return new Set(rows.map((row) => row.column_name));
};

const upsertUser = async ({ email, mobile, name, role, password }) => {
    const hashed = await hashPassword(password);

    return prisma.user.upsert({
        where: { email },
        update: {
            name,
            role,
            mobile,
            password: hashed,
            isEmailVerified: true,
        },
        create: {
            email,
            mobile,
            name,
            role,
            password: hashed,
            isEmailVerified: true,
        },
    });
};

const upsertProductWithImage = async ({ outletId, categoryId, title, slug, district, price, stock, imageUrl, producerName, producerStory }) => {
    return prisma.product.upsert({
        where: {
            outletId_slug: {
                outletId,
                slug,
            },
        },
        update: {
            categoryId,
            title,
            district,
            price,
            stock,
            producerName,
            producerStory,
            isActive: true,
            images: {
                deleteMany: {},
                create: [{ url: imageUrl, sortOrder: 0 }],
            },
        },
        create: {
            outletId,
            categoryId,
            title,
            slug,
            district,
            price,
            stock,
            producerName,
            producerStory,
            isActive: true,
            images: {
                create: [{ url: imageUrl, sortOrder: 0 }],
            },
        },
    });
};

const ensureOrder = async ({ marker, userId, addressId, productId, quantity, unitPrice, status, notes }) => {
    const existing = await prisma.order.findFirst({
        where: {
            userId,
            productId,
            notes: { contains: marker },
        },
    });

    if (existing) {
        return prisma.order.update({
            where: { id: existing.id },
            data: {
                addressId,
                quantity,
                unitPrice,
                totalAmount: quantity * unitPrice,
                status,
                notes: `${marker} ${notes}`,
            },
        });
    }

    return prisma.order.create({
        data: {
            userId,
            addressId,
            productId,
            quantity,
            unitPrice,
            totalAmount: quantity * unitPrice,
            status,
            notes: `${marker} ${notes}`,
        },
    });
};

async function main() {
    const outletColumns = await getTableColumns("Outlet");
    const regionColumns = await getTableColumns("Region");

    const [admin, manager, producer, customer] = await Promise.all([
        upsertUser({
            email: "admin@zoyka.com",
            mobile: "9000000001",
            name: "Zoyka Admin",
            role: "ADMIN",
            password: "Admin@123",
        }),
        upsertUser({
            email: "ops.manager@zoyka.com",
            mobile: "9000000002",
            name: "Outlet Ops Manager",
            role: "MANAGER",
            password: "Manager@123",
        }),
        upsertUser({
            email: "producer@zoyka.com",
            mobile: "9000000003",
            name: "Sample Producer",
            role: "PRODUCER",
            password: "Producer@123",
        }),
        upsertUser({
            email: "customer@zoyka.com",
            mobile: "9000000004",
            name: "Test Customer",
            role: "USER",
            password: "Customer@123",
        }),
    ]);

    const category = await prisma.category.upsert({
        where: { slug: "seed-spices" },
        update: {
            name: "Seed Spices",
            description: "Seed category for endpoint testing",
            isActive: true,
        },
        create: {
            name: "Seed Spices",
            slug: "seed-spices",
            description: "Seed category for endpoint testing",
            isActive: true,
        },
    });

    const region = await prisma.region.upsert({
        where: { name: "Seed Region" },
        update: {
            managerId: manager.id,
            isActive: true,
            ...(regionColumns.has("categoryId") ? { categoryId: category.id } : {}),
        },
        create: {
            name: "Seed Region",
            managerId: manager.id,
            isActive: true,
            ...(regionColumns.has("categoryId") ? { categoryId: category.id } : {}),
        },
    });

    const outlet = await prisma.outlet.upsert({
        where: { key: "seed-outlet-ops" },
        update: {
            name: "Seed Ops Outlet",
            description: "Demo outlet for operations manager endpoint testing",
            isActive: true,
            ...(outletColumns.has("address") ? { address: "Market Road, Seed Region" } : {}),
            ...(outletColumns.has("monthlyCapacity") ? { monthlyCapacity: 2500 } : {}),
            ...(outletColumns.has("qualityScore") ? { qualityScore: 87 } : {}),
            ...(outletColumns.has("ownerId") ? { ownerId: producer.id } : {}),
            ...(outletColumns.has("regionId") ? { regionId: region.id } : {}),
            ...(outletColumns.has("categoryId") ? { categoryId: category.id } : {}),
        },
        create: {
            key: "seed-outlet-ops",
            name: "Seed Ops Outlet",
            description: "Demo outlet for operations manager endpoint testing",
            isActive: true,
            ...(outletColumns.has("address") ? { address: "Market Road, Seed Region" } : {}),
            ...(outletColumns.has("monthlyCapacity") ? { monthlyCapacity: 2500 } : {}),
            ...(outletColumns.has("qualityScore") ? { qualityScore: 87 } : {}),
            ...(outletColumns.has("ownerId") ? { ownerId: producer.id } : {}),
            ...(outletColumns.has("regionId") ? { regionId: region.id } : {}),
            ...(outletColumns.has("categoryId") ? { categoryId: category.id } : {}),
        },
    });

    const products = await Promise.all([
        upsertProductWithImage({
            outletId: outlet.id,
            categoryId: category.id,
            title: "Seed Turmeric Powder",
            slug: "seed-turmeric-powder",
            district: "Warangal",
            price: 149,
            stock: 3,
            producerName: "Sample Producer",
            producerStory: "Traditional spice producer",
            imageUrl: `${IMG_BASE}/photo-1615486511484-92e172cc4fe0?auto=format&fit=crop&w=900&q=80`,
        }),
        upsertProductWithImage({
            outletId: outlet.id,
            categoryId: category.id,
            title: "Seed Red Chilli Powder",
            slug: "seed-red-chilli-powder",
            district: "Karimnagar",
            price: 199,
            stock: 42,
            producerName: "Sample Producer",
            producerStory: "Traditional spice producer",
            imageUrl: `${IMG_BASE}/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=900&q=80`,
        }),
        upsertProductWithImage({
            outletId: outlet.id,
            categoryId: category.id,
            title: "Seed Coriander Powder",
            slug: "seed-coriander-powder",
            district: "Nizamabad",
            price: 129,
            stock: 18,
            producerName: "Sample Producer",
            producerStory: "Traditional spice producer",
            imageUrl: `${IMG_BASE}/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80`,
        }),
        upsertProductWithImage({
            outletId: outlet.id,
            categoryId: category.id,
            title: "Seed Garam Masala",
            slug: "seed-garam-masala",
            district: "Hyderabad",
            price: 219,
            stock: 8,
            producerName: "Sample Producer",
            producerStory: "Traditional spice producer",
            imageUrl: `${IMG_BASE}/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=80`,
        }),
    ]);

    const existingAddress = await prisma.address.findFirst({
        where: { userId: customer.id, pincode: "506001", line1: "12, Demo Street" },
        select: { id: true },
    });

    const addressData = {
        userId: customer.id,
        type: "HOME",
        isDefault: true,
        fullName: customer.name,
        phoneNumber: customer.mobile,
        line1: "12, Demo Street",
        line2: "Near City Park",
        landmark: "Seed Mall",
        district: "Warangal",
        state: "Telangana",
        pincode: "506001",
    };

    const address = existingAddress
        ? await prisma.address.update({ where: { id: existingAddress.id }, data: addressData })
        : await prisma.address.create({ data: addressData });

    const [placedOrder, confirmedOrder, packedOrder, cancelledOrder] = await Promise.all([
        ensureOrder({
            marker: "[seed-order-placed]",
            userId: customer.id,
            addressId: address.id,
            productId: products[0].id,
            quantity: 1,
            unitPrice: products[0].price,
            status: "PLACED",
            notes: "Fresh order waiting for manager action",
        }),
        ensureOrder({
            marker: "[seed-order-confirmed]",
            userId: customer.id,
            addressId: address.id,
            productId: products[1].id,
            quantity: 2,
            unitPrice: products[1].price,
            status: "CONFIRMED",
            notes: "Accepted and pending QC",
        }),
        ensureOrder({
            marker: "[seed-order-packed]",
            userId: customer.id,
            addressId: address.id,
            productId: products[2].id,
            quantity: 1,
            unitPrice: products[2].price,
            status: "PACKED",
            notes: "QC passed and ready to dispatch",
        }),
        ensureOrder({
            marker: "[seed-order-return]",
            userId: customer.id,
            addressId: address.id,
            productId: products[3].id,
            quantity: 1,
            unitPrice: products[3].price,
            status: "CANCELLED",
            notes: "Return request: Packaging was damaged",
        }),
    ]);

    const existingReview = await prisma.review.findFirst({
        where: {
            userId: customer.id,
            productId: products[3].id,
        },
        orderBy: { createdAt: "desc" },
        select: { id: true },
    });

    if (existingReview) {
        await prisma.review.update({
            where: { id: existingReview.id },
            data: {
                rating: 2,
                comment: "Received damaged package, requesting return.",
                wouldRecommend: false,
            },
        });
    } else {
        await prisma.review.create({
            data: {
                userId: customer.id,
                productId: products[3].id,
                rating: 2,
                comment: "Received damaged package, requesting return.",
                wouldRecommend: false,
            },
        });
    }

    console.log("\n✅ Seed completed successfully with demo operations data.");
    console.log("\nUsers:");
    console.log("- Admin: admin@zoyka.com / Admin@123");
    console.log("- Manager: ops.manager@zoyka.com / Manager@123");
    console.log("- Producer: producer@zoyka.com / Producer@123");
    console.log("- Customer: customer@zoyka.com / Customer@123");
    console.log("\nOutlet key:");
    console.log(`- ${outlet.key}`);
    console.log("\nOrders created/updated:");
    console.log(`- New order: ${placedOrder.id} (PLACED)`);
    console.log(`- QC pending: ${confirmedOrder.id} (CONFIRMED)`);
    console.log(`- Ready to dispatch: ${packedOrder.id} (PACKED)`);
    console.log(`- Return pending sample: ${cancelledOrder.id} (CANCELLED)`);
}

main()
    .catch((e) => {
        console.error("❌ Error seeding database:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });