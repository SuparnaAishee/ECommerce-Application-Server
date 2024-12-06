import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { cartService } from "./cart.service";

const addToCart = catchAsync(async (req, res) => {
  const result = await cartService.addToCart(req.user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product added to cart  successfully",
    data: result,
  });
});
const getMyCartProducts = catchAsync(async (req, res) => {
  const result = await cartService.getMyCartProduct(req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Cart Product are retrieved  successfully",
    data: result,
  });
});
const deleteMyCartProducts = catchAsync(async (req, res) => {
  const { cartId } = req.params;
  const result = await cartService.deleteMyCartProduct(req.user, cartId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Cart Product is deleted  successfully",
    data: result,
  });
});
const updateCartProductQuantity = catchAsync(async (req, res) => {
  const result = await cartService.updateCartProductQuantity(
    req.user,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Cart Product is updated  successfully",
    data: result,
  });
});

export const cartController = {
  addToCart,
  getMyCartProducts,
  deleteMyCartProducts,
  updateCartProductQuantity,
};
