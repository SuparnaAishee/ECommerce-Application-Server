import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { comparisonService } from "./comparison.service";

const createComparison = catchAsync(async (req, res) => {
  const result = await comparisonService.createComparison(req.user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comparison product selected successfully",
    data: result,
  });
});
const getMyComparisonProduct = catchAsync(async (req, res) => {
  const result = await comparisonService.getMyComparisonProduct(req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comparison product retrieved successfully",
    data: result,
  });
});

const deleteComparison = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await comparisonService.deleteComparison(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comparison product deleted successfully",
    data: result,
  });
});

export const comparisonController = {
  createComparison,
  getMyComparisonProduct,
  deleteComparison,
};
