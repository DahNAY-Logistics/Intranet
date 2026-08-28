import type { z } from 'zod';

import type { QuickLinksFilterOptionsResponse } from 'core/types/quick-links.ts';

import prisma from '../db.ts';
import { Prisma } from '../generated/prisma/client.ts';
import { toFilterOptions } from './filter-options.ts';
import type { quickLinksAdminListQuerySchema } from '../schemas/quick-links.ts';

type QuickLinksFilterFacet = 'status' | 'categoryId';

export const quickLinkSelect = {
  id: true,
  title: true,
  excerpt: true,
  url: true,
  status: true,
  createdAt: true,
  category: { select: { id: true, name: true } },
  postedBy: { select: { name: true } },
} as const;

export interface BuildQuickLinksWhereParams {
  query: z.infer<typeof quickLinksAdminListQuerySchema>;
  excludeFacet?: QuickLinksFilterFacet;
}

export function buildQuickLinksWhere({ query, excludeFacet }: BuildQuickLinksWhereParams): Prisma.QuickLinkWhereInput {
  return {
    ...(query.status && excludeFacet !== 'status' && { status: { in: query.status } }),
    ...(query.categoryId && excludeFacet !== 'categoryId' && { categoryId: { in: query.categoryId } }),
  };
}

export interface GetQuickLinksFilterOptionsParams {
  query: z.infer<typeof quickLinksAdminListQuerySchema>;
  includeStatuses?: boolean;
}

export async function getQuickLinksFilterOptions({ query, includeStatuses = false }: GetQuickLinksFilterOptionsParams): Promise<QuickLinksFilterOptionsResponse> {
  const [statusCounts, categoryCounts] = await Promise.all([
    includeStatuses
      ? prisma.quickLink.groupBy({
          by: ['status'],
          _count: { status: true },
          where: buildQuickLinksWhere({ query, excludeFacet: 'status' }),
        })
      : null,
    prisma.quickLink.groupBy({
      by: ['categoryId'],
      _count: { categoryId: true },
      where: buildQuickLinksWhere({ query, excludeFacet: 'categoryId' }),
    }),
  ]);

  return {
    ...(statusCounts && { statuses: toFilterOptions(statusCounts.map((row) => [row.status, row._count.status])) }),
    categories: toFilterOptions(categoryCounts.map((row) => [String(row.categoryId), row._count.categoryId])),
  };
}
