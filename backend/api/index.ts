/**
 * Vercel serverless entry (backend-only project).
 * All routes are under /api/* — see backend/vercel.json rewrites.
 */
export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 60,
};

export { default } from '../src/vercel';
