import ApiError from "../../utils/api-error/index.js";
import { asyncHandler } from "../../utils/async-handler/index.js";
import { createBulkOrderInquiryService } from "./bulk-order-inquiry.service.js";
import { createBulkOrderInquirySchema } from "./bulk-order-inquiry.validation.js";

const parseBody = (body) => {
  const parsed = createBulkOrderInquirySchema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ApiError(400, issue?.message || "Invalid request body");
  }

  return parsed.data;
};

export const createBulkOrderInquiry = asyncHandler(async (req, res) => {
  const payload = parseBody(req.body);
  const data = await createBulkOrderInquiryService(payload, req.user?.id);

  res.status(201).json({
    message: "Bulk order inquiry submitted successfully",
    data,
  });
});
