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

    if (data.departmentId) {
      const department = await prisma.department.findUnique({ where: { id: data.departmentId } });
      if (!department) throw new ApiError(400, "Department not found");
    }

    const createData = {
      name: data.name,
      slug,
      description: data.description || null,
      departmentId: data.departmentId || null,
      isActive: data.isActive ?? true,
    };

    return await prisma.category.create({
      data: createData,
      include: {
        department: true,
        _count: { select: { products: true } },
      },
    });
};

export const updateCategoryService = async (id, data) => {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new ApiError(404, "Category not found");

    const updateData = {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      departmentId: data.departmentId || null,
      isActive: data.isActive,
    };

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

    if (updateData.departmentId) {
      const department = await prisma.department.findUnique({ where: { id: updateData.departmentId } });
      if (!department) throw new ApiError(400, "Department not found");
    }

    return await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
        _count: { select: { products: true } },
      },
    });
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