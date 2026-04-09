import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";
import * as bcrypt from "bcryptjs";

const generateKey = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export const getAllArtisansAdminService = async (filters) => {
    const where = { owner: { role: 'ARTISAN' } };

    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.regionId) where.regionId = filters.regionId;
    if (filters.outletId) where.id = filters.outletId;

    const artisans = await prisma.outlet.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            region: { select: { name: true } },
            category: { select: { name: true } },
            owner: { select: { name: true } },
            products: { where: { isActive: true }, select: { id: true } }
        }
    });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const enrichedArtisans = await Promise.all(artisans.map(async (artisan) => {
        const [earnings, rating] = await Promise.all([
            prisma.order.aggregate({
                where: { product: { outletId: artisan.id }, status: 'DELIVERED', createdAt: { gte: startOfMonth } },
                _sum: { totalAmount: true }
            }),
            prisma.review.aggregate({
                where: { product: { outletId: artisan.id } },
                _avg: { rating: true }
            })
        ]);

        return {
            id: artisan.id,
            name: artisan.name,
            artisanName: artisan.owner?.name || "N/A",
            region: artisan.region?.name || "Unassigned",
            category: artisan.category?.name || "Unassigned",
            address: artisan.address || "N/A",
            monthlyCapacity: artisan.monthlyCapacity || 0,
            activeSKUs: artisan.products.length,
            rating: rating._avg.rating ? Number(rating._avg.rating.toFixed(1)) : 0,
            thisMonthEarnings: earnings._sum.totalAmount || 0,
            yearsOfExperience: artisan.yearsOfExperience || 0,
        };
    }));

    return enrichedArtisans;
};

export const createArtisanService = async (data) => {
    let user = await prisma.user.findFirst({
        where: { OR: [{ email: data.email }, { mobile: data.mobile }] }
    });

    if (user && user.role !== 'ARTISAN') {
        throw new ApiError(400, "User exists but is not an ARTISAN.");
    }

    if (!user) {
        const defaultPassword = await bcrypt.hash("Zoyka@123", 10);

        user = await prisma.user.create({
            data: {
                name: data.artisanName,
                email: data.email,
                mobile: data.mobile,
                password: defaultPassword,
                role: 'ARTISAN',
                isEmailVerified: true
            }
        });
    }

    //  Link artisan to existing outlet
    return await prisma.outlet.update({
        where: { id: data.outletId },
        data: {
            ownerId: user.id,
            monthlyCapacity: data.monthlyCapacity,
            address: data.address
        }
    });
};

export const getArtisanByIdAdminService = async (id) => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const outlet = await prisma.outlet.findUnique({
        where: { id },
        include: {
            owner: { select: { name: true, email: true, mobile: true } },
            productionBatches: { orderBy: { createdAt: 'desc' }, take: 10 },
            payouts: { orderBy: { createdAt: 'desc' }, take: 10 },
            products: { where: { isActive: true }, select: { id: true } }
        }
    });

    if (!outlet) throw new ApiError(404, "Artisan not found");

    const [orders, allTimeOrders] = await Promise.all([
        prisma.order.aggregate({
            where: { product: { outletId: id }, status: 'DELIVERED', createdAt: { gte: startOfMonth } },
            _sum: { totalAmount: true }, _count: { id: true }
        }),
        prisma.order.aggregate({
            where: { product: { outletId: id }, status: 'DELIVERED' },
            _sum: { quantity: true }
        })
    ]);

    return {
        overview: {
            contactInfo: {
                phone: outlet.owner?.mobile || "N/A",
                email: outlet.owner?.email || "N/A",
                address: outlet.address || "N/A"
            },
            performance: {
                ordersCompleted: orders._count.id || 0,
                earnings: orders._sum.totalAmount || 0,
                qualityScore: outlet.qualityScore || 0
            }
        },
        skus: {
            activeSKUsCount: outlet.products.length,
            totalUnitsSold: allTimeOrders._sum.quantity || 0
        },
        production: outlet.productionBatches,
        payments: outlet.payouts
    };
};

export const updateArtisanService = async (id, data) => {
    const outlet = await prisma.outlet.findUnique({ where: { id } });
    if (!outlet) throw new ApiError(404, "Artisan Outlet not found");

    const updatedOutlet = await prisma.outlet.update({
        where: { id },
        data: {
            name: data.outletName,
            address: data.address,
            monthlyCapacity: data.monthlyCapacity,
            categoryId: data.categoryId,
            regionId: data.regionId,
            isActive: data.isActive
        }
    });

    if (data.yearsOfExperience !== undefined && outlet.ownerId) {
        await prisma.user.update({
            where: { id: outlet.ownerId },
            data: { yearsOfExperience: data.yearsOfExperience }
        });
    }

    return updatedOutlet;
};

export const toggleArtisanStatusService = async (id) => {
    const outlet = await prisma.outlet.findUnique({ where: { id } });
    if (!outlet) throw new ApiError(404, "Artisan/Outlet not found");

    return await prisma.outlet.update({
        where: { id },
        data: { isActive: !outlet.isActive },
    });
};