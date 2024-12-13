"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sendResponse = (res, payload) => {
    res.status(payload.statusCode).json({
        success: payload.success,
        message: payload.message,
        meta: payload.meta || null || undefined,
        data: payload.data || null || undefined,
    });
};
exports.default = sendResponse;
