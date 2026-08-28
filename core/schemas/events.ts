import { z } from 'zod'

import { eventModes, eventStatuses } from '../constants.ts'
import type { EventMode, EventStatus } from '../constants.ts'

export const createEventSchema = z
  .object({
    title: z
      .string('Title must be a string')
      .trim()
      .min(1, 'Title is required')
      .max(100, 'Title cannot exceed 100 characters'),

    excerpt: z
      .string('Excerpt must be a string')
      .trim()
      .min(1, 'Excerpt is required')
      .max(1000, 'Excerpt cannot exceed 1000 characters'),

    categoryId: z.coerce
      .number('Category is required')
      .int('Category is required')
      .positive('Category is required')
      .optional(),

    status: z.enum([eventStatuses.published, eventStatuses.archived], 'Status is required').optional(),

    mode: z.enum([eventModes.online, eventModes.offline, eventModes.hybrid], 'Mode is required').optional(),

    location: z
      .string('Location must be a string')
      .trim()
      .max(200, 'Location cannot exceed 200 characters')
      .default(''),

    startDate: z.coerce.date('Start date must be a valid date').optional(),
    endDate: z.coerce.date('End date must be a valid date').optional(),
  })
  .superRefine((data, ctx) => {
    if (data.categoryId === undefined) {
      ctx.addIssue({ code: 'custom', message: 'Category is required', path: ['categoryId'] })
    }

    if (data.status === undefined) {
      ctx.addIssue({ code: 'custom', message: 'Status is required', path: ['status'] })
    }

    if (data.mode === undefined) {
      ctx.addIssue({ code: 'custom', message: 'Mode is required', path: ['mode'] })
    } else if (data.mode !== eventModes.online && data.location.length === 0) {
      ctx.addIssue({ code: 'custom', message: 'Location is required', path: ['location'] })
    }

    if (data.startDate === undefined) {
      ctx.addIssue({ code: 'custom', message: 'Start date must be a valid date', path: ['startDate'] })
    }

    if (data.endDate === undefined) {
      ctx.addIssue({ code: 'custom', message: 'End date must be a valid date', path: ['endDate'] })
    }

    if (data.startDate !== undefined && data.endDate !== undefined && data.endDate < data.startDate) {
      ctx.addIssue({ code: 'custom', message: 'End date must be on or after the start date', path: ['endDate'] })
    }
  })
  .transform(
    (data) =>
      data as typeof data & {
        categoryId: number
        status: EventStatus
        mode: EventMode
        startDate: Date
        endDate: Date
      },
  )

export type CreateEventInput = z.infer<typeof createEventSchema>

export const updateEventSchema = createEventSchema
