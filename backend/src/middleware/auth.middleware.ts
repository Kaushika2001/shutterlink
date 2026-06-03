import { Request, Response, NextFunction } from "express";
import { verifyToken, JWTPayload } from "../utils/jwt";
import { AuthenticationError } from "../utils/errors";

export interface AuthRequest extends Request {
  user?: JWTPayload;
  userId?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new AuthenticationError('No authorization token provided');
    }

    const payload = verifyToken(token);
    req.user = payload;
    req.userId = payload.userId;
    next();
    return;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(401).json({ success: false, error: error.message });
      return;
    }
    res.status(401).json({ success: false, error: 'Invalid token' });
    return;
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }

    next();
    return;
  };
};
