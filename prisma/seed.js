// prisma/seed.js
import prisma from "../src/config/prisma.js";
import { hashPassword } from "../src/modules/auth/utils/password.utils.js";

const main = async () => {
    console.log("🌱 Starting Master Seed for ALL Models...");

    // ==========================================
    // 1. USERS (Users Model)
    // ==========================================
    console.log("⏳ Seeding Users...");
    const hashedPassword = await hashPassword("Password@123");

    const baseUsers = [
        { email: "admin@zoyka.com", mobile: "9000000001", name: "Super Admin", role: "SUPER_ADMIN" },
        { email: "manager@zoyka.com", mobile: "9000000002", name: "Ops Manager", role: "MANAGER" },
        { email: "customer@zoyka.com", mobile: "9000000003", name: "Rahul Customer", role: "USER" },
        { email: "owner_north@zoyka.com", mobile: "9100000010", name: "Ramesh Singh", role: "PRODUCER" },
        { email: "owner_south@zoyka.com", mobile: "9100000020", name: "Karthik Nair", role: "PRODUCER" },
        { email: "owner_west@zoyka.com", mobile: "9100000030", name: "Amit Patel", role: "PRODUCER" }
    ];

    const dbUsers = {};
    for (const u of baseUsers) {
        dbUsers[u.role] = await prisma.user.upsert({
            where: { email: u.email },
            update: { password: hashedPassword, name: u.name, mobile: u.mobile },
            create: { ...u, password: hashedPassword, isEmailVerified: true },
        });
    }
    const customer = dbUsers["USER"];
    const manager = dbUsers["MANAGER"];

    // ==========================================
    // 2. DEPARTMENTS (Top-Level Domains)
    // ==========================================
    console.log("⏳ Seeding Departments...");
    const departmentsData = [
        { name: "Artisan's Touch", slug: "artisans-touch", description: "Handcrafted artisan products" },
        { name: "Farmer Hub", slug: "farmer-hub", description: "Direct from farm organic produce" },
        { name: "Indian Flavours", slug: "indian-flavours", description: "Authentic local flavors and preserves" }
    ];

    const dbDepartments = {};
    for (const dep of departmentsData) {
        dbDepartments[dep.slug] = await prisma.department.upsert({
            where: { name: dep.name },
            update: { slug: dep.slug, description: dep.description },
            create: { ...dep, isActive: true },
        });
    }

    // ==========================================
    // 3. CATEGORIES (Micro-Domains)
    // ==========================================
    console.log("⏳ Seeding Categories...");
    const categoriesData = [
        // Artisan's Touch Categories
        { name: "Wooden Utilities", slug: "wooden-utilities", depSlug: "artisans-touch", desc: "Hand-carved wooden items" },
        { name: "Handlooms & Fabrics", slug: "handlooms", depSlug: "artisans-touch", desc: "Authentic regional weaves" },
        { name: "Planters & Pottery", slug: "planters-pottery", depSlug: "artisans-touch", desc: "Clay and ceramic pots" },

        // Farmer Hub Categories
        { name: "Organic Staples", slug: "organic-staples", depSlug: "farmer-hub", desc: "Rice, wheat, and pulses" },
        { name: "Spices", slug: "spices", depSlug: "farmer-hub", desc: "Whole and powdered authentic spices" },
        { name: "Cold Pressed Oils", slug: "cold-pressed-oils", depSlug: "farmer-hub", desc: "Pure wood-pressed oils" },

        // Indian Flavours Categories
        { name: "Pickles & Blends", slug: "pickles-blends", depSlug: "indian-flavours", desc: "Traditional homemade pickles" },
        { name: "Ready to Eat Snacks", slug: "ready-to-eat", depSlug: "indian-flavours", desc: "Fresh regional snacks" }
    ];

    const dbCategories = {};
    for (const cat of categoriesData) {
        // 🔥 Safety check added here to prevent "Cannot read properties of undefined"
        if (!dbDepartments[cat.depSlug]) {
            throw new Error(`CRITICAL ERROR: Department with slug '${cat.depSlug}' does not exist! Check your department seeding data.`);
        }

        const departmentId = dbDepartments[cat.depSlug].id;
        dbCategories[cat.slug] = await prisma.category.upsert({
            where: { name: cat.name },
            update: { slug: cat.slug, description: cat.desc, departmentId },
            create: { name: cat.name, slug: cat.slug, description: cat.desc, departmentId, isActive: true },
        });
    }

    // ==========================================
    // 4. REGIONS
    // ==========================================
    console.log("⏳ Seeding Regions...");
    const regionsData = ["North India", "South India", "West India"];
    const dbRegions = {};

    for (const regionName of regionsData) {
        dbRegions[regionName] = await prisma.region.upsert({
            where: { name: regionName },
            update: { managerId: manager.id },
            create: { name: regionName, isActive: true, managerId: manager.id },
        });
    }

    // ==========================================
    // 5. OUTLETS (8 Outlets linked to DEPARTMENTS)
    // ==========================================
    console.log("⏳ Seeding Outlets...");
    const outletsData = [
        { key: "OUT-N-ART", name: "Delhi Craft House", dep: "artisans-touch", reg: "North India", ownerEmail: "owner_north@zoyka.com" },
        { key: "OUT-N-FARM", name: "Punjab Golden Farms", dep: "farmer-hub", reg: "North India", ownerEmail: "owner_north@zoyka.com" },
        { key: "OUT-N-FLAV", name: "Chandni Chowk Flavours", dep: "indian-flavours", reg: "North India", ownerEmail: "owner_north@zoyka.com" },
        { key: "OUT-S-ART", name: "Mysore Heritage Woods", dep: "artisans-touch", reg: "South India", ownerEmail: "owner_south@zoyka.com" },
        { key: "OUT-S-FARM", name: "Kerala Organics", dep: "farmer-hub", reg: "South India", ownerEmail: "owner_south@zoyka.com" },
        { key: "OUT-S-FLAV", name: "Malabar Kitchen Co", dep: "indian-flavours", reg: "South India", ownerEmail: "owner_south@zoyka.com" },
        { key: "OUT-W-ART", name: "Gujarat Craft Village", dep: "artisans-touch", reg: "West India", ownerEmail: "owner_west@zoyka.com" },
        { key: "OUT-W-FARM", name: "Maha Agro Producers", dep: "farmer-hub", reg: "West India", ownerEmail: "owner_west@zoyka.com" }
    ];

    const dbOutlets = {};
    for (const out of outletsData) {
        const owner = await prisma.user.findUnique({ where: { email: out.ownerEmail } });

        // 🔥 Safety Check
        if (!dbDepartments[out.dep]) throw new Error(`CRITICAL ERROR: Outlet references missing department '${out.dep}'`);

        const departmentId = dbDepartments[out.dep].id;
        const regionId = dbRegions[out.reg].id;

        dbOutlets[out.key] = await prisma.outlet.upsert({
            where: { key: out.key },
            update: { name: out.name, departmentId, regionId },
            create: {
                key: out.key, name: out.name, description: `Authentic products from ${out.name}`,
                address: `Main Market, ${out.reg}`, monthlyCapacity: 500, qualityScore: 4.8,
                ownerId: owner.id, departmentId, regionId
            },
        });
    }

    // ==========================================
    // 6. PRODUCTS (Linked to Specific Categories)
    // ==========================================
    console.log("⏳ Seeding Products & Images...");
    const productsData = [
        { out: "OUT-N-ART", cat: "wooden-utilities", title: "Hand-Painted Wooden Elephant", slug: "n-wooden-elephant", price: 850, stock: 20, rating: 4.9, count: 320, district: "Jaipur", img: "https://images.unsplash.com/photo-1610992015732-2449b76344bc" },
        { out: "OUT-N-ART", cat: "handlooms", title: "Handwoven Pashmina Shawl", slug: "n-pashmina-shawl", price: 2500, stock: 15, rating: 4.7, count: 45, district: "Kashmir", img: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809" },
        { out: "OUT-N-ART", cat: "planters-pottery", title: "Blue Pottery Vase", slug: "n-blue-pottery", price: 600, stock: 30, rating: 4.5, count: 20, district: "Jaipur", img: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d" },

        { out: "OUT-N-FARM", cat: "organic-staples", title: "Premium Basmati Rice (5kg)", slug: "n-basmati-rice", price: 650, stock: 100, rating: 4.8, count: 410, district: "Amritsar", img: "https://images.unsplash.com/photo-1586201375761-83865001e8ac" },
        { out: "OUT-N-FARM", cat: "organic-staples", title: "Raw Forest Honey", slug: "n-forest-honey", price: 400, stock: 50, rating: 4.6, count: 85, district: "Dehradun", img: "https://images.unsplash.com/photo-1587049352847-4d4b12736e51" },

        { out: "OUT-N-FLAV", cat: "pickles-blends", title: "Authentic Mango Pickle", slug: "n-mango-pickle", price: 180, stock: 80, rating: 4.9, count: 500, district: "Delhi", img: "https://images.unsplash.com/photo-1626082895617-2c6afed31b46" },
        { out: "OUT-N-FLAV", cat: "spices", title: "Punjabi Chole Masala", slug: "n-chole-masala", price: 120, stock: 60, rating: 4.5, count: 35, district: "Ludhiana", img: "https://images.unsplash.com/photo-1596797038530-2c107229654b" },

        { out: "OUT-S-ART", cat: "wooden-utilities", title: "Rosewood Chess Set", slug: "s-rosewood-chess", price: 1500, stock: 10, rating: 4.8, count: 215, district: "Mysore", img: "https://images.unsplash.com/photo-1528819622765-d6bcf132f793" },
        { out: "OUT-S-ART", cat: "wooden-utilities", title: "Pure Sandalwood Soap", slug: "s-sandalwood-soap", price: 300, stock: 200, rating: 4.6, count: 120, district: "Mysore", img: "https://images.unsplash.com/photo-1600857062241-98e5dba7f214" },

        { out: "OUT-S-FARM", cat: "cold-pressed-oils", title: "Cold Pressed Coconut Oil", slug: "s-coconut-oil", price: 350, stock: 150, rating: 4.9, count: 600, district: "Kochi", img: "https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1" },
        { out: "OUT-S-FARM", cat: "organic-staples", title: "Organic Palm Jaggery", slug: "s-palm-jaggery", price: 150, stock: 75, rating: 4.7, count: 90, district: "Coimbatore", img: "https://images.unsplash.com/photo-1606300456184-7a35368a5c37" },

        { out: "OUT-S-FLAV", cat: "spices", title: "Whole Cardamom Pods", slug: "s-cardamom-pods", price: 800, stock: 40, rating: 4.8, count: 280, district: "Idukki", img: "https://images.unsplash.com/photo-1596593452033-6617a220268a" },
        { out: "OUT-S-FLAV", cat: "spices", title: "Malabar Black Pepper", slug: "s-black-pepper", price: 450, stock: 90, rating: 4.6, count: 150, district: "Wayanad", img: "https://images.unsplash.com/photo-1596593452140-5e60803dd3dc" },
        { out: "OUT-S-FLAV", cat: "ready-to-eat", title: "Spicy Banana Chips", slug: "s-banana-chips", price: 120, stock: 100, rating: 4.4, count: 65, district: "Trivandrum", img: "https://images.unsplash.com/photo-1600336214555-5c3140788775" },

        { out: "OUT-W-ART", cat: "handlooms", title: "Kutch Embroidery Tote Bag", slug: "w-kutch-bag", price: 550, stock: 35, rating: 4.7, count: 110, district: "Bhuj", img: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7" },
        { out: "OUT-W-ART", cat: "handlooms", title: "Bandhani Silk Saree", slug: "w-bandhani-saree", price: 2800, stock: 12, rating: 4.9, count: 190, district: "Surat", img: "https://images.unsplash.com/photo-1610030469983-98e5dba7f214" },

        { out: "OUT-W-FARM", cat: "organic-staples", title: "Devgad Alphonso Mangoes (1 Dozen)", slug: "w-alphonso-mango", price: 1200, stock: 50, rating: 4.9, count: 850, district: "Ratnagiri", img: "https://images.unsplash.com/photo-1553279768-865429fa0078" },
        { out: "OUT-W-FARM", cat: "organic-staples", title: "Sharbati Wheat Flour (5kg)", slug: "w-wheat-flour", price: 300, stock: 80, rating: 4.5, count: 50, district: "Pune", img: "https://images.unsplash.com/photo-1509440159596-0249088772ff" },
    ];

    const dbProducts = {};
    for (const p of productsData) {

        // 🔥 Safety Check
        if (!dbCategories[p.cat]) throw new Error(`CRITICAL ERROR: Product references missing category '${p.cat}'`);

        const outletId = dbOutlets[p.out].id;
        const categoryId = dbCategories[p.cat].id;

        dbProducts[p.slug] = await prisma.product.upsert({
            where: { outletId_slug: { outletId, slug: p.slug } },
            update: { price: p.price, stock: p.stock, averageRating: p.rating, totalRatingsCount: p.count, categoryId },
            create: {
                title: p.title, slug: p.slug, description: `Authentic ${p.title} sourced directly from local producers.`,
                producerName: dbOutlets[p.out].name, producerStory: `Crafted with love and tradition in ${p.district}.`,
                district: p.district, price: p.price, stock: p.stock,
                averageRating: p.rating, totalRatingsCount: p.count,
                outletId, categoryId,
                images: { create: [{ url: p.img, sortOrder: 1 }] }
            },
        });
    }

    // ==========================================
    // 7. ADDRESSES, ORDERS, & CART
    // ==========================================
    console.log("⏳ Seeding Customer Address & Orders...");
    const address = await prisma.address.create({
        data: {
            userId: customer.id, type: "HOME", isDefault: true,
            fullName: "Rahul Customer", phoneNumber: "9000000003",
            line1: "Flat 402, Royal Apartments", line2: "Near Park", landmark: "Big Bazaar",
            district: "Indore", state: "Madhya Pradesh", pincode: "452001"
        },
    });

    const sampleProduct = dbProducts["w-alphonso-mango"];

    const order = await prisma.order.create({
        data: {
            userId: customer.id, addressId: address.id, productId: sampleProduct.id,
            status: "DELIVERED", quantity: 1, unitPrice: sampleProduct.price, totalAmount: sampleProduct.price,
            notes: "Please deliver safely."
        },
    });

    console.log("⏳ Seeding Cart & Wishlist...");
    const cart = await prisma.cart.upsert({
        where: { userId: customer.id },
        update: {},
        create: { userId: customer.id },
    });

    await prisma.cartItem.create({
        data: { cartId: cart.id, productId: dbProducts["n-basmati-rice"].id, quantity: 2 }
    });

    await prisma.wishlist.createMany({
        data: [
            { userId: customer.id, productId: dbProducts["n-wooden-elephant"].id },
            { userId: customer.id, productId: dbProducts["s-coconut-oil"].id }
        ]
    });

    // ==========================================
    // 8. REVIEWS & MARKETING
    // ==========================================
    console.log("⏳ Seeding Reviews & Marketing...");
    await prisma.review.create({
        data: {
            userId: customer.id, productId: sampleProduct.id, rating: 5,
            comment: "Absolutely amazing quality! Highly recommended.", wouldRecommend: true,
        }
    });

    await prisma.banner.create({
        data: { imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836", link: "/promos", sortOrder: 1, isActive: true }
    });

    await prisma.coupon.upsert({
        where: { code: "WELCOME50" },
        update: {},
        create: { code: "WELCOME50", description: "Flat 50% Off", discountType: "PERCENTAGE", discountValue: 50, minOrderAmount: 200, maxDiscount: 100, isActive: true, usageLimit: 100 }
    });

    await prisma.testimonial.create({
        data: { customerName: "Anita Rao", reviewText: "Zoyka changed how I buy local authentic products!", rating: 5, sortOrder: 1 }
    });

    // ==========================================
    // 9. SYSTEM SETTINGS & FINANCE
    // ==========================================
    console.log("⏳ Seeding System Settings & Finance...");

    await prisma.productionBatch.create({
        data: { outletId: dbOutlets["OUT-W-FARM"].id, title: "Mango Sorting Batch 1", unitCount: 100, qualityStatus: "APPROVED", isApproved: true }
    });

    await prisma.payout.create({
        data: { outletId: dbOutlets["OUT-W-FARM"].id, ordersCount: 50, grossAmount: 60000, commission: 6000, amount: 54000, status: "COMPLETED" }
    });

    const defaultSettings = [
        { category: "General Setting", key: "platformName", value: "Zoyka" },
        { category: "General Setting", key: "supportEmail", value: "support@zoyka.com" },
        { category: "Account Information", key: "fullName", value: "Super Admin" },
        { category: "Account Information", key: "phone", value: "+911234568465" }
    ];

    for (const setting of defaultSettings) {
        await prisma.settingConfig.upsert({
            where: { key: setting.key },
            update: { value: setting.value, category: setting.category },
            create: setting
        });
    }

    console.log("\n✅ MASTER SEED COMPLETED SUCCESSFULLY! 🎉");
    console.log(`Populated: 3 Departments, 8 Categories, 3 Regions, 8 Outlets, and 18 Products.`);
};

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });