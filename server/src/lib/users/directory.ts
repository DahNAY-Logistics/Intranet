import type { z } from 'zod';

import type { DirectoryFilterOptionsResponse } from 'core/types/directory.ts';

import { Prisma, UserStatus } from '../../generated/prisma/client.ts';
import { getDepartmentFilterOptions, getDesignationFilterOptions, getLocationFilterOptions } from './user-lookup-filters.ts';
import { buildUserLocationFacetsWhere, buildUserSearchWhere } from './user-where.ts';
import type { directoryQuerySchema } from '../../schemas/directory.ts';

type DirectoryFilterFacet = 'department' | 'designation' | 'location';

export interface BuildDirectoryWhereParams {
  query: z.infer<typeof directoryQuerySchema>;
  excludeFacet?: DirectoryFilterFacet;
}

export function buildDirectoryWhere({ query, excludeFacet }: BuildDirectoryWhereParams): Prisma.UserWhereInput {
  return {
    status: UserStatus.Active,
    ...buildUserSearchWhere(query.search),
    ...buildUserLocationFacetsWhere(query, excludeFacet),
  };
}

export interface GetDirectoryFilterOptionsParams {
  query: z.infer<typeof directoryQuerySchema>;
}

export async function getDirectoryFilterOptions({ query }: GetDirectoryFilterOptionsParams): Promise<DirectoryFilterOptionsResponse> {
  const [departments, designations, locations] = await Promise.all([
    getDepartmentFilterOptions(buildDirectoryWhere({ query, excludeFacet: 'department' })),
    getDesignationFilterOptions(buildDirectoryWhere({ query, excludeFacet: 'designation' })),
    getLocationFilterOptions(buildDirectoryWhere({ query, excludeFacet: 'location' })),
  ]);

  return { departments, designations, locations };
}
