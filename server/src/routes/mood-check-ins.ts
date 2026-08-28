import { Router } from 'express';
import type { Request, Response } from 'express';

import { moodMessages } from 'core/messages.ts';
import { createMoodCheckInSchema } from 'core/schemas/mood-check-ins.ts';
import type { ErrorResponse, MessageResponse, Serializable } from 'core/types/common.ts';
import type { MoodCheckInStatusResponse } from 'core/types/mood-check-ins.ts';

import prisma from '../db.ts';
import { requireAuth } from '../middleware/require-auth.ts';
import { validate } from '../lib/validate.ts';

const router = Router();

function today(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

router.get('/status', requireAuth, async (req: Request, res: Response<Serializable<MoodCheckInStatusResponse> | ErrorResponse>) => {
  const checkIn = await prisma.moodCheckIn.findUnique({
    where: { userId_date: { userId: req.user.id, date: today() } },
  });

  res.json({ checkedIn: checkIn !== null });
});

router.post('/', requireAuth, async (req: Request, res: Response<MessageResponse | ErrorResponse>) => {
  const body = validate(createMoodCheckInSchema, req.body, res);
  if (!body) return;

  const date = today();

  const existing = await prisma.moodCheckIn.findUnique({
    where: { userId_date: { userId: req.user.id, date } },
  });
  if (existing) {
    return res.status(409).json({ error: moodMessages.ALREADY_CHECKED_IN });
  }

  await prisma.$transaction([
    prisma.moodCheckIn.create({ data: { userId: req.user.id, date } }),
    prisma.moodEntry.create({ data: { mood: body.mood, date } }),
  ]);

  res.status(201).json({ message: moodMessages.CHECKED_IN });
});

export default router;
