import { z } from 'zod';
import { ValidationError } from './errors';

export const validateSchema = <T>(schema: z.ZodSchema, data: unknown): T => {
  try {
    return schema.parse(data) as T;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new ValidationError(message, error.errors);
    }
    throw error;
  }
};

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const nameSchema = z.string().min(2, 'Name must be at least 2 characters');
export const phoneSchema = z.string().regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Invalid phone number').optional();
export const uuidSchema = z.string().uuid('Invalid UUID');
export const positiveNumberSchema = z.number().positive('Must be a positive number');
export const ratingsSchema = z.number().min(1).max(5, 'Rating must be between 1 and 5');
