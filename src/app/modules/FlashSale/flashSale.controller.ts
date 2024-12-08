import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { flashSaleService } from "./flashSale.service";

const getAllFlashSale = catchAsync(async (req, res) => {
  const result = await flashSaleService.getAllFlashSale();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Flash sale are retrieved successfully",
    data: result,
  });
});

export const flashSaleController = {
  getAllFlashSale,
};
