import { z } from 'zod';

import { paginationQuerySchema } from './shared.ts';

export const blogsListQuerySchema = paginationQuerySchema;

export const blogSlugParamSchema = z.object({
  slug: z.string('Slug must be a string').trim().min(1, 'Slug is required'),
});
