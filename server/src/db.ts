import { PrismaPg } from '@prisma/adapter-pg';

import { envMessages } from 'core/messages.ts';

import { PrismaClient } from './generated/prisma/client.ts';

if (!process.env.DATABASE_URL) {
  throw new Error(envMessages.MISSING_DATABASE_URL);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export default prisma;