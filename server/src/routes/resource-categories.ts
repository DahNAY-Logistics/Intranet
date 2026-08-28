import prisma from '../db.ts';
import { createCategoryRouter } from '../lib/category-router.ts';

export default createCategoryRouter({
  entityLabel: 'Category',
  resourceLabel: 'resource',

  findMany: async () => {
    const categories = await prisma.resourceCategory.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, createdAt: true, _count: { select: { resources: true } } },
    });
    return categories.map(({ _count, ...category }) => ({ ...category, count: _count.resources }));
  },

  findUnique: (id) => prisma.resourceCategory.findUnique({ where: { id } }),

  isDuplicateName: async (name, excludeId) => {
    const existing = await prisma.resourceCategory.findFirst({
      where: { name, ...(excludeId !== undefined && { NOT: { id: excludeId } }) },
      select: { id: true },
    });
    return existing !== null;
  },

  countUsage: (id) => prisma.resource.count({ where: { categoryId: id } }),

  create: async (name) => {
    await prisma.resourceCategory.create({ data: { name } });
  },

  update: (id, name) => prisma.resourceCategory.update({ where: { id }, data: { name } }),

  remove: async (id) => {
    await prisma.resourceCategory.delete({ where: { id } });
  },
});
