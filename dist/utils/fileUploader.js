"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileUploader = void 0;
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
const stream_1 = require("stream");
cloudinary_1.v2.config({
    cloud_name: "daar91zv4",
    api_key: "573799455418682",
    api_secret: "gzo1SMIvFxeau3-bPvE-RQDxVQQ",
});
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
const uploadMultiple = (0, multer_1.default)({ storage }).array("files", 10);
const uploadToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const filename = `${file.originalname.split(".")[0]}-${Date.now()}`;
        const stream = cloudinary_1.v2.uploader.upload_stream({ public_id: filename }, (error, result) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(result);
            }
        });
        const readableStream = new stream_1.Readable();
        readableStream.push(file.buffer);
        readableStream.push(null);
        readableStream.pipe(stream);
    });
};
const uploadMultipleToCloudinary = (files) => {
    const fileArray = Array.isArray(files) ? files : [files];
    const uploadPromises = fileArray.map((file) => new Promise((resolve, reject) => {
        const filename = `${file.originalname.split(".")[0]}-${Date.now()}`;
        const stream = cloudinary_1.v2.uploader.upload_stream({ public_id: filename }, (error, result) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(result.secure_url);
            }
        });
        const readableStream = new stream_1.Readable();
        readableStream.push(file.buffer);
        readableStream.push(null);
        readableStream.pipe(stream);
    }));
    return Promise.all(uploadPromises);
};
exports.fileUploader = {
    upload,
    uploadMultiple,
    uploadToCloudinary,
    uploadMultipleToCloudinary,
};
