import type { Prisma } from '../../generated/prisma/client.ts';

export function buildUserSearchWhere(search?: string): Prisma.UserWhereInput {
  if (!search) return {};

  return {
    OR: [
      { name: { contains: search, mode: 'insensitive' as const } },
      { email: { contains: search, mode: 'insensitive' as const } },
      { employeeId: { contains: search, mode: 'insensitive' as const } },
    ],
  };
}

export interface LocationFacetsQuery {
  department?: number[];
  designation?: number[];
  location?: number[];
}

export function buildUserLocationFacetsWhere(query: LocationFacetsQuery, excludeFacet?: string): Prisma.UserWhereInput {
  return {
    ...(query.department && excludeFacet !== 'department' && { departmentId: { in: query.department } }),
    ...(query.designation && excludeFacet !== 'designation' && { designationId: { in: query.designation } }),
    ...(query.location && excludeFacet !== 'location' && { locationId: { in: query.location } }),
  };
}
