import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { statsService } from "./stats.service";

const adminStats = catchAsync(async (_req, res) => {
  const result = await statsService.getAdminStats();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin stats retrieved",
    data: result,
  });
});

const vendorStats = catchAsync(async (req, res) => {
  const result = await statsService.getVendorStats(req.user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vendor stats retrieved",
    data: result,
  });
});

export const statsController = {
  adminStats,
  vendorStats,
};
