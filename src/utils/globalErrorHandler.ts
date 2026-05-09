import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../app/errors/AppError";
import config from "../app/config";

type ErrorSource = { path: string; message: string };

type NormalizedError = {
  statusCode: number;
  message: string;
  errorSources: ErrorSource[];
};

const normalizeZodError = (error: ZodError): NormalizedError => ({
  statusCode: httpStatus.BAD_REQUEST,
  message: "Validation failed",
  errorSources: error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  })),
});

const normalizePrismaKnownError = (
  error: Prisma.PrismaClientKnownRequestError,
): NormalizedError => {
  switch (error.code) {
    case "P2002":
      return {
        statusCode: httpStatus.CONFLICT,
        message: "A record with the same unique value already exists",
        errorSources: [
          { path: String(error.meta?.target ?? ""), message: "Duplicate value" },
        ],
      };
    case "P2025":
      return {
        statusCode: httpStatus.NOT_FOUND,
        message: "The requested record was not found",
        errorSources: [{ path: "", message: error.message.split("\n").pop() ?? "" }],
      };
    default:
      return {
        statusCode: httpStatus.BAD_REQUEST,
        message: "Database request failed",
        errorSources: [{ path: error.code, message: "Prisma error" }],
      };
  }
};

const normalizeError = (error: unknown): NormalizedError => {
  if (error instanceof ZodError) return normalizeZodError(error);
  if (error instanceof Prisma.PrismaClientKnownRequestError)
    return normalizePrismaKnownError(error);
  if (error instanceof Prisma.PrismaClientValidationError)
    return {
      statusCode: httpStatus.BAD_REQUEST,
      message: "Invalid query input",
      errorSources: [{ path: "", message: "Prisma validation error" }],
    };
  if (error instanceof AppError)
    return {
      statusCode: error.statusCode,
      message: error.message,
      errorSources: [{ path: "", message: error.message }],
    };
  if (error instanceof Error)
    return {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: error.message || "Something went wrong",
      errorSources: [{ path: "", message: error.message }],
    };
  return {
    statusCode: httpStatus.INTERNAL_SERVER_ERROR,
    message: "Something went wrong",
    errorSources: [{ path: "", message: "Unknown error" }],
  };
};

const globalErrorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  // next param is required for Express to recognize this as an error handler
  _next: NextFunction,
) => {
  const { statusCode, message, errorSources } = normalizeError(error);

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    stack:
      config.node_env === "production"
        ? undefined
        : (error as Error)?.stack,
  });
};

export default globalErrorHandler;
