import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next({
        status: 422,
        message: "Validation failed",
        issues: result.error.flatten()
      });
    }
    req.body = result.data;
    return next();
  };
}
