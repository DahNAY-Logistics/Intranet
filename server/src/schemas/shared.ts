import { z } from 'zod';

export function idParamSchema(entityLabel: string) {
  return z.object({
    id: z.string(`${entityLabel} id must be a string`).trim().min(1, `${entityLabel} id is required`),
  });
}

export function numericIdParamSchema(entityLabel: string) {
  return z.object({
    id: z.coerce
      .number(`${entityLabel} id must be a number`)
      .int(`${entityLabel} id must be a number`)
      .positive(`${entityLabel} id must be a number`),
  });
}

export function commaSeparatedIdsSchema(entityLabel: string) {
  return z
    .string(`${entityLabel} must be a string`)
    .optional()
    .transform((value) => value?.split(',').map(Number))
    .refine((values) => (values ?? []).every(Number.isInteger), `${entityLabel} must be a number`);
}

export function commaSeparatedListSchema<T extends z.ZodType<unknown, string>>(entityLabel: string, itemSchema: T) {
  return z
    .string(`${entityLabel} must be a string`)
    .optional()
    .transform((value) => value?.split(',').map((item) => item.trim()))
    .pipe(z.array(itemSchema).optional());
}

export function sortOrderSchema(defaultOrder: 'asc' | 'desc') {
  return z
    .string('Sort order must be a string')
    .trim()
    .pipe(z.enum(['asc', 'desc'], 'Sort order must be asc or desc'))
    .default(defaultOrder);
}

export function sortBySchema<const T extends readonly [string, ...string[]]>(fields: T, defaultField: T[number]) {
  return z
    .string('Sort by must be a string')
    .trim()
    .pipe(z.enum(fields, 'Invalid sort field'))
    .default(defaultField);
}

export const searchQuerySchema = z
  .string('Search must be a string')
  .trim()
  .max(50, 'Search cannot exceed 50 characters')
  .optional();

export const monthQuerySchema = z
  .string('Month must be a string')
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format')
  .optional();

export const paginationQuerySchema = z.object({
  page: z.coerce
    .number('Page must be a number')
    .int('Page must be a whole number')
    .min(1, 'Page must be at least 1')
    .default(1),
  pageSize: z.coerce
    .number('Page size must be a number')
    .int('Page size must be a whole number')
    .min(1, 'Page size must be at least 1')
    .max(100, 'Page size cannot exceed 100')
    .default(10),
});

export const peopleQuerySchema = paginationQuerySchema.extend({
  search: searchQuerySchema,
  department: commaSeparatedIdsSchema('Department'),
  designation: commaSeparatedIdsSchema('Designation'),
  location: commaSeparatedIdsSchema('Location'),
});
