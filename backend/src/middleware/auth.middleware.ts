import { Request, Response, NextFunction } from "express";
import { verifyToken, JWTPayload } from "../utils/jwt";
import { AuthenticationError } from "../utils/errors";
import { supabaseAdmin } from "../config/supabase";

export interface AuthRequest extends Request {
  user?: JWTPayload;
  userId?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new AuthenticationError('No authorization token provided');
    }

    const payload = verifyToken(token);
    req.userId = payload.userId;

    // Use live role from DB so admin promotion in Supabase works without re-login
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role, email')
      .eq('id', payload.userId)
      .maybeSingle();

    req.user = {
      userId: payload.userId,
      email: user?.email ?? payload.email,
      role: user?.role ?? payload.role,
    };

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(401).json({ success: false, error: error.message });
      return;
    }
    res.status(401).json({ success: false, error: 'Invalid token' });
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
