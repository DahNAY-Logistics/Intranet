import type { NextFunction, Request, Response } from 'express';

import { commonMessages } from 'core/messages.ts';

import { Role } from '../generated/prisma/client.ts';
import { requireAuth } from './require-auth.ts';

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  await requireAuth(req, res, () => {
    if (req.user?.role !== Role.Admin) {
      res.status(403).json({ error: commonMessages.FORBIDDEN });
      return;
    }

    next();
  });
}
