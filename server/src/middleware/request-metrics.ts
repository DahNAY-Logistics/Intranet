import type { RequestHandler } from 'express';

import Sentry from '../lib/sentry.ts';

export const requestMetrics: RequestHandler = (req, res, next) => {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;

    const attributes = {
      method: req.method,
      route: `${req.baseUrl}${req.route?.path ?? ''}` || 'unmatched',
      status: res.statusCode,
    };

    Sentry.metrics.distribution('http.server.duration', durationMs, { unit: 'millisecond', attributes });
    Sentry.metrics.count('http.server.request', 1, { attributes });
  });

  next();
};
