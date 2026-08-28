import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';

import { attachmentLimits } from 'core/constants.ts';
import { bannerMessages } from 'core/messages.ts';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: attachmentLimits.maxFileSizeBytes },
  fileFilter: (_req, file, cb) => {
    cb(null, (attachmentLimits.allowedMimeTypes as readonly string[]).includes(file.mimetype));
  },
});

export function uploadImage(fieldName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    upload.single(fieldName)(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: bannerMessages.IMAGE_TOO_LARGE });
        return;
      }

      if (err) {
        res.status(400).json({ error: bannerMessages.INVALID_IMAGE_TYPE });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: bannerMessages.INVALID_IMAGE_TYPE });
        return;
      }

      next();
    });
  };
}
