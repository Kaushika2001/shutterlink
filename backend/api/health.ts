/**
 * Lightweight /api/health — no Express (must not be rewritten to [[...path]]).
 */
export const config = {
  maxDuration: 5,
};

export default function handler(
  _req: unknown,
  res: {
    status: (code: number) => { json: (body: object) => void };
    setHeader?: (k: string, v: string) => void;
  }
) {
  res.status(200).json({
    status: 'OK',
    runtime: 'vercel-health-lite',
    timestamp: new Date().toISOString(),
    backend: 'shutterlink-two',
  });
}
