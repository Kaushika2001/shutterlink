import { CorsOptions } from 'cors';
import { getCorsOriginList } from '../config/env';

const allowedOrigins = getCorsOriginList();

export const corsConfig: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    if (
      process.env.ALLOW_VERCEL_PREVIEW_ORIGINS === 'true' &&
      /\.vercel\.app$/i.test(origin)
    ) {
      callback(null, true);
      return;
    }
    if (process.env.NODE_ENV !== 'production') {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
};
