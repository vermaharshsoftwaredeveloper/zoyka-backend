import { asyncHandler } from "../../utils/async-handler/index.js";
import { getAllOutletsService, getOutletDetailService } from "./outlet.service.js";

export const getOutlets = asyncHandler(async (req, res) => {
  const { regionId, categoryId } = req.query;
  const outlets = await getAllOutletsService({ regionId, categoryId });

  res.status(200).json({
    message: "Outlets fetched successfully",
    data: outlets,
  });
});

export const getOutletDetail = asyncHandler(async (req, res) => {
  const outlet = await getOutletDetailService(req.params.id);
  res.status(200).json({
    message: "Outlet details fetched successfully",
    data: outlet,
  });
});
