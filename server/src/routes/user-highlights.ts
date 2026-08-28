import { Router } from 'express';
import type { Request, Response } from 'express';

import type { ErrorResponse, Serializable } from 'core/types/common.ts';
import type { BirthdaysResponse, RecentlyJoinedResponse } from 'core/types/user-highlights.ts';

import prisma from '../db.ts';
import { UserStatus } from '../generated/prisma/client.ts';
import { requireAuth } from 'src/middleware/require-auth.ts';

const RECENTLY_JOINED_SCAN_LIMIT = 50;

const router = Router();

router.get('/birthdays', requireAuth, async (_req: Request, res: Response<Serializable<BirthdaysResponse> | ErrorResponse>) => {
  const currentMonth = new Date().getUTCMonth();

  const users = await prisma.user.findMany({
    where: { status: UserStatus.Active, dob: { not: null } },
    select: { id: true, name: true, dob: true, department: { select: { id: true, name: true } } },
  });

  const birthdays = users
    .filter((user) => user.dob !== null && user.dob.getUTCMonth() === currentMonth)
    .map((user) => ({
      id: user.id,
      name: user.name,
      department: user.department,
      day: user.dob!.getUTCDate(),
      month: user.dob!.getUTCMonth() + 1,
    }))
    .sort((a, b) => a.day - b.day);

  res.json({ birthdays });
});

router.get('/recently-joined', requireAuth, async (_req: Request, res: Response<Serializable<RecentlyJoinedResponse> | ErrorResponse>) => {
  const now = new Date();
  const currentMonth = now.getUTCMonth();
  const currentYear = now.getUTCFullYear();

  const users = await prisma.user.findMany({
    where: { status: UserStatus.Active, joinedDate: { not: null } },
    select: { id: true, name: true, joinedDate: true, department: { select: { id: true, name: true } } },
    orderBy: { joinedDate: 'desc' },
    take: RECENTLY_JOINED_SCAN_LIMIT,
  });

  const recentlyJoined = users
    .filter((user) => user.joinedDate !== null && user.joinedDate.getUTCMonth() === currentMonth && user.joinedDate.getUTCFullYear() === currentYear)
    .map((user) => ({
      id: user.id,
      name: user.name,
      department: user.department,
      joinedDate: user.joinedDate!,
    }));

  res.json({ recentlyJoined });
});

export default router;
