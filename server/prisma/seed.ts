import 'dotenv/config';

import { randomUUID } from 'node:crypto';

import { envMessages, seedMessages } from 'core/messages.ts';

import prisma from 'src/db.ts';
import { Role } from 'src/generated/prisma/client.ts';
import { isAllowedEmailDomain } from 'src/lib/auth/email-domain.ts';

async function seedAdmin() {
  const { SEED_ADMIN_EMAIL: email, SEED_ADMIN_NAME: name } = process.env;

  if (!email || !name) {
    throw new Error(envMessages.MISSING_SEED_ENV_VARIABLES);
  }

  if (!isAllowedEmailDomain(email)) {
    throw new Error(seedMessages.EMAIL_OUTSIDE_ALLOWED_DOMAIN);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(seedMessages.ADMIN_ALREADY_EXISTS(email));
    return existing;
  }

  const now = new Date();

  const admin = await prisma.user.create({
    data: {
      id: randomUUID(),
      name,
      email,
      emailVerified: false,
      role: Role.Admin,
      createdAt: now,
      updatedAt: now,
    },
  });

  console.log(seedMessages.ADMIN_CREATED(email));
  return admin;
}

try {
  await seedAdmin();
} catch (error) {
  console.error(seedMessages.ADMIN_CREATION_FAILED, error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
