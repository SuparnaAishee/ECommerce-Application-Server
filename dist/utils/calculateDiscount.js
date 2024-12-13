"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDiscount = void 0;
const calculateDiscount = (price, discount) => {
    return price * (1 - discount / 100);
};
exports.calculateDiscount = calculateDiscount;
