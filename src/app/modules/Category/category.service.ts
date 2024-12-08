import { Category } from "@prisma/client";
import prisma from "../../helpers/prisma";
import { AppError } from "../../errors/AppError";
import httpStatus from "http-status";
import { fileUploader } from "../../../utils/fileUploader";
import { IPaginationOptions } from "../../interfaces/pagination";
import { paginationHelper } from "../../helpers/paginationHelper";

const createCategory = async (file: Express.Multer.File, payload: Category) => {
  const category = await prisma.category.findUnique({
    where: {
      name: payload.name,
    },
  });
  if (category) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This category is already exist"
    );
  }
  if (file) {
    const { secure_url } = await fileUploader.uploadToCloudinary(file);
    payload.image = secure_url;
  }
  const result = await prisma.category.create({
    data: payload,
  });
  return result;
};
const getAllCategories = async (options: IPaginationOptions) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);
  const result = await prisma.category.findMany({
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
    include: {
      products: true,
    },
  });
  const total = await prisma.category.count();

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};
const getSingleCategory = async (id: string) => {
  return await prisma.category.findUnique({
    where: {
      id,
    },
    include: {
      products: true,
    },
  });
};
const updateSingleCategory = async (
  id: string,
  file: Express.Multer.File,
  payload: { name?: string; image?: string }
) => {
  const category = await prisma.category.findUnique({
    where: {
      id,
    },
  });

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category is not found!");
  }

  if (file) {
    const { secure_url } = await fileUploader.uploadToCloudinary(file);
    payload.image = secure_url;
  }
  return await prisma.category.update({
    where: {
      id,
    },
    data: payload,
  });
};

const deleteSingleCategory = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: {
      id,
    },
  });

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category is not found!");
  }
  return await prisma.category.delete({
    where: {
      id,
    },
  });
};

export const categoryService = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateSingleCategory,
  deleteSingleCategory,
};
