import { randomUUID } from 'node:crypto';

import { Router } from 'express';
import type { Request, Response } from 'express';

import { bannerImageConstraints } from 'core/constants.ts';
import { bannerMessages } from 'core/messages.ts';
import type { ErrorResponse, Serializable } from 'core/types/common.ts';
import type { AttachmentResponse } from 'core/types/attachments.ts';

import prisma from '../db.ts';
import { requireAuth } from 'src/middleware/require-auth.ts';
import { requireAdmin } from '../middleware/require-admin.ts';
import { uploadImage } from '../middleware/upload-image.ts';
import { extensionForMimeType, uploadBlob } from '../lib/attachments/blob-storage.ts';
import { getImageDimensions, hasMinimumWidth, isLandscape } from '../lib/attachments/image-validation.ts';

const router = Router();

router.post('/', requireAuth, requireAdmin, uploadImage('file'), async (req: Request, res: Response<Serializable<AttachmentResponse> | ErrorResponse>) => {
    const file = req.file!;

    const dimensions = getImageDimensions(file.buffer);
    if (!dimensions) {
      return res.status(400).json({ error: bannerMessages.IMAGE_UNREADABLE });
    }

    if (!hasMinimumWidth(dimensions)) {
      return res.status(400).json({ error: bannerMessages.IMAGE_DIMENSIONS_INVALID(bannerImageConstraints.minWidthPx) });
    }

    if (!isLandscape(dimensions)) {
      return res.status(400).json({ error: bannerMessages.IMAGE_ASPECT_RATIO_INVALID });
    }

    const blobName = `banners/${randomUUID()}.${extensionForMimeType(file.mimetype)}`;
    const url = await uploadBlob({ blobName, buffer: file.buffer, mimeType: file.mimetype });

    const attachment = await prisma.attachment.create({ data: { url } });

    res.status(201).json({ id: attachment.id, url: attachment.url, createdAt: attachment.createdAt.toISOString() });
  },
);

export default router;
