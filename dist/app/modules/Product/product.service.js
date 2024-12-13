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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productService = void 0;
const prisma_1 = __importDefault(require("../../helpers/prisma"));
const AppError_1 = require("../../errors/AppError");
const http_status_1 = __importDefault(require("http-status"));
const fileUploader_1 = require("../../../utils/fileUploader");
const paginationHelper_1 = require("../../helpers/paginationHelper");
const product_const_1 = require("./product.const");
const createProduct = (user, files, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = yield prisma_1.default.user.findUnique({
        where: {
            email: user === null || user === void 0 ? void 0 : user.email,
        },
    });
    if (!userData) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "User is not found");
    }
    const category = yield prisma_1.default.category.findUnique({
        where: {
            id: payload.categoryId,
        },
    });
    if (!category) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "Category is not found");
    }
    const shop = yield prisma_1.default.shop.findUnique({
        where: {
            userId: userData === null || userData === void 0 ? void 0 : userData.id,
        },
    });
    if (!shop) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "Shop is not found");
    }
    if ((shop === null || shop === void 0 ? void 0 : shop.status) === "BLOCKED") {
        throw new AppError_1.AppError(http_status_1.default.FORBIDDEN, "Your shop is been blocked by admin");
    }
    payload.shopId = shop.id;
    if ((files === null || files === void 0 ? void 0 : files.length) > 0) {
        const imageUrls = yield fileUploader_1.fileUploader.uploadMultipleToCloudinary(files);
        payload.images = imageUrls;
    }
    const result = yield prisma_1.default.product.create({
        data: payload,
    });
    return result;
});
const getAllProduct = (query, options) => __awaiter(void 0, void 0, void 0, function* () {
    const { limit, skip, sortBy, sortOrder, page } = paginationHelper_1.paginationHelper.calculatePagination(options);
    const { searchTerm, category } = query, restQueries = __rest(query, ["searchTerm", "category"]);
    const andCondition = [];
    andCondition.push({
        isFlashSale: false,
    });
    if (searchTerm == "recentViewedProduct") {
        const data = yield prisma_1.default.product.findMany({
            where: {
                view: {
                    gt: 0,
                },
            },
            orderBy: {
                view: "desc",
            },
            take: 10,
            include: {
                category: true,
                shop: true,
                reviews: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        const total = yield prisma_1.default.product.count({
            take: 10,
        });
        return {
            meta: {
                total,
                page,
                limit,
            },
            data,
        };
    }
    if (searchTerm) {
        andCondition.push({
            OR: product_const_1.productSearchableFields === null || product_const_1.productSearchableFields === void 0 ? void 0 : product_const_1.productSearchableFields.map((field) => ({
                [field]: {
                    contains: searchTerm,
                    mode: "insensitive",
                },
            })),
        });
    }
    if (category) {
        andCondition.push({
            category: {
                name: {
                    contains: category,
                },
            },
        });
    }
    if (Object.keys(restQueries).length > 0) {
        andCondition.push({
            AND: Object.keys(restQueries).map((key) => ({
                [key]: {
                    equals: restQueries[key],
                },
            })),
        });
    }
    const whereCondition = { AND: andCondition };
    const data = yield prisma_1.default.product.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: sortBy && sortOrder
            ? {
                [sortBy]: sortOrder,
            }
            : {
                createdAt: "desc",
            },
        include: {
            category: true,
            shop: true,
            reviews: {
                include: {
                    user: true,
                },
            },
        },
    });
    const total = yield prisma_1.default.product.count({
        where: whereCondition,
    });
    return {
        meta: {
            total,
            page,
            limit,
        },
        data,
    };
});
// const getAllProduct = async (
//   query: IProductQuery,
//   options: any,
//   user?: IUser // Optional user parameter
// ) => {
//   const { limit, skip, sortBy, sortOrder, page } =
//     paginationHelper.calculatePagination(options);
//   const { searchTerm, category, ...restQueries } = query;
//   const andCondition: Prisma.ProductWhereInput[] = [];
//   andCondition.push({
//     isFlashSale: false,
//   });
//   // Fetch the list of shops followed by the user (only if user exists)
//   let followedShopIds: string[] = [];
//   if (user) {
//     const followedShops = await prisma.userShopFollow.findMany({
//       where: { userId: user.id },
//       select: { shopId: true },
//     });
//     followedShopIds = followedShops.map((shop) => shop.shopId);
//   }
//   // Base query condition
//   if (searchTerm) {
//     andCondition.push({
//       OR: productSearchableFields?.map((field) => ({
//         [field]: {
//           contains: searchTerm,
//           mode: "insensitive",
//         },
//       })),
//     });
//   }
//   if (category) {
//     andCondition.push({
//       category: {
//         name: {
//           contains: category,
//         },
//       },
//     });
//   }
//   if (Object.keys(restQueries).length > 0) {
//     andCondition.push({
//       AND: Object.keys(restQueries).map((key) => ({
//         [key]: {
//           equals: (restQueries as any)[key],
//         },
//       })),
//     });
//   }
//   const whereCondition: Prisma.ProductWhereInput = { AND: andCondition };
//   // Fetch products based on whether the user is logged in
//   let data: any[] = [];
//   let total = 0;
//   if (user && followedShopIds.length > 0) {
//     // Fetch products from followed shops
//     const followedShopProducts = await prisma.product.findMany({
//       where: {
//         ...whereCondition,
//         shopId: { in: followedShopIds },
//       },
//       orderBy:
//         sortBy && sortOrder ? { [sortBy]: sortOrder } : { createdAt: "desc" },
//       include: {
//         category: true,
//         shop: true,
//         reviews: {
//           include: {
//             user: true,
//           },
//         },
//       },
//     });
//     // Fetch remaining products
//     const otherProducts = await prisma.product.findMany({
//       where: {
//         ...whereCondition,
//         shopId: { notIn: followedShopIds },
//       },
//       orderBy:
//         sortBy && sortOrder ? { [sortBy]: sortOrder } : { createdAt: "desc" },
//       include: {
//         category: true,
//         shop: true,
//         reviews: {
//           include: {
//             user: true,
//           },
//         },
//       },
//     });
//     // Combine results prioritizing followed shop products
//     data = [...followedShopProducts, ...otherProducts];
//     // Apply pagination
//     data = data.slice(skip, skip + limit);
//     total = followedShopProducts.length + otherProducts.length;
//   } else {
//     // User is not logged in, fetch products without follow logic
//     data = await prisma.product.findMany({
//       where: whereCondition,
//       skip,
//       take: limit,
//       orderBy:
//         sortBy && sortOrder ? { [sortBy]: sortOrder } : { createdAt: "desc" },
//       include: {
//         category: true,
//         shop: true,
//         reviews: {
//           include: {
//             user: true,
//           },
//         },
//       },
//     });
//     total = await prisma.product.count({ where: whereCondition });
//   }
//   return {
//     meta: {
//       total,
//       page,
//       limit,
//     },
//     data,
//   };
// };
const getMyProducts = (user, options) => __awaiter(void 0, void 0, void 0, function* () {
    const { limit, skip, sortBy, sortOrder, page } = paginationHelper_1.paginationHelper.calculatePagination(options);
    const userData = yield prisma_1.default.user.findUnique({
        where: {
            email: user.email,
        },
    });
    if (!userData) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "User is not found");
    }
    const shop = yield prisma_1.default.shop.findUnique({
        where: {
            userId: userData === null || userData === void 0 ? void 0 : userData.id,
        },
    });
    if (!shop) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "Shop is not found");
    }
    const product = yield prisma_1.default.product.findMany({
        where: {
            shopId: shop.id,
        },
        skip,
        take: limit,
        orderBy: sortBy && sortOrder
            ? {
                [sortBy]: sortOrder,
            }
            : {
                createdAt: "desc",
            },
        include: {
            category: true,
            shop: true,
            reviews: {
                include: {
                    user: true,
                },
            },
        },
    });
    const total = yield prisma_1.default.product.count({
        where: {
            shopId: shop.id,
        },
    });
    return {
        meta: {
            total,
            page,
            limit,
        },
        data: product,
    };
});
const getSingleProduct = (id) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.default.product.update({
        where: {
            id,
        },
        data: {
            view: {
                increment: 1,
            },
        },
    });
    const product = yield prisma_1.default.product.findUnique({
        where: {
            id,
        },
        include: {
            category: true,
            shop: true,
            reviews: {
                include: {
                    user: true,
                },
            },
        },
    });
    if (!product) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "Product is not found");
    }
    return product;
});
const updateSingleProduct = (id, files, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield prisma_1.default.product.findUnique({
        where: {
            id: id,
        },
    });
    if (!product) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "Product is not found");
    }
    const shop = yield prisma_1.default.shop.findUnique({
        where: {
            id: product === null || product === void 0 ? void 0 : product.shopId,
        },
    });
    if ((shop === null || shop === void 0 ? void 0 : shop.status) === "BLOCKED") {
        throw new AppError_1.AppError(http_status_1.default.FORBIDDEN, "Your shop is been blocked by admin");
    }
    if ((files === null || files === void 0 ? void 0 : files.length) > 0) {
        const imageUrl = yield fileUploader_1.fileUploader.uploadMultipleToCloudinary(files);
        payload.images = imageUrl;
    }
    const result = yield prisma_1.default.product.update({
        where: {
            id,
        },
        data: payload,
    });
    return result;
});
const deleteSingleProduct = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield prisma_1.default.product.findUnique({
        where: {
            id: id,
        },
    });
    if (!product) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "Product is not found");
    }
    const result = yield prisma_1.default.product.delete({
        where: {
            id,
        },
    });
    return result;
});
exports.productService = {
    createProduct,
    getAllProduct,
    getSingleProduct,
    updateSingleProduct,
    deleteSingleProduct,
    getMyProducts,
};
