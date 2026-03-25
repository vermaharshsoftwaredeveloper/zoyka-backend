import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";

const verifyManagerRole = async (managerId) => {
    if (!managerId) return;
    const user = await prisma.user.findUnique({ where: { id: managerId } });
    if (!user) {
        throw new ApiError(404, "The specified user for Manager was not found.");
    }
    if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
        throw new ApiError(400, "The assigned user must have a MANAGER or ADMIN role.");
    }
};

export const getAllRegionsAdminService = async (filters) => {
    const where = {};
    if (filters.categoryId) where.categoryId = filters.categoryId;

    const regions = await prisma.region.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            category: { select: { id: true, name: true } },
            manager: { select: { id: true, name: true, email: true } },
            _count: { select: { outlets: true } },
            outlets: {
                where: { isActive: true, owner: { role: 'PRODUCER' } },
                select: { id: true }
            }
        }
    });

    return regions.map(r => ({
        id: r.id,
        name: r.name,
        isActive: r.isActive,
        category: r.category,
        manager: r.manager,
        totalOutlets: r._count.outlets,
        activeProducersCount: r.outlets.length
    }));
};

export const createRegionService = async (data) => {
    const existingRegion = await prisma.region.findUnique({ where: { name: data.name } });
    if (existingRegion) {
        throw new ApiError(400, "A region with this name already exists.");
    }

    await verifyManagerRole(data.managerId);

    return await prisma.region.create({
        data,
        include: { manager: { select: { name: true, email: true } } }
    });
};

export const updateRegionService = async (id, data) => {
    const region = await prisma.region.findUnique({ where: { id } });
    if (!region) throw new ApiError(404, "Region not found.");

    if (data.name && data.name !== region.name) {
        const conflict = await prisma.region.findUnique({ where: { name: data.name } });
        if (conflict) throw new ApiError(400, "Another region with this name already exists.");
    }

    if (data.managerId !== undefined && data.managerId !== region.managerId) {
        await verifyManagerRole(data.managerId);
    }

    return await prisma.region.update({
        where: { id },
        data,
        include: { manager: { select: { name: true, email: true } } }
    });
};

export const toggleRegionStatusService = async (id) => {
    const region = await prisma.region.findUnique({ where: { id } });
    if (!region) throw new ApiError(404, "Region not found.");

    return await prisma.region.update({
        where: { id },
        data: { isActive: !region.isActive },
    });
};

export const deleteRegionService = async (id) => {
    const region = await prisma.region.findUnique({
        where: { id },
        include: { _count: { select: { outlets: true } } }
    });

    if (!region) throw new ApiError(404, "Region not found.");

    if (region._count.outlets > 0) {
        throw new ApiError(400, `Cannot delete region. It currently has ${region._count.outlets} producers/outlets assigned to it.`);
    }

    await prisma.region.delete({ where: { id } });
    return { message: "Region deleted successfully." };
};