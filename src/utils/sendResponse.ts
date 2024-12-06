import { Response } from "express";

interface IResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
  data: T | null | undefined;
}

const sendResponse = <T>(res: Response, payload: IResponse<T>) => {
  res.status(payload.statusCode).json({
    success: payload.success,
    message: payload.message,
    meta: payload.meta || null || undefined,
    data: payload.data || null || undefined,
  });
};

export default sendResponse;
