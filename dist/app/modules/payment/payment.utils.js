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
exports.verifyPayment = exports.initiatePayment = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../../config"));
const initiatePayment = (paymentData) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield axios_1.default.post(config_1.default.payment_url, {
        signature_key: config_1.default.signature_key,
        store_id: config_1.default.store_id,
        tran_id: paymentData.transactionId,
        success_url: `${config_1.default === null || config_1.default === void 0 ? void 0 : config_1.default.server_base_url}/api/v1/payment/success?transactionId=${paymentData.transactionId}&status=success`,
        fail_url: `${config_1.default.server_base_url}/api/v1/payment/success?status=failed`,
        cancel_url: config_1.default.client_base_url,
        amount: paymentData.amount,
        currency: "BDT",
        desc: "Merchant Registration Payment",
        cus_name: paymentData.customerName,
        cus_email: paymentData.customerEmail,
        cus_add1: paymentData.customerAddress,
        cus_add2: "N/A",
        cus_city: "N/A",
        cus_state: "N/A",
        cus_postcode: "N/A",
        cus_country: "N/A",
        cus_phone: paymentData.customerPhone,
        type: "json",
    });
    return res === null || res === void 0 ? void 0 : res.data;
});
exports.initiatePayment = initiatePayment;
const verifyPayment = (transactionId) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield axios_1.default.get(config_1.default.payment_verify_url, {
        params: {
            store_id: config_1.default.store_id,
            signature_key: config_1.default.signature_key,
            type: "json",
            request_id: transactionId,
        },
    });
    return res.data;
});
exports.verifyPayment = verifyPayment;
