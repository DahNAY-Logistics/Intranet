import { z } from 'zod'

import { resourceStatuses } from '../constants.ts'

export const createResourceSchema = z.object({
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
  content: z
    .string('Content must be a string')
    .trim()
    .min(1, 'Content is required')
    .max(20000, 'Content cannot exceed 20000 characters'),
  url: z
    .string('URL must be a string')
    .trim()
    .max(2048, 'URL cannot exceed 2048 characters')
    .optional()
    .transform((value) => (value === '' ? undefined : value))
    .pipe(z.url('Enter a valid URL').optional()),
  categoryId: z.coerce.number('Category is required').int('Category is required').positive('Category is required'),
  status: z.enum([resourceStatuses.published, resourceStatuses.archived], 'Status is required'),
})

export type CreateResourceInput = z.infer<typeof createResourceSchema>

export const updateResourceSchema = createResourceSchema
