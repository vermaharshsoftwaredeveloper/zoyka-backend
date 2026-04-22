import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";

export const getAllOutletsService = async ({ regionId, categoryId } = {}) => {
  const where = { isActive: true, parentOutletId: null }; // exclude artisan sub-outlets
  if (regionId) where.regionId = regionId;
  if (categoryId) where.categoryId = categoryId;

  return prisma.outlet.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      imageUrl: true,
      location: true,
      address: true,
      noOfArtisans: true,
      categoryId: true,
      region: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      _count: { select: { products: true } },
    },
  });
};

export const getOutletDetailService = async (id) => {
  const outlet = await prisma.outlet.findUnique({
    where: { id, isActive: true },
    include: {
      region: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      manager: { select: { name: true, mobile: true } },
      products: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          actualPrice: true,
          sellingPrice: true,
          averageRating: true,
          totalRatingsCount: true,
          material: true,
          images: { select: { url: true }, take: 3 },
          artisan: { select: { id: true, name: true, avatar: true, location: true } },
          category: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!outlet) throw new ApiError(404, "Outlet not found");

  // Fetch all artisan sub-outlets for this store
  const artisanSubOutlets = await prisma.outlet.findMany({
    where: { parentOutletId: id, isActive: true },
    select: {
      owner: {
        select: { id: true, name: true, avatar: true, location: true },
      },
    },
  });

  // Build artisan map from all sub-outlets (guaranteed presence)
  const artisanMap = new Map();
  for (const sub of artisanSubOutlets) {
    if (sub.owner && !artisanMap.has(sub.owner.id)) {
      artisanMap.set(sub.owner.id, sub.owner);
    }
  }

  // Also merge any artisans associated with products but not yet in the map
  for (const product of outlet.products) {
    if (product.artisan && !artisanMap.has(product.artisan.id)) {
      artisanMap.set(product.artisan.id, product.artisan);
    }
  }

  // Format products for frontend (keep images as objects with url property)
  const products = outlet.products.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description,
    actualPrice: p.actualPrice,
    sellingPrice: p.sellingPrice,
    averageRating: p.averageRating,
    totalRatingsCount: p.totalRatingsCount,
    material: p.material,
    images: p.images || [],
    artisan: p.artisan,
    category: p.category,
  }));

  return {
    id: outlet.id,
    key: outlet.key,
    name: outlet.name,
    description: outlet.description,
    imageUrl: outlet.imageUrl,
    location: outlet.location,
    address: outlet.address,
    noOfArtisans: outlet.noOfArtisans,
    region: outlet.region,
    category: outlet.category,
    department: outlet.department,
    manager: outlet.manager,
    artisans: Array.from(artisanMap.values()),
    products,
    stats: {
      totalProducts: products.length,
      totalArtisans: artisanMap.size,
    },
  };
};
