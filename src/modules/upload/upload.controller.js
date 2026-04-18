import { asyncHandler } from "../../utils/async-handler/index.js";
import { uploadImageToSupabase } from "../../config/supabase.js";
import ApiError from "../../utils/api-error/index.js";

export const uploadFile = asyncHandler(async (req, res) => {
    // 1. Check if file exists
    if (!req.file) {
        throw new ApiError(400, "No file provided for upload");
    }

    // 2. Allow frontend to specify a folder (e.g., ?folder=products or ?folder=avatars)
    const folder = req.query.folder || "general";

    // 3. Upload to Supabase
    const fileUrl = await uploadImageToSupabase(req.file, folder);

    // 4. Return the public URL
    res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        data: {
            url: fileUrl
        }
    });
});