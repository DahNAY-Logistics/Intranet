import { z } from 'zod';

import { ResourceStatus } from '../generated/prisma/client.ts';
import {
  commaSeparatedIdsSchema,
  commaSeparatedListSchema,
  numericIdParamSchema,
  paginationQuerySchema,
  sortOrderSchema,
} from './shared.ts';

export const resourceIdParamSchema = numericIdParamSchema('Resource');

export const resourcesListQuerySchema = paginationQuerySchema.extend({
  categoryId: commaSeparatedIdsSchema('Category'),
  sortOrder: sortOrderSchema('desc'),
});

export const resourcesAdminListQuerySchema = resourcesListQuerySchema.extend({
  status: commaSeparatedListSchema('Status', z.enum(ResourceStatus, 'Status must be Published or Archived')),
});
