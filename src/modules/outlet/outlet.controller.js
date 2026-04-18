import { asyncHandler } from "../../utils/async-handler/index.js";
import { getAllOutletsService } from "./outlet.service.js";

export const getOutlets = asyncHandler(async (req, res) => {
  const { regionId } = req.query;
  const outlets = await getAllOutletsService({ regionId });

  res.status(200).json({
    message: "Outlets fetched successfully",
    data: outlets,
  });
});
