import { Router } from 'express';
import type { Request, Response } from 'express';

import type { ErrorResponse, Serializable } from 'core/types/common.ts';
import type { MeResponse } from 'core/types/users.ts';

import prisma from 'src/db.ts';
import { requireAuth } from '../middleware/require-auth.ts';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response<Serializable<MeResponse> | ErrorResponse>) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, image: true, role: true, employeeId: true },
  });

  res.json(user);
});

export default router;
