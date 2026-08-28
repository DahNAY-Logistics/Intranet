import prisma from '../db.ts';
import { createCategoryRouter } from '../lib/category-router.ts';

export default createCategoryRouter({
  entityLabel: 'Category',
  resourceLabel: 'event',

  findMany: async () => {
    const categories = await prisma.eventCategory.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, createdAt: true, _count: { select: { events: true } } },
    });
    return categories.map(({ _count, ...category }) => ({ ...category, count: _count.events }));
  },

  findUnique: (id) => prisma.eventCategory.findUnique({ where: { id } }),

  isDuplicateName: async (name, excludeId) => {
    const existing = await prisma.eventCategory.findFirst({
      where: { name, ...(excludeId !== undefined && { NOT: { id: excludeId } }) },
      select: { id: true },
    });
    return existing !== null;
  },

  countUsage: (id) => prisma.event.count({ where: { categoryId: id } }),

  create: async (name) => {
    await prisma.eventCategory.create({ data: { name } });
  },

  update: (id, name) => prisma.eventCategory.update({ where: { id }, data: { name } }),

  remove: async (id) => {
    await prisma.eventCategory.delete({ where: { id } });
  },
});
