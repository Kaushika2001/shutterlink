import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import config from '../config/env';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (payload: JWTPayload, expiresIn: SignOptions['expiresIn'] = '24h'): string => {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn });
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, config.JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};
