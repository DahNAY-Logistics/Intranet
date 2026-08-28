import { Router } from 'express';
import type { Request, Response } from 'express';

import { categoryMessages, resourceMessages } from 'core/messages.ts';
import { createResourceSchema, updateResourceSchema } from 'core/schemas/resources.ts';
import type { ErrorResponse, MessageResponse, Serializable } from 'core/types/common.ts';
import type { ResourceDetailResponse, ResourcesResponse } from 'core/types/resources.ts';

import prisma from '../db.ts';
import { ResourceStatus, Role } from '../generated/prisma/client.ts';
import { requireAuth } from 'src/middleware/require-auth.ts';
import { requireAdmin } from '../middleware/require-admin.ts';
import { validate } from '../lib/validate.ts';
import { buildResourcesWhere, getResourcesFilterOptions, resourceSelect } from '../lib/resources.ts';
import {
  resourceIdParamSchema,
  resourcesAdminListQuerySchema,
  resourcesListQuerySchema,
} from '../schemas/resources.ts';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response<Serializable<ResourcesResponse> | ErrorResponse>) => {
  const isAdmin = req.user.role === Role.Admin;

  const query = validate(isAdmin ? resourcesAdminListQuerySchema : resourcesListQuerySchema, req.query, res);
  if (!query) return res.status(400).json({ error: resourceMessages.INVALID_QUERY });

  const where = {
    ...buildResourcesWhere({ query }),
    ...(!isAdmin && { status: ResourceStatus.Published }),
  };

  const [resources, totalCount, filterOptions] = await Promise.all([
    prisma.resource.findMany({
      where,
      select: resourceSelect,
      orderBy: { createdAt: query.sortOrder },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.resource.count({ where }),
    getResourcesFilterOptions({ query, includeStatuses: isAdmin }),
  ]);

  res.json({ resources, page: query.page, pageSize: query.pageSize, totalCount, totalPages: Math.max(1, Math.ceil(totalCount / query.pageSize)), filterOptions });
});

router.get('/:id', requireAuth, async (req: Request<{ id: string }>, res: Response<Serializable<ResourceDetailResponse> | ErrorResponse>) => {
  const params = validate(resourceIdParamSchema, req.params, res);
  if (!params) return res.status(400).json({ error: resourceMessages.INVALID_PARAMS });

  const resource = await prisma.resource.findUnique({ where: { id: params.id }, select: resourceSelect });
  if (!resource || (req.user.role !== Role.Admin && resource.status !== ResourceStatus.Published)) {
    return res.status(404).json({ error: resourceMessages.NOT_FOUND });
  }

  res.json({ resource });
});

router.post('/', requireAuth, requireAdmin, async (req: Request, res: Response<MessageResponse | ErrorResponse>) => {
  const body = validate(createResourceSchema, req.body, res);
  if (!body) return res.status(400).json({ error: resourceMessages.INVALID_BODY });

  const category = await prisma.resourceCategory.findUnique({ where: { id: body.categoryId } });
  if (!category) {
    return res.status(400).json({ error: categoryMessages.NOT_FOUND('Category') });
  }

  const resource = await prisma.resource.create({
    data: {
      title: body.title,
      excerpt: body.excerpt,
      content: body.content,
      url: body.url ?? null,
      status: body.status,
      categoryId: body.categoryId,
      postedById: req.user.id,
    },
    select: resourceSelect,
  });

  res.status(201).json({ message: resourceMessages.CREATED(resource.title) });
});

router.put('/:id', requireAuth, requireAdmin, async (req: Request<{ id: string }>, res: Response<MessageResponse | ErrorResponse>) => {
  const params = validate(resourceIdParamSchema, req.params, res);
  if (!params) return res.status(400).json({ error: resourceMessages.INVALID_PARAMS });

  const body = validate(updateResourceSchema, req.body, res);
  if (!body) return res.status(400).json({ error: resourceMessages.INVALID_BODY });

  const existing = await prisma.resource.findUnique({ where: { id: params.id } });
  if (!existing) {
    return res.status(404).json({ error: resourceMessages.NOT_FOUND });
  }

  if (body.categoryId !== existing.categoryId) {
    const category = await prisma.resourceCategory.findUnique({ where: { id: body.categoryId } });
    if (!category) {
      return res.status(400).json({ error: categoryMessages.NOT_FOUND('Category') });
    }
  }

  const resource = await prisma.resource.update({
    where: { id: params.id },
    data: {
      title: body.title,
      excerpt: body.excerpt,
      content: body.content,
      url: body.url ?? null,
      status: body.status,
      categoryId: body.categoryId,
    },
    select: resourceSelect,
  });

  res.json({ message: resourceMessages.UPDATED(resource.title) });
});

router.delete('/:id', requireAuth, requireAdmin, async (req: Request<{ id: string }>, res: Response<MessageResponse | ErrorResponse>) => {
  const params = validate(resourceIdParamSchema, req.params, res);
  if (!params) return res.status(400).json({ error: resourceMessages.INVALID_PARAMS });

  const existing = await prisma.resource.findUnique({ where: { id: params.id } });
  if (!existing) {
    return res.status(404).json({ error: resourceMessages.NOT_FOUND });
  }

  await prisma.resource.delete({ where: { id: params.id } });

  res.json({ message: resourceMessages.DELETED(existing.title) });
});

export default router;
