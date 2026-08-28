import 'dotenv/config';

import * as Sentry from '@sentry/node';

import { environment } from 'core/constants.ts';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || environment.development,
  tracesSampleRate: 1,
  enableLogs: true,
  enableMetrics: true,
  integrations: [Sentry.consoleLoggingIntegration()],
  disableInstrumentationWarnings: true,
  dataCollection: {
    userInfo: false,
    httpBodies: [],
  },
});

export default Sentry;
