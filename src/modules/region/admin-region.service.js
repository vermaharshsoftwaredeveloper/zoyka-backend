import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";

export const getAllRegionsAdminService = async (filters) => {
    const where = {};
    if (filters.departmentId) where.departmentId = filters.departmentId;

    const regions = await prisma.region.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            department: { select: { id: true, name: true } },
            _count: { select: { outlets: true } },
            outlets: {
                where: { isActive: true },
                select: { id: true }
            }
        }
    });

    return regions.map(r => ({
        id: r.id,
        name: r.name,
        state: r.state,
        district: r.district,
        regionHead: r.regionHead,
        isActive: r.isActive,
        department: r.department,
        createdAt: r.createdAt,
        stats: {
            activeOutlets: r.outlets.length,
            totalOutlets: r._count.outlets
        }
    }));
};

export const createRegionService = async (data) => {
    if (!data.departmentId) {
        throw new ApiError(400, "Department is required for a region.");
    }

    const department = await prisma.department.findUnique({ where: { id: data.departmentId } });
    if (!department) {
        throw new ApiError(400, "Invalid department selected.");
    }

    const existingRegion = await prisma.region.findUnique({ where: { name: data.name } });
    if (existingRegion) throw new ApiError(400, "Region with this name already exists.");

    return await prisma.region.create({
        data,
    });
};

export const updateRegionService = async (id, data) => {
    const region = await prisma.region.findUnique({ where: { id } });
    if (!region) throw new ApiError(404, "Region not found.");

    if (data.name && data.name !== region.name) {
        const conflict = await prisma.region.findUnique({ where: { name: data.name } });
        if (conflict) throw new ApiError(400, "Another region with this name already exists.");
    }

    if (data.departmentId) {
        const department = await prisma.department.findUnique({ where: { id: data.departmentId } });
        if (!department) {
            throw new ApiError(400, "Invalid department selected.");
        }
    }

    return await prisma.region.update({
        where: { id },
        data,
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
        throw new ApiError(400, "Cannot delete region with existing outlets. Deactivate it instead or reassign outlets.");
    }

    return await prisma.region.delete({ where: { id } });
};