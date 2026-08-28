import type { z } from 'zod';

import type { AnnouncementsFilterOptionsResponse } from 'core/types/announcements.ts';

import prisma from '../db.ts';
import { Prisma } from '../generated/prisma/client.ts';
import { monthDateRange } from './date-range.ts';
import { toFilterOptions } from './filter-options.ts';
import type { announcementsAdminListQuerySchema } from '../schemas/announcements.ts';

type AnnouncementsFilterFacet = 'status' | 'categoryId';

export const announcementSelect = {
  id: true,
  title: true,
  excerpt: true,
  status: true,
  createdAt: true,
  category: { select: { id: true, name: true } },
  postedBy: { select: { name: true } },
} as const;

export interface BuildAnnouncementsWhereParams {
  query: z.infer<typeof announcementsAdminListQuerySchema>;
  excludeFacet?: AnnouncementsFilterFacet;
}

export function buildAnnouncementsWhere({ query, excludeFacet }: BuildAnnouncementsWhereParams): Prisma.AnnouncementWhereInput {
  return {
    ...(query.status && excludeFacet !== 'status' && { status: { in: query.status } }),
    ...(query.categoryId && excludeFacet !== 'categoryId' && { categoryId: { in: query.categoryId } }),
    ...(query.month && { createdAt: monthDateRange(query.month) }),
  };
}

export interface GetAnnouncementsFilterOptionsParams {
  query: z.infer<typeof announcementsAdminListQuerySchema>;
  includeStatuses?: boolean;
}

export async function getAnnouncementsFilterOptions({ query, includeStatuses = false }: GetAnnouncementsFilterOptionsParams): Promise<AnnouncementsFilterOptionsResponse> {
  const [statusCounts, categoryCounts] = await Promise.all([
    includeStatuses
      ? prisma.announcement.groupBy({
          by: ['status'],
          _count: { status: true },
          where: buildAnnouncementsWhere({ query, excludeFacet: 'status' }),
        })
      : null,
    prisma.announcement.groupBy({
      by: ['categoryId'],
      _count: { categoryId: true },
      where: buildAnnouncementsWhere({ query, excludeFacet: 'categoryId' }),
    }),
  ]);

  return {
    ...(statusCounts && { statuses: toFilterOptions(statusCounts.map((row) => [row.status, row._count.status])) }),
    categories: toFilterOptions(categoryCounts.map((row) => [String(row.categoryId), row._count.categoryId])),
  };
}
