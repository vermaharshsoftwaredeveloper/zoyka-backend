import ApiError from "../../utils/api-error/index.js";
import { asyncHandler } from "../../utils/async-handler/index.js";
import { createContactQueryService } from "./contact.service.js";
import { createContactQuerySchema } from "./contact.validation.js";

const parseBody = (body) => {
  const parsed = createContactQuerySchema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ApiError(400, issue?.message || "Invalid request body");
  }

  return parsed.data;
};

export const createContactQuery = asyncHandler(async (req, res) => {
  const payload = parseBody(req.body);

  const data = await createContactQueryService(payload, req.user?.id);

  res.status(201).json({
    message: "Contact request submitted successfully",
    data,
  });
});
