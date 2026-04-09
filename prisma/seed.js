// prisma/seed.js
import prisma from "../src/config/prisma.js";
import { hashPassword } from "../src/modules/auth/utils/password.utils.js";

const main = async () => {
    console.log("🌱 Starting Master Seed for ALL Models...");

    // ==========================================
    // 1. USERS & ARTISANS
    // ==========================================
    console.log("⏳ Seeding Users & Artisans...");
    const hashedPassword = await hashPassword("Password@123");

    const baseUsers = [
        { email: "admin@zoyka.com", mobile: "9000000001", name: "Super Admin", role: "ADMIN" },
        { email: "customer@zoyka.com", mobile: "9000000003", name: "Rahul Customer", role: "USER" },

        // Ops Managers
        { email: "manager_n_art@zoyka.com", mobile: "9200000001", name: "Ops Manager 1", role: "MANAGER" },
        { email: "manager_s_art@zoyka.com", mobile: "9200000004", name: "Ops Manager 2", role: "MANAGER" },

        // 🔥 Your Authentic South Indian Wooden Toy Artisans
        { email: "poniki_artisan@zoyka.com", mobile: "9100000010", name: "B. Shekar & R. Kishan", role: "ARTISAN", location: "Kondapalli, Andhra Pradesh", yearsOfExperience: 30, bankName: "SBI", bankAccountNo: "000011112222", bankIfscCode: "SBIN0000123" }
    ];

    const dbUsers = {};
    for (const u of baseUsers) {
        dbUsers[u.email] = await prisma.user.upsert({
            where: { email: u.email },
            update: { password: hashedPassword, name: u.name, mobile: u.mobile, role: u.role },
            create: { ...u, password: hashedPassword, isEmailVerified: true },
        });
    }
    const customer = dbUsers["customer@zoyka.com"];

    // ==========================================
    // 2 & 3 & 4. DEPTS, CATS & REGIONS
    // ==========================================
    console.log("⏳ Seeding Departments, Categories & Regions...");
    const dept = await prisma.department.upsert({
        where: { name: "Artisan's Touch" },
        update: {}, create: { name: "Artisan's Touch", slug: "artisans-touch", description: "Handcrafted artisan products", isActive: true },
    });

    const category = await prisma.category.upsert({
        where: { name: "Wooden Utilities" },
        update: {}, create: { name: "Wooden Utilities", slug: "wooden-utilities", description: "Hand-carved wooden items", departmentId: dept.id, isActive: true },
    });

    const region = await prisma.region.upsert({
        where: { name: "South India" },
        update: {}, create: { name: "South India", isActive: true, state: "Andhra Pradesh", district: "Vijayawada", regionHead: "Anita Reddy" },
    });

    // ==========================================
    // 5. OUTLETS 
    // ==========================================
    console.log("⏳ Seeding Outlet...");
    const outlet = await prisma.outlet.upsert({
        where: { key: "OUT-PONIKI-TOYS" },
        update: {},
        create: {
            key: "OUT-PONIKI-TOYS", name: "Kondapalli Wooden Crafts", description: "Authentic Poniki wood creations",
            address: "Main Market, Kondapalli", monthlyCapacity: 500, qualityScore: 4.9,
            ownerId: dbUsers["poniki_artisan@zoyka.com"].id, departmentId: dept.id, regionId: region.id,
            managerId: dbUsers["manager_s_art@zoyka.com"].id, location: "Kondapalli", noOfArtisans: 15
        },
    });

    // ==========================================
    // 6. REAL PRODUCTS (Linked to Local Images!)
    // ==========================================
    console.log("⏳ Seeding 10 Real Products with Local Image Paths...");

    // I added a 20% markup to generate an "Actual Price" so the frontend can show a discount!
    const productsData = [
        { code: "001", title: "Hen with Chickens (Kodi pillalu)", slug: "001-hen-with-chickens", sellingPrice: 240, actualPrice: 300, desc: "Size: 4x3x4 cm. Waiting Period: 15 days. Colors: 1.", special: "Made With Poniki Wood. Efforts of 30 days. Artist: B. Shekar (30+ Yrs Exp).", img: "/uploads/products/001-hen-with-chickens.jpg" },
        { code: "002", title: "Sparrow (Pichuka)", slug: "002-sparrow", sellingPrice: 240, actualPrice: 300, desc: "Size: 2.5x9x5 cm. Waiting Period: 15 days. Colors: 5.", special: "Made With Poniki Wood. Efforts of 30 days. Artist: R. Kishan (40+ Yrs Exp).", img: "/uploads/products/002-sparrow.jpg" },
        { code: "003", title: "Stork (Konga) - Medium", slug: "003-stork", sellingPrice: 440, actualPrice: 550, desc: "Size: 3x13.5x5.5 cm. Waiting Period: 15 days. Colors: 1.", special: "Made With Poniki Wood. Efforts of 30 days. Artist: B. Shekar (30+ Yrs Exp).", img: "/uploads/products/003-stork.jpg" },
        { code: "004", title: "Birds Keyboard Hanger", slug: "004-birds-keyboard", sellingPrice: 390, actualPrice: 490, desc: "Size: 8x7 cm. Waiting Period: 15 days. Colors: 1.", special: "Made With Poniki Wood. Efforts of 30 days. Artist: B. Shekar (30+ Yrs Exp).", img: "/uploads/products/004-birds-keyboard.jpg" },
        { code: "005", title: "Women with Pot (Kunda Bomma)", slug: "005-women-pot", sellingPrice: 380, actualPrice: 480, desc: "Size: 1.5x8 cm. Waiting Period: 15 days. Colors: 1.", special: "Made With Poniki Wood. Efforts of 30 days. Artist: B. Shekar (30+ Yrs Exp).", img: "/uploads/products/005-women-with-pot.jpg" },
        { code: "006", title: "Hen (Kodi Petta) - Small", slug: "006-hen", sellingPrice: 240, actualPrice: 300, desc: "Size: 2.5x6.5x2.5 cm. Waiting Period: 15 days. Colors: 1.", special: "Made With Poniki Wood. Efforts of 30 days. Artist: R. Kishan (40+ Yrs Exp).", img: "/uploads/products/006-hen.jpg" },
        { code: "007", title: "Peacock (Nemali) - Small", slug: "007-peacock", sellingPrice: 280, actualPrice: 350, desc: "Size: 2.5x6x2.5 cm. Waiting Period: 15 days. Colors: 1.", special: "Made With Poniki Wood. Efforts of 30 days. Artist: R. Kishan (40+ Yrs Exp).", img: "/uploads/products/007-peacock.jpg" },
        { code: "008", title: "Rabbit (Kundelu)", slug: "008-rabbit", sellingPrice: 340, actualPrice: 430, desc: "Size: 1.5x4x8 cm. Waiting Period: 15 days. Colors: 1.", special: "Made With Poniki Wood. Efforts of 30 days. Artist: P. Narsaiah (50+ Yrs Exp).", img: "/uploads/products/008-rabbit.jpg" },
        { code: "009", title: "Cow (Avu)", slug: "009-cow", sellingPrice: 340, actualPrice: 430, desc: "Size: 2.5x6x4 cm. Waiting Period: 15 days. Colors: 1.", special: "Made With Poniki Wood. Efforts of 30 days. Artist: P. Narsaiah (50+ Yrs Exp).", img: "/uploads/products/009-cow.jpg" },
        { code: "010", title: "Elephant (Anugu) - Small", slug: "010-elephant", sellingPrice: 340, actualPrice: 430, desc: "Size: 2x5x5 cm. Waiting Period: 15 days. Colors: 2 (White, Grey).", special: "Made With Poniki Wood. Efforts of 30 days. Artist: P. Narsaiah (50+ Yrs Exp).", img: "/uploads/products/010-elephant.jpg" },
    ];

    const dbProducts = {};
    for (const p of productsData) {
        dbProducts[p.slug] = await prisma.product.upsert({
            where: { outletId_slug: { outletId: outlet.id, slug: p.slug } },
            update: {},
            create: {
                title: p.title, slug: p.slug, description: p.desc,
                specialFeatures: p.special, material: "Poniki Wood", actualPrice: p.actualPrice,
                sellingPrice: p.sellingPrice, stock: 50, averageRating: 4.8, totalRatingsCount: 120,
                outletId: outlet.id, categoryId: category.id, artisanId: dbUsers["poniki_artisan@zoyka.com"].id,
                images: { create: [{ url: p.img, sortOrder: 1 }] }
            },
        });
    }

    // ==========================================
    // 7. BESTSELLER ORDERS
    // ==========================================
    console.log("⏳ Seeding Realistic Bestseller Orders...");
    const address = await prisma.address.create({
        data: {
            userId: customer.id, type: "HOME", isDefault: true, fullName: "Rahul Customer", phoneNumber: "9000000003",
            line1: "Flat 402", district: "Hyderabad", state: "Telangana", pincode: "500001"
        },
    });

    // Generate sales data using our new slugs!
    const bestsellerSalesData = [
        { slug: "010-elephant", qty: 45 },
        { slug: "007-peacock", qty: 30 },
        { slug: "001-hen-with-chickens", qty: 25 },
        { slug: "005-women-pot", qty: 18 },
        { slug: "002-sparrow", qty: 10 },
    ];

    for (const sale of bestsellerSalesData) {
        const product = dbProducts[sale.slug];
        await prisma.order.create({
            data: {
                userId: customer.id, addressId: address.id, productId: product.id,
                status: "DELIVERED", quantity: sale.qty,
                unitPrice: product.sellingPrice, totalAmount: product.sellingPrice * sale.qty,
                notes: "Bestseller aggregation logic seed"
            },
        });

        await prisma.review.create({
            data: {
                userId: customer.id, productId: product.id, rating: 5,
                comment: "Authentic Poniki craft! Highly recommended.", wouldRecommend: true,
            }
        });
    }

    console.log("\n✅ MASTER SEED COMPLETED SUCCESSFULLY! 🎉");
};

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });