import ApiError from "../../utils/api-error/index.js";
import { asyncHandler } from "../../utils/async-handler/index.js";
import {
  createAdminTestimonialSchema,
  listAdminTestimonialsQuerySchema,
  updateAdminTestimonialSchema,
} from "./admin-testimonial.validation.js";
import {
  createAdminTestimonialService,
  deleteAdminTestimonialService,
  getAdminTestimonialByIdService,
  listAdminTestimonialsService,
  updateAdminTestimonialService,
} from "./admin-testimonial.service.js";

const parseQuery = (schema, query) => {
  const parsed = schema.safeParse(query);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ApiError(400, issue?.message || "Invalid query params");
  }

  return parsed.data;
};

const parseBody = (schema, body) => {
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ApiError(400, issue?.message || "Invalid request body");
  }

  return parsed.data;
};

export const listAdminTestimonials = asyncHandler(async (req, res) => {
  const query = parseQuery(listAdminTestimonialsQuerySchema, req.query);
  const response = await listAdminTestimonialsService({
    ...query,
    isActive: query.isActive === undefined ? undefined : query.isActive === "true",
  });

  res.status(200).json({
    message: "Admin testimonials fetched successfully",
    ...response,
  });
});

export const getAdminTestimonialById = asyncHandler(async (req, res) => {
  const data = await getAdminTestimonialByIdService(req.params.testimonialId);

  res.status(200).json({
    message: "Admin testimonial fetched successfully",
    data,
  });
});

export const createAdminTestimonial = asyncHandler(async (req, res) => {
  const payload = parseBody(createAdminTestimonialSchema, req.body);
  const data = await createAdminTestimonialService(payload);

  res.status(201).json({
    message: "Testimonial created successfully",
    data,
  });
});

export const updateAdminTestimonial = asyncHandler(async (req, res) => {
  const payload = parseBody(updateAdminTestimonialSchema, req.body);
  const data = await updateAdminTestimonialService(req.params.testimonialId, payload);

  res.status(200).json({
    message: "Testimonial updated successfully",
    data,
  });
});

export const deleteAdminTestimonial = asyncHandler(async (req, res) => {
  const data = await deleteAdminTestimonialService(req.params.testimonialId);

  res.status(200).json({
    message: "Testimonial deleted successfully",
    data,
  });
});
