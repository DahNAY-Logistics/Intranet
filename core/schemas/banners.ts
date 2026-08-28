import { z } from 'zod'

import { bannerStatuses } from '../constants.ts'

export const createBannerSchema = z
  .object({
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
    categoryId: z.coerce.number('Category is required').int('Category is required').positive('Category is required'),
    attachmentId: z.coerce
      .number('Banner image is required')
      .int('Banner image is required')
      .positive('Banner image is required'),
    status: z.enum([bannerStatuses.published, bannerStatuses.archived], 'Status is required'),
    startDate: z.coerce.date('Start date must be a valid date'),
    endDate: z.coerce.date('End date must be a valid date'),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be on or after the start date',
    path: ['endDate'],
  })

export type CreateBannerInput = z.infer<typeof createBannerSchema>

export const updateBannerSchema = createBannerSchema
