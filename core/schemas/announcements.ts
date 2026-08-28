import { z } from 'zod'

import { announcementStatuses } from '../constants.ts'

export const createAnnouncementSchema = z.object({
  title: z
    .string('Title must be a string')
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters'),
  excerpt: z
    .string('Excerpt must be a string')
    .trim()
    .min(1, 'Excerpt is required')
    .max(5000, 'Excerpt cannot exceed 5000 characters'),
  categoryId: z.coerce.number('Category is required').int('Category is required').positive('Category is required'),
  status: z.enum([announcementStatuses.published, announcementStatuses.archived], 'Status is required'),
})

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>

export const updateAnnouncementSchema = createAnnouncementSchema
