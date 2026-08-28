import { z } from 'zod';

import { AnnouncementStatus } from '../generated/prisma/client.ts';
import {
  commaSeparatedIdsSchema,
  commaSeparatedListSchema,
  monthQuerySchema,
  numericIdParamSchema,
  paginationQuerySchema,
  sortOrderSchema,
} from './shared.ts';

export const announcementIdParamSchema = numericIdParamSchema('Announcement');

export const announcementsListQuerySchema = paginationQuerySchema.extend({
  categoryId: commaSeparatedIdsSchema('Category'),
  month: monthQuerySchema,
  sortOrder: sortOrderSchema('desc'),
});

export const announcementsAdminListQuerySchema = announcementsListQuerySchema.extend({
  status: commaSeparatedListSchema('Status', z.enum(AnnouncementStatus, 'Status must be Published or Archived')),
});
