import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { wishlistService } from "./wishlist.service";

const addToWishlist = catchAsync(async (req, res) => {
  const { productId } = req.body;
  const result = await wishlistService.addToWishlist(req.user, productId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Product added to wishlist",
    data: result,
  });
});

const getWishlist = catchAsync(async (req, res) => {
  const result = await wishlistService.getWishlistByUser(req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Wishlist retrieved successfully",
    data: result,
  });
});

const removeFromWishlist = catchAsync(async (req, res) => {
  const { productId } = req.params;
  await wishlistService.removeFromWishlist(req.user, productId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product removed from wishlist",
    data: null,
  });
});

export const wishlistController = {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
};
