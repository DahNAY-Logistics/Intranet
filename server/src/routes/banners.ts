import { Router } from 'express';
import type { Request, Response } from 'express';

import { bannerMessages, categoryMessages } from 'core/messages.ts';
import { createBannerSchema, updateBannerSchema } from 'core/schemas/banners.ts';
import type { ErrorResponse, MessageResponse, Serializable } from 'core/types/common.ts';
import type { BannerDetailResponse, BannersResponse } from 'core/types/banners.ts';

import prisma from '../db.ts';
import { BannerStatus } from '../generated/prisma/client.ts';
import { requireAuth } from 'src/middleware/require-auth.ts';
import { requireAdmin } from '../middleware/require-admin.ts';
import { validate } from '../lib/validate.ts';
import { deleteAttachment } from '../lib/attachments/attachments.ts';
import { bannerSelect, getNextDisplayOrder } from '../lib/banners.ts';
import {
  bannerIdParamSchema,
  bannersQuerySchema,
  reorderBannersSchema,
} from '../schemas/banners.ts';

const router = Router();

router.get('/', requireAuth, requireAdmin, async (req: Request, res: Response<Serializable<BannersResponse> | ErrorResponse>) => {
  const query = validate(bannersQuerySchema, req.query, res);
  if (!query) return res.status(400).json({ error: bannerMessages.INVALID_QUERY });

  const banners = await prisma.banner.findMany({
    where: { status: query.status },
    select: bannerSelect,
    orderBy: query.status === BannerStatus.Published ? { displayOrder: 'asc' } : { updatedAt: 'desc' },
  });

  res.json({ banners });
});

router.patch('/reorder', requireAuth, requireAdmin, async (req: Request, res: Response<MessageResponse | ErrorResponse>) => {
    const body = validate(reorderBannersSchema, req.body, res);
    if (!body) return res.status(400).json({ error: bannerMessages.INVALID_REORDER_BODY });

    const ids = body.items.map((item) => item.id);
    const publishedCount = await prisma.banner.count({
      where: { id: { in: ids }, status: BannerStatus.Published },
    });

    if (publishedCount !== body.items.length) {
      res.status(400).json({ error: bannerMessages.REORDER_STATUS_MISMATCH });
      return;
    }

    await prisma.$transaction(
      body.items.map((item) => prisma.banner.update({ where: { id: item.id }, data: { displayOrder: item.displayOrder } })),
    );

    res.json({ message: bannerMessages.REORDERED});
  },
);

router.get('/active', requireAuth, async (_req: Request, res: Response<Serializable<BannersResponse> | ErrorResponse>) => {
  const now = new Date();

  const banners = await prisma.banner.findMany({
    where: { status: BannerStatus.Published, startDate: { lte: now }, endDate: { gte: now } },
    select: bannerSelect,
    orderBy: { displayOrder: 'asc' },
  });

  res.json({ banners });
});

router.get('/:id', requireAuth, requireAdmin, async (req: Request<{ id: string }>, res: Response<Serializable<BannerDetailResponse> | ErrorResponse>) => {
  const params = validate(bannerIdParamSchema, req.params, res);
  if (!params) return res.status(400).json({ error: bannerMessages.INVALID_PARAMS });

  const banner = await prisma.banner.findUnique({ where: { id: params.id }, select: bannerSelect });
  if (!banner) {
    return res.status(404).json({ error: bannerMessages.NOT_FOUND });
  }

  res.json({ banner });
});

