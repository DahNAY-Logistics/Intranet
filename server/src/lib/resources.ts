import type { z } from 'zod';

import type { ResourcesFilterOptionsResponse } from 'core/types/resources.ts';

import prisma from '../db.ts';
import { Prisma } from '../generated/prisma/client.ts';
import { toFilterOptions } from './filter-options.ts';
import type { resourcesAdminListQuerySchema } from '../schemas/resources.ts';

type ResourcesFilterFacet = 'status' | 'categoryId';

export const resourceSelect = {
  id: true,
  title: true,
  excerpt: true,
  content: true,
  url: true,
  status: true,
  createdAt: true,
  category: { select: { id: true, name: true } },
  postedBy: { select: { name: true } },
} as const;

export interface BuildResourcesWhereParams {
  query: z.infer<typeof resourcesAdminListQuerySchema>;
  excludeFacet?: ResourcesFilterFacet;
}

export function buildResourcesWhere({ query, excludeFacet }: BuildResourcesWhereParams): Prisma.ResourceWhereInput {
  return {
    ...(query.status && excludeFacet !== 'status' && { status: { in: query.status } }),
    ...(query.categoryId && excludeFacet !== 'categoryId' && { categoryId: { in: query.categoryId } }),
  };
}

export interface GetResourcesFilterOptionsParams {
  query: z.infer<typeof resourcesAdminListQuerySchema>;
  includeStatuses?: boolean;
}

export async function getResourcesFilterOptions({ query, includeStatuses = false }: GetResourcesFilterOptionsParams): Promise<ResourcesFilterOptionsResponse> {
  const [statusCounts, categoryCounts] = await Promise.all([
    includeStatuses
      ? prisma.resource.groupBy({
          by: ['status'],
          _count: { status: true },
          where: buildResourcesWhere({ query, excludeFacet: 'status' }),
        })
      : null,
    prisma.resource.groupBy({
      by: ['categoryId'],
      _count: { categoryId: true },
      where: buildResourcesWhere({ query, excludeFacet: 'categoryId' }),
    }),
  ]);

  return {
    ...(statusCounts && { statuses: toFilterOptions(statusCounts.map((row) => [row.status, row._count.status])) }),
    categories: toFilterOptions(categoryCounts.map((row) => [String(row.categoryId), row._count.categoryId])),
  };
}
