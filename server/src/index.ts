import Sentry from './lib/sentry.ts';

import { toNodeHandler } from 'better-auth/node';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { environment } from 'core/constants.ts';
import { serverMessages } from 'core/messages.ts';

import { auth } from './lib/auth/auth.ts';
import { apiRateLimit, authRateLimit } from './middleware/rate-limit.ts';
import { requestMetrics } from './middleware/request-metrics.ts';
import apiRouter from './routes/index.ts';

const app = express();

if (process.env.NODE_ENV === environment.production) {
  app.set('trust proxy', 1);
}

app.use(requestMetrics);
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use('/api/auth', authRateLimit);

app.all('/api/auth/*splat', toNodeHandler(auth));

app.use('/api', apiRateLimit);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', apiRouter);

Sentry.setupExpressErrorHandler(app);

const port = process.env.PORT || 3000;

const server = app.listen(port, () => console.log(serverMessages.LISTENING(port)));

async function shutdown(signal: string) {
  console.log(serverMessages.SHUTTING_DOWN(signal));

  server.close();
  server.closeAllConnections();

  await Sentry.close(2000);
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
