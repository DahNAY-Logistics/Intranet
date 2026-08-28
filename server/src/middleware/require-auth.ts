import type { NextFunction, Request, Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';

import { commonMessages } from 'core/messages.ts';
import { auth } from '../lib/auth/auth.ts';

type Session = typeof auth.$Infer.Session;

declare global {
  namespace Express {
    interface Request {
      user: Session['user'];
      session: Session['session'];
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });

  if (!session) {
    res.status(401).json({ error: commonMessages.UNAUTHORIZED });
    return;
  }

  req.user = session.user;
  req.session = session.session;
  next();
}
