import type { NextFunction, Request, Response } from "express";

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next({ status: 404, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function isDatabaseConnectionError(error: any) {
  const message = String(error?.message ?? "");
  const code = String(error?.code ?? "");

  return (
    code === "ENOTFOUND" ||
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT" ||
    message.includes("getaddrinfo ENOTFOUND") ||
    message.includes("Can't reach database server") ||
    message.includes("Timed out fetching a new connection")
  );
}

export function errorHandler(error: any, _req: Request, res: Response, _next: NextFunction) {
  const databaseUnavailable = isDatabaseConnectionError(error);
  const status = databaseUnavailable ? 503 : Number(error.status) || 500;
  res.status(status).json({
    success: false,
    message: databaseUnavailable ? "Database connection is temporarily unavailable. Please try again." : error.message || "Internal server error",
    issues: error.issues
  });
}
