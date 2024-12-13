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
exports.userShopFollow = void 0;
const prisma_1 = __importDefault(require("../../helpers/prisma"));
const createShopFollowUser = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const isAlreadyFollowed = yield prisma_1.default.userShopFollow.findUnique({
        where: {
            userId_shopId: {
                userId: user === null || user === void 0 ? void 0 : user.id,
                shopId: payload.shopId,
            },
        },
    });
    if (isAlreadyFollowed) {
        const result = yield prisma_1.default.userShopFollow.delete({
            where: {
                userId_shopId: {
                    userId: user === null || user === void 0 ? void 0 : user.id,
                    shopId: payload.shopId,
                },
            },
        });
        return { result, message: "Unfollow the shop successfully" };
    }
    payload.userId = user === null || user === void 0 ? void 0 : user.id;
    const result = yield prisma_1.default.userShopFollow.create({
        data: payload,
    });
    return { result, message: "Follow the shop successfully" };
});
const getAllMyFollowingShop = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const followingShop = yield prisma_1.default.userShopFollow.findMany({
        where: {
            userId: user === null || user === void 0 ? void 0 : user.id,
        },
    });
    return followingShop;
});
const getSingleMyFollowingShop = (user, id) => __awaiter(void 0, void 0, void 0, function* () {
    const followingShop = yield prisma_1.default.userShopFollow.findUnique({
        where: {
            userId_shopId: {
                userId: user === null || user === void 0 ? void 0 : user.id,
                shopId: id,
            },
        },
    });
    return followingShop;
});
exports.userShopFollow = {
    createShopFollowUser,
    getAllMyFollowingShop,
    getSingleMyFollowingShop,
};
