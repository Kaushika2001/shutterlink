/**
 * Vercel serverless entry — all /api/* requests (see vercel.json rewrites).
 * Express app lives in shutterlink-backend (../backend).
 */
export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 60,
};

export { default } from 'shutterlink-backend/vercel';
