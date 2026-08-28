import { z } from 'zod';
import type { ZodType } from 'zod';

import { userMessages } from 'core/messages.ts';
import { createUserSchema, updateUserSchema } from 'core/schemas/users.ts';

import { Role, UserStatus } from '../generated/prisma/client.ts';
import { isAllowedEmailDomain } from '../lib/auth/email-domain.ts';
import { commaSeparatedListSchema, idParamSchema, peopleQuerySchema, sortBySchema, sortOrderSchema } from './shared.ts';

function withAllowedEmailDomain<T extends { email: string }>(schema: ZodType<T>) {
  return schema.refine((data) => isAllowedEmailDomain(data.email), {
    message: userMessages.EMAIL_DOMAIN_NOT_ALLOWED,
    path: ['email'],
  });
}

export const usersQuerySchema = peopleQuerySchema.extend({
  sortBy: sortBySchema(['employeeId', 'joinedDate'], 'employeeId'),

  sortOrder: sortOrderSchema('desc'),

  status: z
    .string('Status must be a string')
    .trim()
    .pipe(z.enum([UserStatus.Active, UserStatus.Inactive], 'Status must be Active or Inactive'))
    .default(UserStatus.Active),

  role: commaSeparatedListSchema('Role', z.enum([Role.User, Role.Admin], 'Role must be either User or Admin')),
});

export const usersCreateSchema = withAllowedEmailDomain(createUserSchema);

export const usersUpdateSchema = withAllowedEmailDomain(updateUserSchema);

export const userIdParamSchema = idParamSchema('User');

export const usersStatusUpdateSchema = z.object({
  ids: z.array(userIdParamSchema.shape.id).min(1, 'Select at least one user to update'),
});

export const usersLookupQuerySchema = z.object({
  excludeId: z
    .string('Exclude id must be a string')
    .trim()
    .min(1, 'Exclude id is required')
    .optional(),
});
