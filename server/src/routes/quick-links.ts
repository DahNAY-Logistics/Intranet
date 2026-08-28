import { Router } from 'express';
import type { Request, Response } from 'express';

import { categoryMessages, quickLinkMessages } from 'core/messages.ts';
import { createQuickLinkSchema, updateQuickLinkSchema } from 'core/schemas/quick-links.ts';
import type { ErrorResponse, MessageResponse, Serializable } from 'core/types/common.ts';
import type { QuickLinkDetailResponse, QuickLinksActiveResponse, QuickLinksResponse } from 'core/types/quick-links.ts';

import prisma from '../db.ts';
import { QuickLinkStatus, Role } from '../generated/prisma/client.ts';
import { requireAuth } from 'src/middleware/require-auth.ts';
import { requireAdmin } from '../middleware/require-admin.ts';
import { validate } from '../lib/validate.ts';
import { buildQuickLinksWhere, getQuickLinksFilterOptions, quickLinkSelect } from '../lib/quick-links.ts';
import {
  quickLinkIdParamSchema,
  quickLinksAdminListQuerySchema,
  quickLinksListQuerySchema,
} from '../schemas/quick-links.ts';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response<Serializable<QuickLinksResponse> | ErrorResponse>) => {
  const isAdmin = req.user.role === Role.Admin;

  const query = validate(isAdmin ? quickLinksAdminListQuerySchema : quickLinksListQuerySchema, req.query, res);
  if (!query) return res.status(400).json({ error: quickLinkMessages.INVALID_QUERY });

  const where = {
    ...buildQuickLinksWhere({ query }),
    ...(!isAdmin && { status: QuickLinkStatus.Published }),
  };

  const [quickLinks, totalCount, filterOptions] = await Promise.all([
    prisma.quickLink.findMany({
      where,
      select: quickLinkSelect,
      orderBy: { createdAt: query.sortOrder },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.quickLink.count({ where }),
    getQuickLinksFilterOptions({ query, includeStatuses: isAdmin }),
  ]);

  res.json({ quickLinks, page: query.page, pageSize: query.pageSize, totalCount, totalPages: Math.max(1, Math.ceil(totalCount / query.pageSize)), filterOptions });
});

router.get('/active', requireAuth, async (_req: Request, res: Response<Serializable<QuickLinksActiveResponse> | ErrorResponse>) => {
  const quickLinks = await prisma.quickLink.findMany({
    where: { status: QuickLinkStatus.Published },
    select: quickLinkSelect,
    orderBy: { createdAt: 'desc' },
  });

  res.json({ quickLinks });
});

router.get('/:id', requireAuth, async (req: Request<{ id: string }>, res: Response<Serializable<QuickLinkDetailResponse> | ErrorResponse>) => {
  const params = validate(quickLinkIdParamSchema, req.params, res);
  if (!params) return res.status(400).json({ error: quickLinkMessages.INVALID_PARAMS });

  const quickLink = await prisma.quickLink.findUnique({ where: { id: params.id }, select: quickLinkSelect });
  if (!quickLink || (req.user.role !== Role.Admin && quickLink.status !== QuickLinkStatus.Published)) {
    return res.status(404).json({ error: quickLinkMessages.NOT_FOUND });
  }

  res.json({ quickLink });
});

router.post('/', requireAuth, requireAdmin, async (req: Request, res: Response<MessageResponse | ErrorResponse>) => {
  const body = validate(createQuickLinkSchema, req.body, res);
  if (!body) return res.status(400).json({ error: quickLinkMessages.INVALID_BODY });

  const category = await prisma.quickLinkCategory.findUnique({ where: { id: body.categoryId } });
  if (!category) {
    return res.status(400).json({ error: categoryMessages.NOT_FOUND('Category') });
  }

  const quickLink = await prisma.quickLink.create({
    data: {
      title: body.title,
      excerpt: body.excerpt,
      url: body.url,
      status: body.status,
      categoryId: body.categoryId,
      postedById: req.user.id,
    },
    select: quickLinkSelect,
  });

  res.status(201).json({ message: quickLinkMessages.CREATED(quickLink.title) });
});

router.put('/:id', requireAuth, requireAdmin, async (req: Request<{ id: string }>, res: Response<MessageResponse | ErrorResponse>) => {
  const params = validate(quickLinkIdParamSchema, req.params, res);
  if (!params) return res.status(400).json({ error: quickLinkMessages.INVALID_PARAMS });

  const body = validate(updateQuickLinkSchema, req.body, res);
  if (!body) return res.status(400).json({ error: quickLinkMessages.INVALID_BODY });

  const existing = await prisma.quickLink.findUnique({ where: { id: params.id } });
  if (!existing) {
    return res.status(404).json({ error: quickLinkMessages.NOT_FOUND });
  }

  if (body.categoryId !== existing.categoryId) {
    const category = await prisma.quickLinkCategory.findUnique({ where: { id: body.categoryId } });
    if (!category) {
      return res.status(400).json({ error: categoryMessages.NOT_FOUND('Category') });
    }
  }

  const quickLink = await prisma.quickLink.update({
    where: { id: params.id },
    data: {
      title: body.title,
      excerpt: body.excerpt,
      url: body.url,
      status: body.status,
      categoryId: body.categoryId,
    },
    select: quickLinkSelect,
  });

  res.json({ message: quickLinkMessages.UPDATED(quickLink.title) });
});

router.delete('/:id', requireAuth, requireAdmin, async (req: Request<{ id: string }>, res: Response<MessageResponse | ErrorResponse>) => {
  const params = validate(quickLinkIdParamSchema, req.params, res);
  if (!params) return res.status(400).json({ error: quickLinkMessages.INVALID_PARAMS });

  const existing = await prisma.quickLink.findUnique({ where: { id: params.id } });
  if (!existing) {
    return res.status(404).json({ error: quickLinkMessages.NOT_FOUND });
  }

  await prisma.quickLink.delete({ where: { id: params.id } });

  res.json({ message: quickLinkMessages.DELETED(existing.title) });
});

export default router;
