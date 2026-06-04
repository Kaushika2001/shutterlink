/** Instant health — no Express, no imports (Vercel deployment check + monitoring). */
module.exports = (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).end(
    JSON.stringify({
      status: 'OK',
      runtime: 'health-js',
      timestamp: new Date().toISOString(),
    })
  );
};
