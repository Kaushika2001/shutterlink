import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ValidationError } from "../utils/errors";

export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError ) {
        const details = error.errors.map((err: any) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        return next(new ValidationError("Validation failed", { errors: details }));
      }
      return next(error);
    }
  };
};