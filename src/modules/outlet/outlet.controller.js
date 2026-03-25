import { asyncHandler } from "../../utils/async-handler/index.js";
import { getAllOutletsService } from "./outlet.service.js";

export const getOutlets = asyncHandler(async (req, res) => {
  const outlets = await getAllOutletsService();

  res.status(200).json({
    message: "Outlets fetched successfully",
    data: outlets,
  });
});
