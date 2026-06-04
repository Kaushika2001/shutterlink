/**
 * Vercel serverless entry (backend-only project).
 * Requires `npm run build` first (see vercel.json buildCommand).
 */
import serverless from 'serverless-http';

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 60,
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const app = require('../dist/app').default;

export default serverless(app);
