import { Router } from 'express';
import type { Request, Response } from 'express';

import { categoryMessages } from 'core/messages.ts';
import { createCategorySchema, updateCategorySchema } from 'core/schemas/categories.ts';
import type { ErrorResponse, MessageResponse, Serializable } from 'core/types/common.ts';
import type { CategoriesResponse, CategoryDeletedResponse } from 'core/types/categories.ts';

import { requireAuth } from '../middleware/require-auth.ts';
import { requireAdmin } from '../middleware/require-admin.ts';
import { numericIdParamSchema } from '../schemas/shared.ts';
import { validate } from './validate.ts';

export interface CategoryListRecord {
  id: number;
  name: string;
  createdAt: Date;
  count: number;
}

export interface CategoryRouterConfig {
  entityLabel: string;
  resourceLabel: string;
  findMany: () => Promise<CategoryListRecord[]>;
  findUnique: (id: number) => Promise<{ id: number } | null>;
  isDuplicateName: (name: string, excludeId?: number) => Promise<boolean>;
  countUsage: (id: number) => Promise<number>;
  create: (name: string) => Promise<void>;
  update: (id: number, name: string) => Promise<{ name: string }>;
  remove: (id: number) => Promise<void>;
}

export function createCategoryRouter(config: CategoryRouterConfig) {
  const { entityLabel, resourceLabel, findMany, findUnique, isDuplicateName, countUsage, create, update, remove } = config;
  const idParamSchema = numericIdParamSchema(entityLabel);

  const router = Router();

  router.get('/', requireAuth, requireAdmin, async (_req: Request, res: Response<Serializable<CategoriesResponse> | ErrorResponse>) => {
    const categories = await findMany();
    res.json({ categories });
  });

  router.post('/', requireAuth, requireAdmin, async (req: Request, res: Response<MessageResponse | ErrorResponse>) => {
    const body = validate(createCategorySchema, req.body, res);
    if (!body) return res.status(400).json({ error: categoryMessages.INVALID_BODY });

    if (await isDuplicateName(body.name)) {
      return res.status(400).json({ error: categoryMessages.DUPLICATE_NAME(entityLabel) });
    }

    await create(body.name);
    return res.status(201).json({ message: categoryMessages.CREATED(entityLabel, body.name) });
  });

  router.put('/:id', requireAuth, requireAdmin, async (req: Request<{ id: string }>, res: Response<MessageResponse | ErrorResponse>) => {
    const params = validate(idParamSchema, req.params, res);
    if (!params) return res.status(400).json({ error: categoryMessages.INVALID_PARAMS });

    const body = validate(updateCategorySchema, req.body, res);
    if (!body) return res.status(400).json({ error: categoryMessages.INVALID_BODY });

    const existing = await findUnique(params.id);
    if (!existing) {
      return res.status(404).json({ error: categoryMessages.NOT_FOUND(entityLabel) });
    }

    if (await isDuplicateName(body.name, params.id)) {
      return res.status(400).json({ error: categoryMessages.DUPLICATE_NAME(entityLabel) });
    }

    const updated = await update(params.id, body.name);
    res.json({ message: categoryMessages.UPDATED(entityLabel, updated.name) });
  });

  router.delete('/:id', requireAuth, requireAdmin, async (req: Request<{ id: string }>, res: Response<Serializable<CategoryDeletedResponse> | ErrorResponse>) => {
    const params = validate(idParamSchema, req.params, res);
    if (!params) return res.status(400).json({ error: categoryMessages.INVALID_PARAMS });

    const existing = await findUnique(params.id);
    if (!existing) {
      return res.status(404).json({ error: categoryMessages.NOT_FOUND(entityLabel) });
    }

    const usageCount = await countUsage(params.id);
    if (usageCount > 0) {
      return res.status(400).json({ error: categoryMessages.IN_USE(entityLabel, usageCount, resourceLabel) });
    }

    await remove(params.id);
    res.json({ deletedId: params.id });
  });

  return router;
}
