"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryService = void 0;
const prisma_1 = __importDefault(require("../../helpers/prisma"));
const AppError_1 = require("../../errors/AppError");
const http_status_1 = __importDefault(require("http-status"));
const fileUploader_1 = require("../../../utils/fileUploader");
const paginationHelper_1 = require("../../helpers/paginationHelper");
const createCategory = (file, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const category = yield prisma_1.default.category.findUnique({
        where: {
            name: payload.name,
        },
    });
    if (category) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, "This category is already exist");
    }
    if (file) {
        const { secure_url } = yield fileUploader_1.fileUploader.uploadToCloudinary(file);
        payload.image = secure_url;
    }
    const result = yield prisma_1.default.category.create({
        data: payload,
    });
    return result;
});
const getAllCategories = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const { limit, page, skip } = paginationHelper_1.paginationHelper.calculatePagination(options);
    const result = yield prisma_1.default.category.findMany({
        skip,
        take: limit,
        orderBy: options.sortBy && options.sortOrder
            ? { [options.sortBy]: options.sortOrder }
            : { createdAt: "desc" },
        include: {
            products: true,
        },
    });
    const total = yield prisma_1.default.category.count();
    return {
        meta: {
            total,
            page,
            limit,
        },
        data: result,
    };
});
const getSingleCategory = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.category.findUnique({
        where: {
            id,
        },
        include: {
            products: true,
        },
    });
});
const updateSingleCategory = (id, file, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const category = yield prisma_1.default.category.findUnique({
        where: {
            id,
        },
    });
    if (!category) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "Category is not found!");
    }
    if (file) {
        const { secure_url } = yield fileUploader_1.fileUploader.uploadToCloudinary(file);
        payload.image = secure_url;
    }
    return yield prisma_1.default.category.update({
        where: {
            id,
        },
        data: payload,
    });
});
const deleteSingleCategory = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const category = yield prisma_1.default.category.findUnique({
        where: {
            id,
        },
    });
    if (!category) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "Category is not found!");
    }
    return yield prisma_1.default.category.delete({
        where: {
            id,
        },
    });
});
exports.categoryService = {
    createCategory,
    getAllCategories,
    getSingleCategory,
    updateSingleCategory,
    deleteSingleCategory,
};
