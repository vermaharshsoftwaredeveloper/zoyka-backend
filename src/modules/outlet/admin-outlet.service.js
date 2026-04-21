import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";
import { uploadImage, replaceImage, deleteImage } from "../../services/upload.service.js";

const verifyManagerRole = async (managerId) => {
    if (!managerId) return;
    const user = await prisma.user.findUnique({ where: { id: managerId } });
    if (!user) throw new ApiError(404, "The specified user for Manager was not found.");
    if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
        throw new ApiError(400, "The assigned manager must have a MANAGER or ADMIN role.");
    }
};

export const getAllOutletsAdminService = async (filters) => {
    const where = { parentOutletId: null }; // exclude artisan sub-outlets
    if (filters.regionId) {
        where.regionId = filters.regionId;
    }

    return await prisma.outlet.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            region: { select: { name: true } },
            department: { select: { name: true } },
            manager: { select: { name: true, email: true, mobile: true } },
            _count: { select: { products: true } }
        }
    });
};

export const createOutletService = async (data) => {
    const existingOutlet = await prisma.outlet.findUnique({ where: { key: data.key } });
    if (existingOutlet) throw new ApiError(400, "An Outlet with this key already exists");

    await verifyManagerRole(data.managerId);

    // Handle image upload
    const { image, ...outletData } = data;
    if (image && image.startsWith("data:image/")) {
        outletData.imageUrl = await uploadImage(image, "outlets", "outlet");
    }

    try {
        return await prisma.outlet.create({ data: outletData });
    } catch (error) {
        if (error?.code === "P2002") {
            if (error.meta?.target?.includes('managerId')) {
                throw new ApiError(409, "This Operations Manager is already assigned to another outlet!");
            }
            throw new ApiError(409, "Outlet key already exists");
        }
        throw error;
    }
};

export const updateOutletService = async (id, data) => {
    const outlet = await prisma.outlet.findUnique({ where: { id } });
    if (!outlet) throw new ApiError(404, "Outlet not found");

    if (data.key && data.key !== outlet.key) {
        const existingOutlet = await prisma.outlet.findUnique({ where: { key: data.key } });
        if (existingOutlet) throw new ApiError(400, "An Outlet with this key already exists");
    }

    await verifyManagerRole(data.managerId);

    // Handle image upload/replace
    const { image, ...updateData } = data;
    if (image && image.startsWith("data:image/")) {
        updateData.imageUrl = await replaceImage(image, outlet.imageUrl, "outlets", "outlet");
    }

    try {
        return await prisma.outlet.update({
            where: { id },
            data: updateData
        });
    } catch (error) {
        if (error?.code === "P2002") {
            if (error.meta?.target?.includes('managerId')) {
                throw new ApiError(409, "This Operations Manager is already assigned to another outlet!");
            }
            throw new ApiError(409, "Outlet key already exists");
        }
        throw error;
    }
};

export const toggleOutletStatusService = async (id) => {
    const outlet = await prisma.outlet.findUnique({ where: { id } });
    if (!outlet) throw new ApiError(404, "Outlet not found");

    return await prisma.outlet.update({
        where: { id },
        data: { isActive: !outlet.isActive }
    });
};

export const deleteOutletService = async (id) => {
    const outlet = await prisma.outlet.findUnique({ where: { id } });
    if (!outlet) throw new ApiError(404, "Outlet not found");
    return await prisma.outlet.delete({ where: { id } });
};

export const getOutletByIdService = async (id) => {
    const outlet = await prisma.outlet.findUnique({
        where: { id },
        include: {
            region: true,
            department: true,
            manager: { select: { name: true, email: true, mobile: true } },
            _count: { select: { products: true } }
        }
    });

    if (!outlet) throw new ApiError(404, "Outlet not found");

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
        imageUrl: outlet.imageUrl,
        location: outlet.location,
        address: outlet.address,
        noOfArtisans: outlet.noOfArtisans,
        monthlyCapacity: outlet.monthlyCapacity,
        region: outlet.region,
        department: outlet.department,

        contactInfo: {
            managerName: outlet.manager?.name || "Unassigned",
            mobile: outlet.manager?.mobile || "N/A",
            email: outlet.manager?.email || "N/A",
            address: outlet.address || "N/A"
        },

        stats: {
            rating: ratingStats._avg.rating ? Number(ratingStats._avg.rating.toFixed(1)) : 0,
            activeSKUs: outlet._count?.products || 0,
            monthlyRevenue: orderStats._sum.totalAmount || 0,
            ordersThisMonth: orderStats._count.id || 0
        }
    };
};