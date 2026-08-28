import prisma from '../db.ts';
import { createCategoryRouter } from '../lib/category-router.ts';

export default createCategoryRouter({
  entityLabel: 'Location',
  resourceLabel: 'user',

  findMany: async () => {
    const locations = await prisma.location.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, createdAt: true, _count: { select: { users: true } } },
    });
    return locations.map(({ _count, ...location }) => ({ ...location, count: _count.users }));
  },

  findUnique: (id) => prisma.location.findUnique({ where: { id } }),

  isDuplicateName: async (name, excludeId) => {
    const existing = await prisma.location.findFirst({
      where: { name, ...(excludeId !== undefined && { NOT: { id: excludeId } }) },
      select: { id: true },
    });
    return existing !== null;
  },

  countUsage: (id) => prisma.user.count({ where: { locationId: id } }),

  create: async (name) => {
    await prisma.location.create({ data: { name } });
  },

  update: (id, name) => prisma.location.update({ where: { id }, data: { name } }),

  remove: async (id) => {
    await prisma.location.delete({ where: { id } });
  },
});
