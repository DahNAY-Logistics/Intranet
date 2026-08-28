import { Router } from 'express';
import type { Request, Response } from 'express';

import { settingsMessages } from 'core/messages.ts';
import { updateSettingsSchema } from 'core/schemas/settings.ts';
import type { ErrorResponse, MessageResponse, Serializable } from 'core/types/common.ts';
import type { SettingsResponse } from 'core/types/settings.ts';

import prisma from '../db.ts';
import { requireAuth } from '../middleware/require-auth.ts';
import { requireAdmin } from '../middleware/require-admin.ts';
import { validate } from '../lib/validate.ts';

const router = Router();

const DEFAULT_SETTINGS: SettingsResponse = {
  siteName: 'Intranet',
  organizationName: '',
  supportEmail: '',
  codeOfConductUrl: null,
  privacyPolicyUrl: null,
  maintenanceMode: false,
};

router.get('/', requireAuth, async (_req: Request, res: Response<Serializable<SettingsResponse> | ErrorResponse>) => {
  const settings = await prisma.settings.findUnique({
    where: { id: 1 },
    select: {
      siteName: true,
      organizationName: true,
      supportEmail: true,
      codeOfConductUrl: true,
      privacyPolicyUrl: true,
      maintenanceMode: true,
    },
  });

  res.json(settings ?? DEFAULT_SETTINGS);
});

router.put('/', requireAuth, requireAdmin, async (req: Request, res: Response<MessageResponse | ErrorResponse>) => {
  const body = validate(updateSettingsSchema, req.body, res);
  if (!body) return res.status(400).json({ error: settingsMessages.INVALID_BODY });

  await prisma.settings.upsert({
    where: { id: 1 },
    create: { id: 1, ...body },
    update: body,
  });

  res.json({ message: settingsMessages.UPDATED });
});

export default router;
