import { z } from 'zod'

export const createCategorySchema = z.object({
  name: z
    .string('Name must be a string')
    .trim()
    .min(1, 'Name is required')
    .max(50, 'Name cannot exceed 50 characters'),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>

export const updateCategorySchema = createCategorySchema

export const categoryResponseSchema = createCategorySchema.extend({
  id: z.number(),
  createdAt: z.string(),
  count: z.number(),
})

export type CategoryListItem = z.infer<typeof categoryResponseSchema>
