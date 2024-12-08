import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { productService } from "./product.service";
import { pick } from "../../../utils/pick";
import { productFilterableFields } from "./product.const";

const createProduct = catchAsync(async (req, res) => {
  const result = await productService.createProduct(
    req.user,
    req.files as Express.Multer.File[],
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product created successfully",
    data: result,
  });
});
const getAllProduct = catchAsync(async (req, res) => {
  const filterQuery = pick(req.query, productFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const { data, meta } = await productService.getAllProduct(
    filterQuery,
    options
    // req.user
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product are retrieved successfully",
    meta,
    data,
  });
});

const getMyProducts = catchAsync(async (req, res) => {
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const { data, meta } = await productService.getMyProducts(req.user, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product are retrieved successfully",
    data,
    meta,
  });
});

const getSingleProduct = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const result = await productService.getSingleProduct(productId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product is retrieved successfully",
    data: result,
  });
});
const updateSingleProduct = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const result = await productService.updateSingleProduct(
    productId,
    req.files as Express.Multer.File[],
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product is updated successfully",
    data: result,
  });
});
const deleteSingleProduct = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const result = await productService.deleteSingleProduct(productId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product is deleted successfully",
    data: result,
  });
});

export const productController = {
  createProduct,
  getAllProduct,
  getSingleProduct,
  updateSingleProduct,
  deleteSingleProduct,
  getMyProducts,
};
