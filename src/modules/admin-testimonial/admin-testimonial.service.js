import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";

const testimonialSelect = {
  id: true,
  customerName: true,
  customerImageUrl: true,
  reviewText: true,
  rating: true,
  sortOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export const listAdminTestimonialsService = async ({ search, isActive, page, limit }) => {
  const where = {};

  if (typeof isActive === "boolean") {
    where.isActive = isActive;
  }

  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: "insensitive" } },
      { reviewText: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.testimonial.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: testimonialSelect,
    }),
    prisma.testimonial.count({ where }),
  ]);

  return { data, page, limit, total };
};

export const getAdminTestimonialByIdService = async (testimonialId) => {
  const testimonial = await prisma.testimonial.findUnique({
    where: { id: testimonialId },
    select: testimonialSelect,
  });

  if (!testimonial) {
    throw new ApiError(404, "Testimonial not found");
  }

  return testimonial;
};

export const createAdminTestimonialService = async (payload) => {
  return prisma.testimonial.create({
    data: payload,
    select: testimonialSelect,
  });
};

export const updateAdminTestimonialService = async (testimonialId, payload) => {
  await getAdminTestimonialByIdService(testimonialId);

  return prisma.testimonial.update({
    where: { id: testimonialId },
    data: payload,
    select: testimonialSelect,
  });
};

export const deleteAdminTestimonialService = async (testimonialId) => {
  await getAdminTestimonialByIdService(testimonialId);

  return prisma.testimonial.delete({
    where: { id: testimonialId },
    select: testimonialSelect,
  });
};
