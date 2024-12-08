import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { categoryService } from "./category.service";
import { pick } from "../../../utils/pick";

const createCategory = catchAsync(async (req, res) => {
  const result = await categoryService.createCategory(
    req.file as Express.Multer.File,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category created successfully",
    data: result,
  });
});
const getAllCategories = catchAsync(async (req, res) => {
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const { data, meta } = await categoryService.getAllCategories(options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Categories are retrieved successfully",
    data: data,
    meta,
  });
});
const getSingleCategory = catchAsync(async (req, res) => {
  const { categoryId } = req.params;
  const result = await categoryService.getSingleCategory(categoryId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category is retrieved successfully",
    data: result,
  });
});
const updateSingleCategory = catchAsync(async (req, res) => {
  const { categoryId } = req.params;
  const result = await categoryService.updateSingleCategory(
    categoryId,
    req.file as Express.Multer.File,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category is updated successfully",
    data: result,
  });
});
const deleteSingleCategory = catchAsync(async (req, res) => {
  const { categoryId } = req.params;
  const result = await categoryService.deleteSingleCategory(categoryId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category is deleted successfully",
    data: result,
  });
});

export const categoryController = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  deleteSingleCategory,
  updateSingleCategory,
};
