import ApiError from "../../utils/api-error/index.js";
import { asyncHandler } from "../../utils/async-handler/index.js";
import { createHelpRequestService } from "./help-request.service.js";
import { createHelpRequestSchema } from "./help-request.validation.js";

const parseBody = (body) => {
  const parsed = createHelpRequestSchema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ApiError(400, issue?.message || "Invalid request body");
  }

  return parsed.data;
};

export const createHelpRequest = asyncHandler(async (req, res) => {
  const payload = parseBody(req.body);
  const data = await createHelpRequestService(payload, req.user?.id);

  res.status(201).json({
    message: "Help request submitted successfully",
    data,
  });
});
