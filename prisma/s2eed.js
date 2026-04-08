// prisma/seed.js
import prisma from "../src/config/prisma.js";
import { hashPassword } from "../src/modules/auth/utils/password.utils.js";

const main = async () => {
    console.log("🌱 Starting Master Seed for ALL Models...");

    // ==========================================
    // 1. USERS (With new Staff/Artisan fields!)
    // ==========================================
    console.log("⏳ Seeding Users & Artisans...");
    const hashedPassword = await hashPassword("Password@123");

    const baseUsers = [
        { email: "admin@zoyka.com", mobile: "9000000001", name: "Super Admin", role: "ADMIN" },
        { email: "customer@zoyka.com", mobile: "9000000003", name: "Rahul Customer", role: "USER" },

        // Ops Managers
        { email: "manager_n_art@zoyka.com", mobile: "9200000001", name: "Ops Manager 1", role: "MANAGER" },
        { email: "manager_n_farm@zoyka.com", mobile: "9200000002", name: "Ops Manager 2", role: "MANAGER" },
        { email: "manager_n_flav@zoyka.com", mobile: "9200000003", name: "Ops Manager 3", role: "MANAGER" },
        { email: "manager_s_art@zoyka.com", mobile: "9200000004", name: "Ops Manager 4", role: "MANAGER" },
        { email: "manager_s_farm@zoyka.com", mobile: "9200000005", name: "Ops Manager 5", role: "MANAGER" },
        { email: "manager_s_flav@zoyka.com", mobile: "9200000006", name: "Ops Manager 6", role: "MANAGER" },
        { email: "manager_w_art@zoyka.com", mobile: "9200000007", name: "Ops Manager 7", role: "MANAGER" },
        { email: "manager_w_farm@zoyka.com", mobile: "9200000008", name: "Ops Manager 8", role: "MANAGER" },

        // Artisans with NEW Schema Fields
        { email: "artisan_north@zoyka.com", mobile: "9100000010", name: "Ramesh Singh", role: "ARTISAN", location: "Jaipur, Rajasthan", yearsOfExperience: 15, bankName: "SBI", bankAccountNo: "000011112222", bankIfscCode: "SBIN0000123" },
        { email: "artisan_south@zoyka.com", mobile: "9100000020", name: "Karthik Nair", role: "ARTISAN", location: "Mysore, Karnataka", yearsOfExperience: 8, bankName: "HDFC", bankAccountNo: "333344445555", bankIfscCode: "HDFC0000456" },
        { email: "artisan_west@zoyka.com", mobile: "9100000030", name: "Amit Patel", role: "ARTISAN", location: "Ahmedabad, Gujarat", yearsOfExperience: 20, bankName: "ICICI", bankAccountNo: "666677778888", bankIfscCode: "ICIC0000789" }
    ];

    const dbUsers = {};
    for (const u of baseUsers) {
        dbUsers[u.email] = await prisma.user.upsert({
            where: { email: u.email },
            update: {
                password: hashedPassword, name: u.name, mobile: u.mobile, role: u.role,
                location: u.location, yearsOfExperience: u.yearsOfExperience,
                bankName: u.bankName, bankAccountNo: u.bankAccountNo, bankIfscCode: u.bankIfscCode
            },
            create: { ...u, password: hashedPassword, isEmailVerified: true },
        });
    }
    const customer = dbUsers["customer@zoyka.com"];

    // ==========================================
    // 2. DEPARTMENTS 
    // ==========================================
    console.log("⏳ Seeding Departments...");
    const departmentsData = [
        // 🔥 FIXED: Slug is back to "artisans-touch" to match Categories and Outlets
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
    // 3. CATEGORIES 
    // ==========================================
    console.log("⏳ Seeding Categories...");
    const categoriesData = [
        { name: "Wooden Utilities", slug: "wooden-utilities", depSlug: "artisans-touch", desc: "Hand-carved wooden items" },
        { name: "Handlooms & Fabrics", slug: "handlooms", depSlug: "artisans-touch", desc: "Authentic regional weaves" },
        { name: "Planters & Pottery", slug: "planters-pottery", depSlug: "artisans-touch", desc: "Clay and ceramic pots" },
        { name: "Organic Staples", slug: "organic-staples", depSlug: "farmer-hub", desc: "Rice, wheat, and pulses" },
        { name: "Spices", slug: "spices", depSlug: "farmer-hub", desc: "Whole and powdered authentic spices" },
        { name: "Cold Pressed Oils", slug: "cold-pressed-oils", depSlug: "farmer-hub", desc: "Pure wood-pressed oils" },
        { name: "Pickles & Blends", slug: "pickles-blends", depSlug: "indian-flavours", desc: "Traditional homemade pickles" },
        { name: "Ready to Eat Snacks", slug: "ready-to-eat", depSlug: "indian-flavours", desc: "Fresh regional snacks" }
    ];

    const dbCategories = {};
    for (const cat of categoriesData) {
        if (!dbDepartments[cat.depSlug]) throw new Error(`CRITICAL ERROR: Missing department '${cat.depSlug}'`);
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
    const regionsData = [
        { name: "North India", state: "Delhi", district: "New Delhi", regionHead: "Rajesh Kumar" },
        { name: "South India", state: "Karnataka", district: "Bangalore", regionHead: "Anita Reddy" },
        { name: "West India", state: "Maharashtra", district: "Mumbai", regionHead: "Vikram Seth" }
    ];

    const dbRegions = {};
    for (const reg of regionsData) {
        dbRegions[reg.name] = await prisma.region.upsert({
            where: { name: reg.name },
            update: { state: reg.state, district: reg.district, regionHead: reg.regionHead },
            create: { name: reg.name, isActive: true, state: reg.state, district: reg.district, regionHead: reg.regionHead },
        });
    }

    // ==========================================
    // 5. OUTLETS 
    // ==========================================
    console.log("⏳ Seeding Outlets...");
    const outletsData = [
        { key: "OUT-N-ART", name: "Delhi Craft House", dep: "artisans-touch", reg: "North India", ownerEmail: "artisan_north@zoyka.com", loc: "Connaught Place, Delhi", artisans: 25 },
        { key: "OUT-N-FARM", name: "Punjab Golden Farms", dep: "farmer-hub", reg: "North India", ownerEmail: "artisan_north@zoyka.com", loc: "Ludhiana Highway", artisans: 50 },
        { key: "OUT-N-FLAV", name: "Chandni Chowk Flavours", dep: "indian-flavours", reg: "North India", ownerEmail: "artisan_north@zoyka.com", loc: "Old Delhi", artisans: 10 },
        { key: "OUT-S-ART", name: "Mysore Heritage Woods", dep: "artisans-touch", reg: "South India", ownerEmail: "artisan_south@zoyka.com", loc: "Palace Road, Mysore", artisans: 40 },
        { key: "OUT-S-FARM", name: "Kerala Organics", dep: "farmer-hub", reg: "South India", ownerEmail: "artisan_south@zoyka.com", loc: "Wayanad Hills", artisans: 100 },
        { key: "OUT-S-FLAV", name: "Malabar Kitchen Co", dep: "indian-flavours", reg: "South India", ownerEmail: "artisan_south@zoyka.com", loc: "Kochi Market", artisans: 15 },
        { key: "OUT-W-ART", name: "Gujarat Craft Village", dep: "artisans-touch", reg: "West India", ownerEmail: "artisan_west@zoyka.com", loc: "Bhuj, Gujarat", artisans: 60 },
        { key: "OUT-W-FARM", name: "Maha Agro Producers", dep: "farmer-hub", reg: "West India", ownerEmail: "artisan_west@zoyka.com", loc: "Pune Rural", artisans: 120 }
    ];

    const dbOutlets = {};
    const managersList = Object.values(dbUsers).filter(u => u.role === "MANAGER");
    let managerIndex = 0;

    for (const out of outletsData) {
        const owner = await prisma.user.findUnique({ where: { email: out.ownerEmail } });
        const departmentId = dbDepartments[out.dep].id;
        const regionId = dbRegions[out.reg].id;
        const targetManagerId = managersList[managerIndex] ? managersList[managerIndex].id : null;
        managerIndex++;

        dbOutlets[out.key] = await prisma.outlet.upsert({
            where: { key: out.key },
            update: { name: out.name, departmentId, regionId, managerId: targetManagerId, location: out.loc, noOfArtisans: out.artisans },
            create: {
                key: out.key, name: out.name, description: `Authentic products from ${out.name}`,
                address: `Main Market, ${out.reg}`, monthlyCapacity: 500, qualityScore: 4.8,
                ownerId: owner.id, departmentId, regionId, managerId: targetManagerId,
                location: out.loc, noOfArtisans: out.artisans
            },
        });
    }

    // ==========================================
    // 6. PRODUCTS 
    // ==========================================
    console.log("⏳ Seeding Products...");
    const productsData = [
        { out: "OUT-N-ART", artisanEmail: "artisan_north@zoyka.com", cat: "wooden-utilities", title: "Hand-Painted Wooden Elephant", slug: "n-wooden-elephant", actualPrice: 1200, sellingPrice: 850, specialFeatures: "Hand-painted natural dyes", material: "Kadam Wood", stock: 20, rating: 4.9, count: 320, img: "https://images.unsplash.com/photo-1610992015732-2449b76344bc" },
        { out: "OUT-N-ART", artisanEmail: "artisan_north@zoyka.com", cat: "handlooms", title: "Handwoven Pashmina Shawl", slug: "n-pashmina-shawl", actualPrice: 3500, sellingPrice: 2500, specialFeatures: "100% pure Himalayan Pashmina", material: "Pashmina Wool", stock: 15, rating: 4.7, count: 45, img: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809" },
        { out: "OUT-N-ART", artisanEmail: "artisan_north@zoyka.com", cat: "planters-pottery", title: "Blue Pottery Vase", slug: "n-blue-pottery", actualPrice: 800, sellingPrice: 600, specialFeatures: "Jaipur Blue Pottery", material: "Quartz and Glass", stock: 30, rating: 4.5, count: 20, img: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d" },
        { out: "OUT-N-FARM", artisanEmail: "artisan_north@zoyka.com", cat: "organic-staples", title: "Premium Basmati Rice (5kg)", slug: "n-basmati-rice", actualPrice: 850, sellingPrice: 650, specialFeatures: "Aged for 2 years", material: "Organic Rice", stock: 100, rating: 4.8, count: 410, img: "https://images.unsplash.com/photo-1586201375761-83865001e8ac" },
        { out: "OUT-N-FARM", artisanEmail: "artisan_north@zoyka.com", cat: "organic-staples", title: "Raw Forest Honey", slug: "n-forest-honey", actualPrice: 550, sellingPrice: 400, specialFeatures: "Unprocessed wild honey", material: "Raw Honey", stock: 50, rating: 4.6, count: 85, img: "https://images.unsplash.com/photo-1587049352847-4d4b12736e51" },
        { out: "OUT-N-FLAV", artisanEmail: "artisan_north@zoyka.com", cat: "pickles-blends", title: "Authentic Mango Pickle", slug: "n-mango-pickle", actualPrice: 250, sellingPrice: 180, specialFeatures: "Cold-pressed mustard oil", material: "Mango, Spices", stock: 80, rating: 4.9, count: 500, img: "https://images.unsplash.com/photo-1626082895617-2c6afed31b46" },
        { out: "OUT-S-ART", artisanEmail: "artisan_south@zoyka.com", cat: "wooden-utilities", title: "Rosewood Chess Set", slug: "s-rosewood-chess", actualPrice: 2000, sellingPrice: 1500, specialFeatures: "Magnetic base", material: "Indian Rosewood", stock: 10, rating: 4.8, count: 215, img: "https://images.unsplash.com/photo-1528819622765-d6bcf132f793" },
        { out: "OUT-S-FARM", artisanEmail: "artisan_south@zoyka.com", cat: "cold-pressed-oils", title: "Cold Pressed Coconut Oil", slug: "s-coconut-oil", actualPrice: 450, sellingPrice: 350, specialFeatures: "Wood-pressed", material: "Coconut", stock: 150, rating: 4.9, count: 600, img: "https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1" },
        { out: "OUT-S-FLAV", artisanEmail: "artisan_south@zoyka.com", cat: "spices", title: "Whole Cardamom Pods", slug: "s-cardamom-pods", actualPrice: 1000, sellingPrice: 800, specialFeatures: "Idukki estates", material: "Spices", stock: 40, rating: 4.8, count: 280, img: "https://images.unsplash.com/photo-1596593452033-6617a220268a" },
        { out: "OUT-W-ART", artisanEmail: "artisan_west@zoyka.com", cat: "handlooms", title: "Bandhani Silk Saree", slug: "w-bandhani-saree", actualPrice: 3500, sellingPrice: 2800, specialFeatures: "Hand-tied dyed", material: "Pure Silk", stock: 12, rating: 4.9, count: 190, img: "https://images.unsplash.com/photo-1610030469983-98e5dba7f214" },
        { out: "OUT-W-FARM", artisanEmail: "artisan_west@zoyka.com", cat: "organic-staples", title: "Devgad Alphonso Mangoes", slug: "w-alphonso-mango", actualPrice: 1500, sellingPrice: 1200, specialFeatures: "GI Tagged", material: "Fresh Fruit", stock: 50, rating: 4.9, count: 850, img: "https://images.unsplash.com/photo-1553279768-865429fa0078" },
    ];

    const dbProducts = {};
    for (const p of productsData) {
        const outletId = dbOutlets[p.out].id;
        const categoryId = dbCategories[p.cat].id;
        const artisan = await prisma.user.findUnique({ where: { email: p.artisanEmail } });

        dbProducts[p.slug] = await prisma.product.upsert({
            where: { outletId_slug: { outletId, slug: p.slug } },
            update: { actualPrice: p.actualPrice, sellingPrice: p.sellingPrice, stock: p.stock },
            create: {
                title: p.title, slug: p.slug, description: `Authentic ${p.title}`,
                specialFeatures: p.specialFeatures, material: p.material, actualPrice: p.actualPrice,
                sellingPrice: p.sellingPrice, stock: p.stock, averageRating: p.rating, totalRatingsCount: p.count,
                outletId, categoryId, artisanId: artisan.id, images: { create: [{ url: p.img, sortOrder: 1 }] }
            },
        });
    }

    // ==========================================
    // 7. MASSIVE ORDER SEEDING FOR BESTSELLERS API
    // ==========================================
    console.log("⏳ Seeding Realistic Bestseller Orders...");
    const address = await prisma.address.create({
        data: {
            userId: customer.id, type: "HOME", isDefault: true, fullName: "Rahul Customer", phoneNumber: "9000000003",
            line1: "Flat 402", district: "Indore", state: "Madhya Pradesh", pincode: "452001"
        },
    });

    // 🔥 These specific sales volumes will dictate the #1, #2, #3 ranks in your Bestsellers API!
    const bestsellerSalesData = [
        { slug: "n-mango-pickle", qty: 45 },      // #1 Top Seller
        { slug: "w-alphonso-mango", qty: 30 },    // #2
        { slug: "n-basmati-rice", qty: 25 },      // #3
        { slug: "s-coconut-oil", qty: 18 },       // #4
        { slug: "n-wooden-elephant", qty: 10 },   // #5
        { slug: "s-cardamom-pods", qty: 8 },
        { slug: "w-bandhani-saree", qty: 5 },
        { slug: "n-blue-pottery", qty: 3 },
    ];

    for (const sale of bestsellerSalesData) {
        const product = dbProducts[sale.slug];

        // Create the massive order to trigger the groupBy aggregation
        await prisma.order.create({
            data: {
                userId: customer.id, addressId: address.id, productId: product.id,
                status: "DELIVERED", quantity: sale.qty,
                unitPrice: product.sellingPrice, totalAmount: product.sellingPrice * sale.qty,
                notes: "Bestseller aggregation logic seed"
            },
        });

        // Add 5-star reviews to make them show up perfectly in Top Picks too
        await prisma.review.create({
            data: {
                userId: customer.id, productId: product.id, rating: 5,
                comment: "Absolutely amazing quality! Highly recommended.", wouldRecommend: true,
            }
        });
    }

    // ==========================================
    // 8. MARKETING & SYSTEM SETTINGS
    // ==========================================
    console.log("⏳ Seeding Marketing & Settings...");
    await prisma.banner.create({ data: { imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836", link: "/promos", sortOrder: 1, isActive: true } });
    await prisma.testimonial.create({ data: { customerName: "Anita Rao", reviewText: "Zoyka changed how I buy local authentic products!", rating: 5, sortOrder: 1 } });

    await prisma.productionBatch.create({ data: { outletId: dbOutlets["OUT-W-FARM"].id, title: "Mango Sorting Batch", unitCount: 100, isApproved: true } });
    await prisma.payout.create({ data: { outletId: dbOutlets["OUT-W-FARM"].id, ordersCount: 50, grossAmount: 60000, amount: 54000, status: "COMPLETED" } });

    console.log("\n✅ MASTER SEED COMPLETED SUCCESSFULLY! 🎉");
    console.log(`Bestsellers APIs are now fully primed with sales data!`);
};

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });