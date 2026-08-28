import prisma from '../db.ts';
import { createCategoryRouter } from '../lib/category-router.ts';

export default createCategoryRouter({
  entityLabel: 'Category',
  resourceLabel: 'quick link',

  findMany: async () => {
    const categories = await prisma.quickLinkCategory.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, createdAt: true, _count: { select: { quickLinks: true } } },
    });
    return categories.map(({ _count, ...category }) => ({ ...category, count: _count.quickLinks }));
  },

  findUnique: (id) => prisma.quickLinkCategory.findUnique({ where: { id } }),

  isDuplicateName: async (name, excludeId) => {
    const existing = await prisma.quickLinkCategory.findFirst({
      where: { name, ...(excludeId !== undefined && { NOT: { id: excludeId } }) },
      select: { id: true },
    });
    return existing !== null;
  },

  countUsage: (id) => prisma.quickLink.count({ where: { categoryId: id } }),

  create: async (name) => {
    await prisma.quickLinkCategory.create({ data: { name } });
  },

  update: (id, name) => prisma.quickLinkCategory.update({ where: { id }, data: { name } }),

  remove: async (id) => {
    await prisma.quickLinkCategory.delete({ where: { id } });
  },
});
