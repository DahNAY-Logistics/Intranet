import type { RequestHandler } from 'express';

import { rateLimit } from 'express-rate-limit';

import { commonMessages } from 'core/messages.ts';
import { environment } from 'core/constants.ts';

const isProduction = process.env.NODE_ENV === environment.production;

const passThrough: RequestHandler = (_req, _res, next) => {
  next();
};

function createLimiter(windowMs: number, limit: number): RequestHandler {
  if (!isProduction) {
    return passThrough;
  }

  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: commonMessages.TOO_MANY_REQUESTS },
  });
}

export const authRateLimit = createLimiter(15 * 60 * 1000, 10);

export const apiRateLimit = createLimiter(15 * 60 * 1000, 100);
