import type { NextFunction, Request, Response } from "express";

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next({ status: 404, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error: any, _req: Request, res: Response, _next: NextFunction) {
  const status = Number(error.status) || 500;
  res.status(status).json({
    success: false,
    message: error.message || "Internal server error",
    issues: error.issues
  });
}
