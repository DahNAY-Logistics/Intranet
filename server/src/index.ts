import Sentry from './lib/sentry.ts';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { toNodeHandler } from 'better-auth/node';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { environment } from 'core/constants.ts';
import { commonMessages, serverMessages } from 'core/messages.ts';

import prisma from './db.ts';
import { auth } from './lib/auth/auth.ts';
import { apiRateLimit, authRateLimit, sessionRateLimit } from './middleware/rate-limit.ts';
import { requestMetrics } from './middleware/request-metrics.ts';
import apiRouter from './routes/index.ts';

const isProduction = process.env.NODE_ENV === environment.production;

const clientDist = fileURLToPath(new URL('../../client/dist', import.meta.url));

const app = express();

if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(requestMetrics);
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(['/api/auth/sign-in', '/api/auth/oauth2'], authRateLimit);
app.use('/api/auth', sessionRateLimit);

app.all('/api/auth/*splat', toNodeHandler(auth));

app.use('/api', apiRateLimit);
app.use(express.json());

app.use('/api', apiRouter);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: commonMessages.NOT_FOUND });
});

if (isProduction) {
  app.use(express.static(clientDist));

  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

Sentry.setupExpressErrorHandler(app);

const port = process.env.PORT || 3000;

const server = app.listen(port, () => console.log(serverMessages.LISTENING(port)));

async function shutdown(signal: string) {
  console.log(serverMessages.SHUTTING_DOWN(signal));

  server.close();
  server.closeAllConnections();

  await prisma.$disconnect();
  await Sentry.close(2000);
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
