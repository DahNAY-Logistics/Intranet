import type { z } from 'zod';

import type { EventsFilterOptionsResponse } from 'core/types/events.ts';

import prisma from '../../db.ts';
import { Prisma } from '../../generated/prisma/client.ts';
import { monthDateRange } from '../date-range.ts';
import { toFilterOptions } from '../filter-options.ts';
import type { eventsAdminListQuerySchema } from '../../schemas/events.ts';

type EventsFilterFacet = 'status' | 'categoryId' | 'mode';

export const eventSelect = {
  id: true,
  title: true,
  excerpt: true,
  status: true,
  mode: true,
  location: true,
  startDate: true,
  endDate: true,
  createdAt: true,
  category: { select: { id: true, name: true } },
  postedBy: { select: { name: true } },
} as const;

export interface BuildEventsWhereParams {
  query: z.infer<typeof eventsAdminListQuerySchema>;
  excludeFacet?: EventsFilterFacet;
}

export function buildEventsWhere({ query, excludeFacet }: BuildEventsWhereParams): Prisma.EventWhereInput {
  return {
    ...(query.status && excludeFacet !== 'status' && { status: { in: query.status } }),
    ...(query.categoryId && excludeFacet !== 'categoryId' && { categoryId: { in: query.categoryId } }),
    ...(query.mode && excludeFacet !== 'mode' && { mode: { in: query.mode } }),
    ...(query.month && { startDate: monthDateRange(query.month) }),
  };
}

export interface GetEventsFilterOptionsParams {
  query: z.infer<typeof eventsAdminListQuerySchema>;
  includeStatuses?: boolean;
}

export async function getEventsFilterOptions({ query, includeStatuses = false }: GetEventsFilterOptionsParams): Promise<EventsFilterOptionsResponse> {
  const [statusCounts, categoryCounts, modeCounts] = await Promise.all([
    includeStatuses
      ? prisma.event.groupBy({
          by: ['status'],
          _count: { status: true },
          where: buildEventsWhere({ query, excludeFacet: 'status' }),
        })
      : null,
    prisma.event.groupBy({
      by: ['categoryId'],
      _count: { categoryId: true },
      where: buildEventsWhere({ query, excludeFacet: 'categoryId' }),
    }),
    prisma.event.groupBy({
      by: ['mode'],
      _count: { mode: true },
      where: buildEventsWhere({ query, excludeFacet: 'mode' }),
    }),
  ]);

  return {
    ...(statusCounts && { statuses: toFilterOptions(statusCounts.map((row) => [row.status, row._count.status])) }),
    categories: toFilterOptions(categoryCounts.map((row) => [String(row.categoryId), row._count.categoryId])),
    modes: toFilterOptions(modeCounts.map((row) => [row.mode, row._count.mode])),
  };
}
