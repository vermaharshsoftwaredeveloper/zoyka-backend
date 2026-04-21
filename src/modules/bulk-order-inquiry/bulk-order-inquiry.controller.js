import ApiError from "../../utils/api-error/index.js";
import { asyncHandler } from "../../utils/async-handler/index.js";
import prisma from "../../config/prisma.js";
import {
  createBulkOrderInquiryService,
  getAllBulkOrderInquiriesService,
  getBulkOrderInquiryByIdService,
  updateBulkOrderInquiryService,
  deleteBulkOrderInquiryService,
} from "./bulk-order-inquiry.service.js";
import {
  createBulkOrderInquirySchema,
  updateBulkOrderInquirySchema,
} from "./bulk-order-inquiry.validation.js";

const parseBody = (body, schema) => {
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ApiError(400, issue?.message || "Invalid request body");
  }

  return parsed.data;
};

export const createBulkOrderInquiry = asyncHandler(async (req, res) => {
  const payload = parseBody(req.body, createBulkOrderInquirySchema);
  const data = await createBulkOrderInquiryService(payload, req.user?.id);

  res.status(201).json({
    message: "Bulk order inquiry submitted successfully",
    data,
  });
});

export const getAllBulkOrderInquiries = asyncHandler(async (req, res) => {
  const { outletId, status, page, limit } = req.query;
  const userRole = req.user?.role;

  // If user is a MANAGER, filter by their managed outlet
  let filters = { status, page, limit };

  if (userRole === "MANAGER") {
    // Fetch the manager's outlet
    const manager = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        managedOutlet: {
          select: { id: true },
        },
      },
    });

    if (manager?.managedOutlet?.id) {
      filters.outletId = manager.managedOutlet.id;
    }
  } else if (outletId) {
    filters.outletId = outletId;
  }

  const result = await getAllBulkOrderInquiriesService(filters);

  res.status(200).json({
    message: "Bulk order inquiries fetched successfully",
    ...result,
  });
});

export const getBulkOrderInquiryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = await getBulkOrderInquiryByIdService(id);

  if (!data) {
    throw new ApiError(404, "Bulk order inquiry not found");
  }

  res.status(200).json({
    message: "Bulk order inquiry fetched successfully",
    data,
  });
});

export const updateBulkOrderInquiry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payload = parseBody(req.body, updateBulkOrderInquirySchema);

  const existing = await getBulkOrderInquiryByIdService(id);
  if (!existing) {
    throw new ApiError(404, "Bulk order inquiry not found");
  }

  const data = await updateBulkOrderInquiryService(id, payload);

  res.status(200).json({
    message: "Bulk order inquiry updated successfully",
    data,
  });
});

export const deleteBulkOrderInquiry = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await getBulkOrderInquiryByIdService(id);
  if (!existing) {
    throw new ApiError(404, "Bulk order inquiry not found");
  }

  await deleteBulkOrderInquiryService(id);

  res.status(200).json({
    message: "Bulk order inquiry deleted successfully",
  });
});