router.post('/', requireAuth, requireAdmin, async (req: Request, res: Response<MessageResponse | ErrorResponse>) => {
  const body = validate(createBannerSchema, req.body, res);
  if (!body) return res.status(400).json({ error: bannerMessages.INVALID_BODY });

  const category = await prisma.bannerCategory.findUnique({ where: { id: body.categoryId } });
  if (!category) {
    return res.status(400).json({ error: categoryMessages.NOT_FOUND('Category') });
  }

  const attachment = await prisma.attachment.findUnique({
    where: { id: body.attachmentId },
    include: { banner: true },
  });
  if (!attachment) {
    return res.status(400).json({ error: bannerMessages.ATTACHMENT_NOT_FOUND });
  }
  if (attachment.banner) {
    return res.status(400).json({ error: bannerMessages.ATTACHMENT_ALREADY_USED });
  }

  const banner = await prisma.$transaction(async (tx) => {
    const displayOrder = body.status === BannerStatus.Published ? await getNextDisplayOrder(tx) : 0;

    return tx.banner.create({
      data: {
        title: body.title,
        excerpt: body.excerpt,
        status: body.status,
        startDate: body.startDate,
        endDate: body.endDate,
        categoryId: body.categoryId,
        attachmentId: body.attachmentId,
        postedById: req.user.id,
        displayOrder,
      },
      select: bannerSelect,
    });
  });

  res.status(201).json({ message: bannerMessages.CREATED(banner.title)});
});

router.put('/:id', requireAuth, requireAdmin, async (req: Request<{ id: string }>, res: Response<MessageResponse | ErrorResponse>) => {
  const params = validate(bannerIdParamSchema, req.params, res);
  if (!params) return res.status(400).json({ error: bannerMessages.INVALID_PARAMS });

  const body = validate(updateBannerSchema, req.body, res);
  if (!body) return res.status(400).json({ error: bannerMessages.INVALID_BODY });

  const existing = await prisma.banner.findUnique({ where: { id: params.id } });
  if (!existing) {
    return res.status(404).json({ error: bannerMessages.NOT_FOUND });
  }

  if (body.categoryId !== existing.categoryId) {
    const category = await prisma.bannerCategory.findUnique({ where: { id: body.categoryId } });
    if (!category) {
      return res.status(400).json({ error: categoryMessages.NOT_FOUND('Category') });
    }
  }

  const attachmentChanged = body.attachmentId !== existing.attachmentId;
  if (attachmentChanged) {
    const attachment = await prisma.attachment.findUnique({
      where: { id: body.attachmentId },
      include: { banner: true },
    });
    if (!attachment) {
      return res.status(400).json({ error: bannerMessages.ATTACHMENT_NOT_FOUND });
    }
    if (attachment.banner) {
      return res.status(400).json({ error: bannerMessages.ATTACHMENT_ALREADY_USED });
    }
  }

  const banner = await prisma.$transaction(async (tx) => {
    const becomingPublished = existing.status !== BannerStatus.Published && body.status === BannerStatus.Published;
    const displayOrder = becomingPublished ? await getNextDisplayOrder(tx) : existing.displayOrder;

    return tx.banner.update({
      where: { id: params.id },
      data: {
        title: body.title,
        excerpt: body.excerpt,
        status: body.status,
        startDate: body.startDate,
        endDate: body.endDate,
        categoryId: body.categoryId,
        attachmentId: body.attachmentId,
        displayOrder,
      },
      select: bannerSelect,
    });
  });

  if (attachmentChanged) {
    await deleteAttachment(existing.attachmentId);
  }

  res.json({ message: bannerMessages.UPDATED(banner.title) });
});

router.delete('/:id', requireAuth, requireAdmin, async (req: Request<{ id: string }>, res: Response<MessageResponse | ErrorResponse>) => {
  const params = validate(bannerIdParamSchema, req.params, res);
  if (!params) return res.status(400).json({ error: bannerMessages.INVALID_PARAMS });

  const existing = await prisma.banner.findUnique({ where: { id: params.id } });
  if (!existing) {
    return res.status(404).json({ error: bannerMessages.NOT_FOUND });
  }

  await prisma.banner.delete({ where: { id: params.id } });
  await deleteAttachment(existing.attachmentId);

  res.json({ message: bannerMessages.DELETED(existing.title) });
});

export default router;
