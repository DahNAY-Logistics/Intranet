import { Router } from 'express';
import type { Request, Response } from 'express';

import { announcementMessages, categoryMessages } from 'core/messages.ts';
import { createAnnouncementSchema, updateAnnouncementSchema } from 'core/schemas/announcements.ts';
import type { ErrorResponse, MessageResponse, Serializable } from 'core/types/common.ts';
import type { AnnouncementDetailResponse, AnnouncementsActiveResponse, AnnouncementsResponse } from 'core/types/announcements.ts';

import prisma from '../db.ts';
import { AnnouncementStatus, Role } from '../generated/prisma/client.ts';
import { requireAuth } from 'src/middleware/require-auth.ts';
import { requireAdmin } from '../middleware/require-admin.ts';
import { validate } from '../lib/validate.ts';
import { announcementSelect, buildAnnouncementsWhere, getAnnouncementsFilterOptions } from '../lib/announcements.ts';
import {
  announcementIdParamSchema,
  announcementsAdminListQuerySchema,
  announcementsListQuerySchema,
} from '../schemas/announcements.ts';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response<Serializable<AnnouncementsResponse> | ErrorResponse>) => {
  const isAdmin = req.user.role === Role.Admin;

  const query = validate(isAdmin ? announcementsAdminListQuerySchema : announcementsListQuerySchema, req.query, res);
  if (!query) return res.status(400).json({ error: announcementMessages.INVALID_QUERY });

  const where = {
    ...buildAnnouncementsWhere({ query }),
    ...(!isAdmin && { status: AnnouncementStatus.Published }),
  };

  const [announcements, totalCount, filterOptions] = await Promise.all([
    prisma.announcement.findMany({
      where,
      select: announcementSelect,
      orderBy: { createdAt: query.sortOrder },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.announcement.count({ where }),
    getAnnouncementsFilterOptions({ query, includeStatuses: isAdmin }),
  ]);

  res.json({ announcements, page: query.page, pageSize: query.pageSize, totalCount, totalPages: Math.max(1, Math.ceil(totalCount / query.pageSize)), filterOptions });
});

router.get('/active', requireAuth, async (req: Request, res: Response<Serializable<AnnouncementsActiveResponse> | ErrorResponse>) => {
  const query = validate(announcementsListQuerySchema, req.query, res);
  if (!query) return res.status(400).json({ error: announcementMessages.INVALID_QUERY });

  const where = { ...buildAnnouncementsWhere({ query }), status: AnnouncementStatus.Published };

  const announcements = await prisma.announcement.findMany({
    where,
    select: announcementSelect,
    orderBy: { createdAt: query.sortOrder },
  });

  res.json({ announcements });
});

router.get('/:id', requireAuth, async (req: Request<{ id: string }>, res: Response<Serializable<AnnouncementDetailResponse> | ErrorResponse>) => {
  const params = validate(announcementIdParamSchema, req.params, res);
  if (!params) return res.status(400).json({ error: announcementMessages.INVALID_PARAMS });

  const announcement = await prisma.announcement.findUnique({ where: { id: params.id }, select: announcementSelect });
  if (!announcement || (req.user.role !== Role.Admin && announcement.status !== AnnouncementStatus.Published)) {
    return res.status(404).json({ error: announcementMessages.NOT_FOUND });
  }

  res.json({ announcement });
});

router.post('/', requireAuth, requireAdmin, async (req: Request, res: Response<MessageResponse | ErrorResponse>) => {
  const body = validate(createAnnouncementSchema, req.body, res);
  if (!body) return res.status(400).json({ error: announcementMessages.INVALID_BODY });

  const category = await prisma.announcementCategory.findUnique({ where: { id: body.categoryId } });
  if (!category) {
    return res.status(400).json({ error: categoryMessages.NOT_FOUND('Category') });
  }

  const announcement = await prisma.announcement.create({
    data: {
      title: body.title,
      excerpt: body.excerpt,
      status: body.status,
      categoryId: body.categoryId,
      postedById: req.user.id,
    },
    select: announcementSelect,
  });

  res.status(201).json({ message: announcementMessages.CREATED(announcement.title) });
});

router.put('/:id', requireAuth, requireAdmin, async (req: Request<{ id: string }>, res: Response<MessageResponse | ErrorResponse>) => {
  const params = validate(announcementIdParamSchema, req.params, res);
  if (!params) return res.status(400).json({ error: announcementMessages.INVALID_PARAMS });

  const body = validate(updateAnnouncementSchema, req.body, res);
  if (!body) return res.status(400).json({ error: announcementMessages.INVALID_BODY });

  const existing = await prisma.announcement.findUnique({ where: { id: params.id } });
  if (!existing) {
    return res.status(404).json({ error: announcementMessages.NOT_FOUND });
  }

  if (body.categoryId !== existing.categoryId) {
    const category = await prisma.announcementCategory.findUnique({ where: { id: body.categoryId } });
    if (!category) {
      return res.status(400).json({ error: categoryMessages.NOT_FOUND('Category') });
    }
  }

  const announcement = await prisma.announcement.update({
    where: { id: params.id },
    data: {
      title: body.title,
      excerpt: body.excerpt,
      status: body.status,
      categoryId: body.categoryId,
    },
    select: announcementSelect,
  });

  res.json({ message: announcementMessages.UPDATED(announcement.title) });
});

router.delete('/:id', requireAuth, requireAdmin, async (req: Request<{ id: string }>, res: Response<MessageResponse | ErrorResponse>) => {
  const params = validate(announcementIdParamSchema, req.params, res);
  if (!params) return res.status(400).json({ error: announcementMessages.INVALID_PARAMS });

  const existing = await prisma.announcement.findUnique({ where: { id: params.id } });
  if (!existing) {
    return res.status(404).json({ error: announcementMessages.NOT_FOUND });
  }

  await prisma.announcement.delete({ where: { id: params.id } });

  res.json({ message: announcementMessages.DELETED(existing.title) });
});

export default router;
