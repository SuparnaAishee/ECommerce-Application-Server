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
exports.paymentService = void 0;
const path_1 = require("path");
const payment_utils_1 = require("./payment.utils");
const fs_1 = require("fs");
const prisma_1 = __importDefault(require("../../helpers/prisma"));
const confirmationService = (transactionId, status) => __awaiter(void 0, void 0, void 0, function* () {
    let greeting;
    const order = yield prisma_1.default.order.findFirst({
        where: {
            transactionId,
        },
    });
    const paymentVerifyRes = yield (0, payment_utils_1.verifyPayment)(transactionId);
    if ((paymentVerifyRes === null || paymentVerifyRes === void 0 ? void 0 : paymentVerifyRes.pay_status) === "Successful") {
        yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            yield prisma_1.default.cart.deleteMany({
                where: {
                    userId: order === null || order === void 0 ? void 0 : order.userId,
                },
            });
            yield prisma_1.default.order.updateMany({
                where: {
                    transactionId,
                },
                data: {
                    isPaid: true,
                },
            });
        }));
    }
    const filePath = (0, path_1.join)(__dirname, "../paymentConfirmation/index.html");
    let template = (0, fs_1.readFileSync)(filePath, "utf-8");
    if (status === "success") {
        greeting = "Thank you for order!";
    }
    else {
        greeting = "Order failed try again";
    }
    template = template.replace("{{success}}", status);
    template = template.replace("{{greeting}}", greeting);
    template = template.replace("{{orderId}}", transactionId || "");
    return template;
});
exports.paymentService = {
    confirmationService,
};
