import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";

const verifyProducerRole = async (ownerId) => {
    if (!ownerId) return;
    const user = await prisma.user.findUnique({ where: { id: ownerId } });
    if (!user) throw new ApiError(404, "The specified user for Owner was not found.");
    if (user.role !== 'PRODUCER' && user.role !== 'ADMIN') {
        throw new ApiError(400, "The assigned owner must have a PRODUCER or ADMIN role.");
    }
};

export const getAllOutletsAdminService = async (filters) => {
    const where = {};
    if (filters.regionId) {
        where.regionId = filters.regionId;
    }

    return await prisma.outlet.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            region: { select: { name: true } },
            owner: { select: { name: true, email: true, mobile: true } },
            _count: { select: { products: true } }
        }
    });
};

export const createOutletService = async (data) => {
    const existingOutlet = await prisma.outlet.findUnique({ where: { key: data.key } });
    if (existingOutlet) throw new ApiError(400, "A Producer/Outlet with this key already exists");

    await verifyProducerRole(data.ownerId);

    return await prisma.outlet.create({
        data,
        include: { region: true, owner: { select: { name: true, email: true } } }
    });
};

export const updateOutletService = async (id, data) => {
    const outlet = await prisma.outlet.findUnique({ where: { id } });
    if (!outlet) throw new ApiError(404, "Producer/Outlet not found");

    if (data.key && data.key !== outlet.key) {
        const keyExists = await prisma.outlet.findUnique({ where: { key: data.key } });
        if (keyExists) throw new ApiError(400, "Another Producer with this key already exists");
    }

    if (data.ownerId !== undefined && data.ownerId !== outlet.ownerId) {
        await verifyProducerRole(data.ownerId);
    }

    return await prisma.outlet.update({
        where: { id },
        data,
        include: { region: true, owner: { select: { name: true, email: true } } }
    });
};

export const toggleOutletStatusService = async (id) => {
    const outlet = await prisma.outlet.findUnique({ where: { id } });
    if (!outlet) throw new ApiError(404, "Producer/Outlet not found");

    return await prisma.outlet.update({
        where: { id },
        data: { isActive: !outlet.isActive },
    });
};

export const getOutletByIdAdminService = async (id) => {
    const outlet = await prisma.outlet.findUnique({
        where: { id },
        include: {
            region: { select: { id: true, name: true } },
            owner: { select: { id: true, name: true, email: true, mobile: true, role: true } },
            products: { where: { isActive: true }, select: { id: true } }
        }
    });

    if (!outlet) throw new ApiError(404, "Producer not found");

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [orderStats, ratingStats] = await Promise.all([
        prisma.order.aggregate({
            where: {
                product: { outletId: id },
                status: 'DELIVERED',
                createdAt: { gte: startOfMonth }
            },
            _sum: { totalAmount: true },
            _count: { id: true }
        }),
        prisma.review.aggregate({
            where: { product: { outletId: id } },
            _avg: { rating: true }
        })
    ]);

    return {
        id: outlet.id,
        key: outlet.key,
        name: outlet.name,
        description: outlet.description,
        isActive: outlet.isActive,
        monthlyCapacity: outlet.monthlyCapacity,
        region: outlet.region,

        contactInfo: {
            producerName: outlet.owner?.name || "Unassigned",
            mobile: outlet.owner?.mobile || "N/A",
            email: outlet.owner?.email || "N/A",
            address: outlet.address || "N/A"
        },

        stats: {
            rating: ratingStats._avg.rating ? Number(ratingStats._avg.rating.toFixed(1)) : 0,
            activeSKUs: outlet.products.length,
            qualityScore: outlet.qualityScore || 0,
            thisMonthEarnings: orderStats._sum.totalAmount || 0,
            thisMonthOrdersCompleted: orderStats._count.id || 0
        }
    };
};