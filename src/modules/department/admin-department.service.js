import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";

const generateSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

export const getAllDepartmentsAdminService = async () => {
    return await prisma.department.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: { select: { categories: true, outlets: true, regions: true } }
        }
    });
};

export const createDepartmentService = async (data) => {
    const slug = data.slug || generateSlug(data.name);

    const existingDepartment = await prisma.department.findFirst({
        where: { OR: [{ name: data.name }, { slug }] }
    });

    if (existingDepartment) throw new ApiError(400, "Department with this name or slug already exists");

    return await prisma.department.create({ data: { ...data, slug } });
};

export const updateDepartmentService = async (id, data) => {
    const department = await prisma.department.findUnique({ where: { id } });
    if (!department) throw new ApiError(404, "Department not found");

    const updateData = { ...data };
    if (data.name && !data.slug) updateData.slug = generateSlug(data.name);

    if (updateData.name || updateData.slug) {
        const conflict = await prisma.department.findFirst({
            where: {
                id: { not: id },
                OR: [
                    ...(updateData.name ? [{ name: updateData.name }] : []),
                    ...(updateData.slug ? [{ slug: updateData.slug }] : [])
                ]
            }
        });
        if (conflict) throw new ApiError(400, "Name or slug already in use");
    }

    return await prisma.department.update({ where: { id }, data: updateData });
};

export const toggleDepartmentStatusService = async (id) => {
    const department = await prisma.department.findUnique({ where: { id } });
    if (!department) throw new ApiError(404, "Department not found");

    return await prisma.department.update({
        where: { id },
        data: { isActive: !department.isActive },
    });
};

export const deleteDepartmentService = async (id) => {
    const department = await prisma.department.findUnique({
        where: { id },
        include: { _count: { select: { categories: true, outlets: true } } }
    });

    if (!department) throw new ApiError(404, "Department not found");
    if (department._count.categories > 0 || department._count.outlets > 0) {
        throw new ApiError(400, "Cannot delete department with active categories or outlets");
    }

    return await prisma.department.delete({ where: { id } });
};