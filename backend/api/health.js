/** /api/health — zero dependencies, must not be rewritten to another handler */
module.exports = (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).end(
    JSON.stringify({
      status: 'OK',
      runtime: 'health-standalone',
      timestamp: new Date().toISOString(),
    })
  );
};

module.exports.config = { maxDuration: 5 };
