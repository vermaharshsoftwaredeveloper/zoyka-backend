import ApiError from "../../utils/api-error/index.js";
import { asyncHandler } from "../../utils/async-handler/index.js";
import { getMyProfileService, updateMyProfileService } from "./user-profile.service.js";
import { updateProfileSchema } from "./user-profile.validation.js";

const parseBody = (body) => {
  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ApiError(400, issue?.message || "Invalid request body");
  }

  if (!Object.keys(parsed.data).length) {
    throw new ApiError(400, "At least one profile field is required");
  }

  return parsed.data;
};

export const getMyProfile = asyncHandler(async (req, res) => {
  const data = await getMyProfileService(req.user.id);

  res.status(200).json({
    message: "Profile fetched successfully",
    data,
  });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const payload = parseBody(req.body);
  const data = await updateMyProfileService(req.user.id, payload);

  res.status(200).json({
    message: "Profile updated successfully",
    data,
  });
});
