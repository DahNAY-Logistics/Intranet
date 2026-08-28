import { Router } from 'express';
import type { Request, Response } from 'express';

import { dashboardMessages } from 'core/messages.ts';
import type { ErrorResponse, Serializable } from 'core/types/common.ts';
import type { DashboardStatsResponse, MoodTrendResponse } from 'core/types/dashboard.ts';

import { requireAuth } from '../middleware/require-auth.ts';
import { requireAdmin } from '../middleware/require-admin.ts';
import { validate } from '../lib/validate.ts';
import { getDashboardStats, getMoodTrend } from '../lib/dashboard.ts';
import { dashboardMoodTrendQuerySchema } from '../schemas/dashboard.ts';

const router = Router();

router.get('/stats', requireAuth, requireAdmin, async (_req: Request, res: Response<Serializable<DashboardStatsResponse> | ErrorResponse>) => {
  res.json(await getDashboardStats());
});

router.get('/mood-trend', requireAuth, requireAdmin, async (req: Request, res: Response<Serializable<MoodTrendResponse> | ErrorResponse>) => {
  const query = validate(dashboardMoodTrendQuerySchema, req.query, res);
  if (!query) return res.status(400).json({ error: dashboardMessages.INVALID_QUERY });

  res.json(await getMoodTrend(query.range));
});

export default router;
