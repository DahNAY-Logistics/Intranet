import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError } from 'better-auth/api';
import { genericOAuth } from 'better-auth/plugins/generic-oauth';

import { commonMessages, envMessages } from 'core/messages.ts';

import prisma from 'src/db.ts';
import { Role, UserStatus } from '../../generated/prisma/client.ts';
import { isAllowedEmailDomain } from './email-domain.ts';

const { CLIENT_URL, BETTER_AUTH_URL, BETTER_AUTH_SECRET, ZOHO_ACCOUNTS_URL, ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET } = process.env;

if (!CLIENT_URL) {
  throw new Error(envMessages.MISSING_CLIENT_URL);
}

if (!BETTER_AUTH_URL || !BETTER_AUTH_SECRET) {
  throw new Error(envMessages.MISSING_BETTER_AUTH_ENV);
}

if (!ZOHO_ACCOUNTS_URL || !ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET) {
  throw new Error(envMessages.MISSING_ZOHO_ENV);
}

export const auth = betterAuth({
  appName: 'Intranet',
  basePath: '/api/auth',

  baseURL: BETTER_AUTH_URL,
  secret: BETTER_AUTH_SECRET,

  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  trustedOrigins: [CLIENT_URL],

  rateLimit: {
    enabled: false,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },

  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: Role.User,
        input: false,
      },
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['zoho'],
      requireLocalEmailVerified: false,
      updateUserInfoOnLink: true,
    },
  },

  plugins: [
    genericOAuth({
      config: [
        {
          providerId: 'zoho',
          discoveryUrl: `${ZOHO_ACCOUNTS_URL}/.well-known/openid-configuration`,
          clientId: ZOHO_CLIENT_ID,
          clientSecret: ZOHO_CLIENT_SECRET,
          scopes: ['openid', 'email', 'profile', 'ZohoCalendar.calendar.READ', 'ZohoCalendar.event.CREATE'],
          pkce: true,
          disableSignUp: true,
        },
      ],
    }),
  ],

  databaseHooks: {
    user: {
      create: {
        before: () => {
          throw new APIError('FORBIDDEN', {
            message: commonMessages.FORBIDDEN,
          });
        },
      },
    },

    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { email: true, status: true },
          });

          if (!user || !isAllowedEmailDomain(user.email) || user.status === UserStatus.Inactive) {
            throw new APIError('FORBIDDEN', {
              message: commonMessages.FORBIDDEN,
            });
          }
        },
      },
    },
  },
});
