import { z } from 'zod';

import { EventMode, EventStatus } from '../generated/prisma/client.ts';
import {
  commaSeparatedIdsSchema,
  commaSeparatedListSchema,
  monthQuerySchema,
  numericIdParamSchema,
  paginationQuerySchema,
  sortOrderSchema,
} from './shared.ts';

export const eventIdParamSchema = numericIdParamSchema('Event');

export const eventsListQuerySchema = paginationQuerySchema.extend({
  categoryId: commaSeparatedIdsSchema('Category'),
  mode: commaSeparatedListSchema('Mode', z.enum(EventMode, 'Mode must be Online, Offline, or Hybrid')),
  month: monthQuerySchema,
  sortOrder: sortOrderSchema('desc'),
});

export const eventsAdminListQuerySchema = eventsListQuerySchema.extend({
  status: commaSeparatedListSchema('Status', z.enum(EventStatus, 'Status must be Published or Archived')),
});
