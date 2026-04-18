import { asyncHandler } from "../../utils/async-handler/index.js";
import { getAllOutletsService } from "./outlet.service.js";

export const getOutlets = asyncHandler(async (req, res) => {
  const { regionId, categoryId } = req.query;
  const outlets = await getAllOutletsService({ regionId, categoryId });

  res.status(200).json({
    message: "Outlets fetched successfully",
    data: outlets,
  });
});
