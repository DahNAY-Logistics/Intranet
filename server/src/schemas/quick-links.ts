import { z } from 'zod';

import { QuickLinkStatus } from '../generated/prisma/client.ts';
import {
  commaSeparatedIdsSchema,
  commaSeparatedListSchema,
  numericIdParamSchema,
  paginationQuerySchema,
  sortOrderSchema,
} from './shared.ts';

export const quickLinkIdParamSchema = numericIdParamSchema('Quick link');

export const quickLinksListQuerySchema = paginationQuerySchema.extend({
  categoryId: commaSeparatedIdsSchema('Category'),
  sortOrder: sortOrderSchema('desc'),
});

export const quickLinksAdminListQuerySchema = quickLinksListQuerySchema.extend({
  status: commaSeparatedListSchema('Status', z.enum(QuickLinkStatus, 'Status must be Published or Archived')),
});
