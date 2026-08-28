import type { z } from 'zod';

import { userMessages, categoryMessages } from 'core/messages.ts';
import type { UsersFilterOptionsResponse } from 'core/types/users.ts';

import prisma from 'src/db.ts';
import { Prisma } from '../../generated/prisma/client.ts';
import { toFilterOptions } from '../filter-options.ts';
import { getDepartmentFilterOptions, getDesignationFilterOptions, getLocationFilterOptions } from './user-lookup-filters.ts';
import { buildUserLocationFacetsWhere, buildUserSearchWhere } from './user-where.ts';
import type { usersQuerySchema } from '../../schemas/users.ts';

export interface FindConflictFieldsParams {
  email: string;
  employeeId: string;
  excludeId?: string;
}

export async function findConflictFields({ email, employeeId, excludeId }: FindConflictFieldsParams) {
  const conflict = await prisma.user.findFirst({
    where: { OR: [{ email }, { employeeId }], ...(excludeId && { NOT: { id: excludeId } }) },
    select: { email: true, employeeId: true },
  });

  if (!conflict) return false;

  return true;
}

export async function getReportingDescendantIds(userId: string): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ descendant_id: string }[]>`
    SELECT * FROM get_reporting_descendants(${userId})
  `;

  return rows.map((row) => row.descendant_id);
}

export interface ValidateUserReferencesParams {
  departmentId: number;
  designationId: number;
  locationId: number;
  reportedToId: string | null;
  selfId?: string;
}

export async function validateUserReferences({ departmentId, designationId, locationId, reportedToId, selfId }: ValidateUserReferencesParams) {
  if (selfId !== undefined && reportedToId === selfId) {
    return userMessages.CANNOT_REPORT_TO_SELF;
  }

  const [department, designation, location, manager] = await Promise.all([
    prisma.department.findUnique({ where: { id: departmentId }, select: { id: true } }),
    prisma.designation.findUnique({ where: { id: designationId }, select: { id: true } }),
    prisma.location.findUnique({ where: { id: locationId }, select: { id: true } }),
    reportedToId ? prisma.user.findUnique({ where: { id: reportedToId }, select: { id: true } }) : null,
  ]);

  if (!department) return categoryMessages.NOT_FOUND('Department');
  if (!designation) return categoryMessages.NOT_FOUND('Designation');
  if (!location) return categoryMessages.NOT_FOUND('Location');
  if (reportedToId && !manager) return userMessages.INVALID_REPORTED_TO;

  if (selfId !== undefined && reportedToId) {
    const descendantIds = await getReportingDescendantIds(selfId);
    if (descendantIds.includes(reportedToId)) return userMessages.CANNOT_REPORT_TO_OWN_DESCENDANT;
  }

  return null;
}

export interface GetUsersFilterOptionsParams {
  query: z.infer<typeof usersQuerySchema>;
}

export interface BuildUsersWhereParams extends GetUsersFilterOptionsParams {
  excludeFacet?: 'role' | 'department' | 'designation' | 'location';
}

export function buildUsersWhere({ query, excludeFacet }: BuildUsersWhereParams): Prisma.UserWhereInput {
  return {
    ...buildUserSearchWhere(query.search),
    ...buildUserLocationFacetsWhere(query, excludeFacet),
    status: query.status,
    ...(query.role && excludeFacet !== 'role' && { role: { in: query.role } }),
  };
}

export async function getUsersFilterOptions({ query }: GetUsersFilterOptionsParams): Promise<UsersFilterOptionsResponse> {
  const [roleCounts, departments, designations, locations] = await Promise.all([
    prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
      where: buildUsersWhere({ query, excludeFacet: 'role' }),
    }),
    getDepartmentFilterOptions(buildUsersWhere({ query, excludeFacet: 'department' })),
    getDesignationFilterOptions(buildUsersWhere({ query, excludeFacet: 'designation' })),
    getLocationFilterOptions(buildUsersWhere({ query, excludeFacet: 'location' })),
  ]);

  return {
    roles: toFilterOptions(roleCounts.map((row) => [row.role, row._count.role])),
    departments,
    designations,
    locations,
  };
}
