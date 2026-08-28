import { z } from 'zod';

import { dashboardRanges } from 'core/constants.ts';

export const dashboardMoodTrendQuerySchema = z.object({
  range: z
    .enum([dashboardRanges.weekly, dashboardRanges.monthly], 'Range must be weekly or monthly')
    .default(dashboardRanges.weekly),
});
