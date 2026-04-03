import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";

const generateSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

export const getAllCategoriesAdminService = async () => {
    return await prisma.category.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            department: true,
            _count: { select: { products: true } }
        }
    });
};

export const createCategoryService = async (data) => {
    const slug = data.slug || generateSlug(data.name);

    const existingCategory = await prisma.category.findFirst({
        where: { OR: [{ name: data.name }, { slug }] }
    });

    if (existingCategory) throw new ApiError(400, "Category with this name or slug already exists");

    return await prisma.category.create({ data: { ...data, slug } });
};

export const updateCategoryService = async (id, data) => {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new ApiError(404, "Category not found");

    const updateData = { ...data };
    if (data.name && !data.slug) updateData.slug = generateSlug(data.name);

    if (updateData.name || updateData.slug) {
        const conflict = await prisma.category.findFirst({
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

    return await prisma.category.update({ where: { id }, data: updateData });
};

export const toggleCategoryStatusService = async (id) => {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new ApiError(404, "Category not found");

    return await prisma.category.update({
        where: { id },
        data: { isActive: !category.isActive },
    });
};

export const deleteCategoryService = async (id) => {
    const category = await prisma.category.findUnique({
        where: { id },
        include: { _count: { select: { products: true } } }
    });

    if (!category) throw new ApiError(404, "Category not found");
    if (category._count.products > 0) throw new ApiError(400, "Cannot delete category with active products");

    return await prisma.category.delete({ where: { id } });
};