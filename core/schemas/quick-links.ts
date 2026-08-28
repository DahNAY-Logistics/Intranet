import { z } from 'zod'

import { quickLinkStatuses } from '../constants.ts'

export const createQuickLinkSchema = z.object({
  title: z
    .string('Title must be a string')
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters'),
  excerpt: z
    .string('Excerpt must be a string')
    .trim()
    .min(1, 'Excerpt is required')
    .max(1000, 'Excerpt cannot exceed 1000 characters'),
  url: z
    .string('URL must be a string')
    .trim()
    .max(2048, 'URL cannot exceed 2048 characters')
    .pipe(z.url('Enter a valid URL')),
  categoryId: z.coerce.number('Category is required').int('Category is required').positive('Category is required'),
  status: z.enum([quickLinkStatuses.published, quickLinkStatuses.archived], 'Status is required'),
})

export type CreateQuickLinkInput = z.infer<typeof createQuickLinkSchema>

export const updateQuickLinkSchema = createQuickLinkSchema
