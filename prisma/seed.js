import bcrypt from "bcryptjs";
import prisma from "../src/config/prisma.js";

const hashPassword = (plain) => bcrypt.hash(plain, 10);

const main = async () => {
    console.log("🌱 Starting Master Seed for ALL Models...");

    // ==========================================
    // 1. USERS (Users Model)
    // ==========================================
    console.log("⏳ Seeding Users...");
    const hashedPassword = await hashPassword("Password@123");

    const admin = await prisma.user.upsert({
        where: { email: "admin@zoyka.com" },
        update: {},
        create: { email: "admin@zoyka.com", mobile: "9000000001", name: "Super Admin", role: "SUPER_ADMIN", password: hashedPassword, isEmailVerified: true },
    });

    const manager = await prisma.user.upsert({
        where: { email: "manager@zoyka.com" },
        update: {},
        create: { email: "manager@zoyka.com", mobile: "9000000002", name: "Ops Manager", role: "MANAGER", password: hashedPassword, isEmailVerified: true },
    });

    const customer = await prisma.user.upsert({
        where: { email: "customer@zoyka.com" },
        update: {},
        create: { email: "customer@zoyka.com", mobile: "9000000003", name: "Rahul Customer", role: "USER", password: hashedPassword, isEmailVerified: true },
    });

    const kitchenOwner = await prisma.user.upsert({
        where: { email: "kitchen@zoyka.com" },
        update: {},
        create: { email: "kitchen@zoyka.com", mobile: "9100000001", name: "Chef Sharma", role: "KITCHEN", password: hashedPassword, isEmailVerified: true },
    });

    // Added Producer User Here
    const producer = await prisma.user.upsert({
        where: { email: "producer@zoyka.com" },
        update: {},
        create: { email: "producer@zoyka.com", mobile: "9000000888", name: "Sample Producer", role: "PRODUCER", password: hashedPassword, isEmailVerified: true },
    });

    // ==========================================
    // 2. CATEGORIES & REGIONS
    // ==========================================
    console.log("⏳ Seeding Categories & Regions...");
    const category = await prisma.category.upsert({
        where: { slug: "cloud-kitchen" },
        update: {},
        create: { name: "Cloud Kitchen", slug: "cloud-kitchen", description: "Freshly prepared food", isActive: true },
    });

    const region = await prisma.region.upsert({
        where: { name: "North India" },
        update: {},
        create: { name: "North India", isActive: true, managerId: manager.id, categoryId: category.id },
    });

    // ==========================================
    // 3. OUTLETS
    // ==========================================
    console.log("⏳ Seeding Outlets...");
    const outlet = await prisma.outlet.upsert({
        where: { key: "OUT-KITCHEN-01" },
        update: {},
        create: {
            key: "OUT-KITCHEN-01", name: "Sharma Ji Ki Rasoi", description: "Authentic Meals",
            imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1",
            address: "123 Food Street, Delhi", monthlyCapacity: 500, qualityScore: 4.8,
            ownerId: kitchenOwner.id, categoryId: category.id, regionId: region.id
        },
    });

    // ==========================================
    // 4. PRODUCTS & PRODUCT IMAGES
    // ==========================================
    console.log("⏳ Seeding Products & Images...");
    const product = await prisma.product.upsert({
        where: { outletId_slug: { outletId: outlet.id, slug: "paneer-butter-masala" } },
        update: {},
        create: {
            title: "Paneer Butter Masala", slug: "paneer-butter-masala", description: "Rich gravy paneer.",
            producerName: "Chef Sharma", producerStory: "A family recipe passed down for generations.",
            district: "New Delhi", price: 250, stock: 50, averageRating: 4.5, totalRatingsCount: 1,
            outletId: outlet.id, categoryId: category.id,
            images: {
                create: [
                    { url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc0", sortOrder: 1 },
                    { url: "https://images.unsplash.com/photo-1589302168068-964664d93dc0", sortOrder: 2 }
                ]
            }
        },
    });

    // ==========================================
    // 5. ADDRESSES
    // ==========================================
    console.log("⏳ Seeding Customer Address...");
    const address = await prisma.address.create({
        data: {
            userId: customer.id, type: "HOME", isDefault: true,
            fullName: "Rahul Customer", phoneNumber: "9000000003",
            line1: "Flat 402, Royal Apartments", line2: "Near Park", landmark: "Big Bazaar",
            district: "Indore", state: "Madhya Pradesh", pincode: "452001"
        },
    });

    // ==========================================
    // 6. ORDERS
    // ==========================================
    console.log("⏳ Seeding Orders...");
    const order = await prisma.order.create({
        data: {
            userId: customer.id, addressId: address.id, productId: product.id,
            status: "DELIVERED", quantity: 2, unitPrice: 250, totalAmount: 500,
            notes: "Please pack extra spicy!"
        },
    });

    // ==========================================
    // 7. CART & WISHLIST
    // ==========================================
    console.log("⏳ Seeding Cart & Wishlist...");
    const cart = await prisma.cart.upsert({
        where: { userId: customer.id },
        update: {},
        create: { userId: customer.id },
    });

    await prisma.cartItem.create({
        data: { cartId: cart.id, productId: product.id, quantity: 1 }
    });

    await prisma.wishlist.create({
        data: { userId: customer.id, productId: product.id }
    });

    // ==========================================
    // 8. REVIEWS & REVIEW IMAGES
    // ==========================================
    console.log("⏳ Seeding Reviews...");
    await prisma.review.create({
        data: {
            userId: customer.id, productId: product.id, rating: 5,
            comment: "Absolutely delicious! Highly recommended.", wouldRecommend: true,
            images: {
                create: [{ url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1", sortOrder: 1 }]
            }
        }
    });

    // ==========================================
    // 9. MARKETING (Banners, Coupons, Testimonials)
    // ==========================================
    console.log("⏳ Seeding Marketing (Banners, Coupons, Testimonials)...");
    await prisma.banner.create({
        data: { imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836", link: "/promos", sortOrder: 1, isActive: true }
    });

    await prisma.coupon.upsert({
        where: { code: "WELCOME50" },
        update: {},
        create: { code: "WELCOME50", description: "Flat 50% Off", discountType: "PERCENTAGE", discountValue: 50, minOrderAmount: 200, maxDiscount: 100, isActive: true, usageLimit: 100 }
    });

    await prisma.testimonial.create({
        data: { customerName: "Anita Rao", reviewText: "Zoyka changed how I buy local food!", rating: 5, sortOrder: 1 }
    });

    // ==========================================
    // 10. SUPPORT & INQUIRIES
    // ==========================================
    console.log("⏳ Seeding Support Queries & Inquiries...");
    await prisma.contactUsQuery.create({
        data: { userId: customer.id, name: "Rahul", email: customer.email, phone: customer.mobile, message: "I want to become a vendor on Zoyka." }
    });

    await prisma.bulkOrderInquiry.create({
        data: {
            userId: customer.id, fullName: "Rahul", companyName: "TechCorp", email: "rahul@techcorp.com",
            phoneNumber: "9000000003", quantityRequired: 100, city: "Indore", state: "MP", pincode: "452001",
            additionalDetails: "Need 100 corporate gift hampers."
        }
    });

    await prisma.paymentDeliveryHelpRequest.create({
        data: { userId: customer.id, referenceId: order.id, additionalDetails: "Payment was deducted but order shows pending." }
    });

    // ==========================================
    // 11. FINANCE (Batches & Payouts)
    // ==========================================
    console.log("⏳ Seeding Finance Data...");
    await prisma.productionBatch.create({
        data: { outletId: outlet.id, title: "Morning Paneer Prep", unitCount: 100, qualityStatus: "APPROVED", isApproved: true }
    });

    await prisma.payout.create({
        data: { outletId: outlet.id, ordersCount: 5, grossAmount: 2500, commission: 250, amount: 2250, status: "COMPLETED" }
    });

    console.log("\n✅ MASTER SEED COMPLETED SUCCESSFULLY! 🎉");
    console.log("All 21 Database Models have been populated.");
};

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });