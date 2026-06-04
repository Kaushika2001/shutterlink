import serverless from 'serverless-http';
import app from './app';

/** Vercel serverless function settings (re-exported from frontend/api/index.ts) */
export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 60,
};

export default serverless(app);
