import prisma from '../../db.ts';
import type { Prisma } from '../../generated/prisma/client.ts';

export interface LookupFilterOption {
  value: string;
  count: number;
  label: string;
}

async function toLookupFilterOptions(
  counts: { id: number | null; count: number }[],
  findLabels: (ids: number[]) => Promise<{ id: number; name: string }[]>,
): Promise<LookupFilterOption[]> {
  const known = counts.filter((row): row is { id: number; count: number } => row.id !== null);
  const lookups = await findLabels(known.map((row) => row.id));

  return known
    .map((row) => ({
      value: String(row.id),
      count: row.count,
      label: lookups.find((lookup) => lookup.id === row.id)?.name ?? '',
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export async function getDepartmentFilterOptions(where: Prisma.UserWhereInput): Promise<LookupFilterOption[]> {
  const counts = await prisma.user.groupBy({
    by: ['departmentId'],
    _count: { departmentId: true },
    where: { ...where, departmentId: { not: null } },
  });

  return toLookupFilterOptions(
    counts.map((row) => ({ id: row.departmentId, count: row._count.departmentId })),
    (ids) => prisma.department.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
  );
}

export async function getDesignationFilterOptions(where: Prisma.UserWhereInput): Promise<LookupFilterOption[]> {
  const counts = await prisma.user.groupBy({
    by: ['designationId'],
    _count: { designationId: true },
    where: { ...where, designationId: { not: null } },
  });

  return toLookupFilterOptions(
    counts.map((row) => ({ id: row.designationId, count: row._count.designationId })),
    (ids) => prisma.designation.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
  );
}

export async function getLocationFilterOptions(where: Prisma.UserWhereInput): Promise<LookupFilterOption[]> {
  const counts = await prisma.user.groupBy({
    by: ['locationId'],
    _count: { locationId: true },
    where: { ...where, locationId: { not: null } },
  });

  return toLookupFilterOptions(
    counts.map((row) => ({ id: row.locationId, count: row._count.locationId })),
    (ids) => prisma.location.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
  );
}
