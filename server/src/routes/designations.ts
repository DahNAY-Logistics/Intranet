import prisma from '../db.ts';
import { createCategoryRouter } from '../lib/category-router.ts';

export default createCategoryRouter({
  entityLabel: 'Designation',
  resourceLabel: 'user',

  findMany: async () => {
    const designations = await prisma.designation.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, createdAt: true, _count: { select: { users: true } } },
    });
    return designations.map(({ _count, ...designation }) => ({ ...designation, count: _count.users }));
  },

  findUnique: (id) => prisma.designation.findUnique({ where: { id } }),

  isDuplicateName: async (name, excludeId) => {
    const existing = await prisma.designation.findFirst({
      where: { name, ...(excludeId !== undefined && { NOT: { id: excludeId } }) },
      select: { id: true },
    });
    return existing !== null;
  },

  countUsage: (id) => prisma.user.count({ where: { designationId: id } }),

  create: async (name) => {
    await prisma.designation.create({ data: { name } });
  },

  update: (id, name) => prisma.designation.update({ where: { id }, data: { name } }),

  remove: async (id) => {
    await prisma.designation.delete({ where: { id } });
  },
});
