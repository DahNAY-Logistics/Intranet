import type { Response } from 'express';
import type { ZodType } from 'zod';

import { commonMessages } from 'core/messages.ts';

export function validate<T>(schema: ZodType<T>, data: unknown, res: Response): T | null {
  const result = schema.safeParse(data);

  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0]?.message ?? commonMessages.VALIDATION_FAILED });
    return null;
  }

  return result.data;
}
