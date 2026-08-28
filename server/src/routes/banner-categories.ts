import prisma from '../db.ts';
import { createCategoryRouter } from '../lib/category-router.ts';

export default createCategoryRouter({
  entityLabel: 'Category',
  resourceLabel: 'banner',

  findMany: async () => {
    const categories = await prisma.bannerCategory.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, createdAt: true, _count: { select: { banners: true } } },
    });
    return categories.map(({ _count, ...category }) => ({ ...category, count: _count.banners }));
  },

  findUnique: (id) => prisma.bannerCategory.findUnique({ where: { id } }),

  isDuplicateName: async (name, excludeId) => {
    const existing = await prisma.bannerCategory.findFirst({
      where: { name, ...(excludeId !== undefined && { NOT: { id: excludeId } }) },
      select: { id: true },
    });
    return existing !== null;
  },

  countUsage: (id) => prisma.banner.count({ where: { categoryId: id } }),

  create: async (name) => {
    await prisma.bannerCategory.create({ data: { name } });
  },

  update: (id, name) => prisma.bannerCategory.update({ where: { id }, data: { name } }),

  remove: async (id) => {
    await prisma.bannerCategory.delete({ where: { id } });
  },
});
