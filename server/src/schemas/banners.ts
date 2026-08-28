import { z } from 'zod';

import { bannerStatuses } from 'core/constants.ts';

import { numericIdParamSchema } from './shared.ts';

export const bannerIdParamSchema = numericIdParamSchema('Banner');

export const bannersQuerySchema = z.object({
  status: z.enum([bannerStatuses.published, bannerStatuses.archived], 'Status must be Published or Archived'),
});

export const reorderBannersSchema = z.object({
  items: z
    .array(
      z.object({
        id: bannerIdParamSchema.shape.id,
        displayOrder: z.coerce
          .number('Display order must be a number')
          .int('Display order must be a whole number')
          .min(0, 'Display order must be at least 0'),
      }),
    )
    .min(1, 'At least one banner is required to reorder'),
});
