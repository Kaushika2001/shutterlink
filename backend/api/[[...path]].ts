/**
 * Express API catch-all: /api, /api/auth/login, etc.
 * No vercel.json rewrites — /api/health uses api/health.ts instead.
 */
import type { Express } from 'express';
import type { IncomingMessage, ServerResponse } from 'http';
import serverless from 'serverless-http';

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 10,
};

type ServerlessHandler = (
  req: IncomingMessage,
  res: ServerResponse
) => Promise<unknown>;

let cached: ServerlessHandler | null = null;

async function getHandler(): Promise<ServerlessHandler> {
  if (cached) return cached;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const getApp = require('../dist/app').default as () => Express;
  cached = serverless(getApp()) as ServerlessHandler;
  return cached;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<unknown> {
  const fn = await getHandler();
  return fn(req, res);
}
