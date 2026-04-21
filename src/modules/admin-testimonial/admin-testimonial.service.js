import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";
import { uploadImage, replaceImage, deleteImage } from "../../services/upload.service.js";

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
  // Process customer image (base64 or URL)
  if (payload.customerImageUrl && payload.customerImageUrl.startsWith("data:image/")) {
    payload.customerImageUrl = await uploadImage(payload.customerImageUrl, "testimonials", "testimonial");
  }

  return prisma.testimonial.create({
    data: payload,
    select: testimonialSelect,
  });
};

export const updateAdminTestimonialService = async (testimonialId, payload) => {
  const existing = await getAdminTestimonialByIdService(testimonialId);

  // Process customer image on update (replace old)
  if (payload.customerImageUrl && payload.customerImageUrl.startsWith("data:image/")) {
    payload.customerImageUrl = await replaceImage(payload.customerImageUrl, existing.customerImageUrl, "testimonials", "testimonial");
  }

  return prisma.testimonial.update({
    where: { id: testimonialId },
    data: payload,
    select: testimonialSelect,
  });
};

export const deleteAdminTestimonialService = async (testimonialId) => {
  const existing = await getAdminTestimonialByIdService(testimonialId);

  const deleted = await prisma.testimonial.delete({
    where: { id: testimonialId },
    select: testimonialSelect,
  });

  // Clean up image from storage
  if (existing.customerImageUrl) {
    await deleteImage(existing.customerImageUrl);
  }

  return deleted;
};
