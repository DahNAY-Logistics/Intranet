import prisma from '../db.ts';
import { createCategoryRouter } from '../lib/category-router.ts';

export default createCategoryRouter({
  entityLabel: 'Department',
  resourceLabel: 'user',

  findMany: async () => {
    const departments = await prisma.department.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, createdAt: true, _count: { select: { users: true } } },
    });
    return departments.map(({ _count, ...department }) => ({ ...department, count: _count.users }));
  },

  findUnique: (id) => prisma.department.findUnique({ where: { id } }),

  isDuplicateName: async (name, excludeId) => {
    const existing = await prisma.department.findFirst({
      where: { name, ...(excludeId !== undefined && { NOT: { id: excludeId } }) },
      select: { id: true },
    });
    return existing !== null;
  },

  countUsage: (id) => prisma.user.count({ where: { departmentId: id } }),

  create: async (name) => {
    await prisma.department.create({ data: { name } });
  },

  update: (id, name) => prisma.department.update({ where: { id }, data: { name } }),

  remove: async (id) => {
    await prisma.department.delete({ where: { id } });
  },
});
