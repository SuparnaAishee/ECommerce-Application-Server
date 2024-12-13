"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parseRequest = (req, res, next) => {
    req.body = JSON.parse(req.body.data);
    next();
};
exports.default = parseRequest;
