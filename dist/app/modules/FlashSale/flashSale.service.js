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
exports.flashSaleService = void 0;
const prisma_1 = __importDefault(require("../../helpers/prisma"));
const getAllFlashSale = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date().toISOString();
    return yield prisma_1.default.product.findMany({
        where: {
            isFlashSale: true,
            discount_percentage: {
                not: null,
            },
            sale_start_time: {
                lte: now,
            },
            sale_end_time: {
                gt: now,
            },
        },
        include: {
            cart: true,
            category: true,
            order: true,
            reviews: true,
            shop: true,
        },
    });
});
exports.flashSaleService = {
    getAllFlashSale,
};
