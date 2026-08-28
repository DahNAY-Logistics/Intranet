import prisma from '../db.ts';
import { createCategoryRouter } from '../lib/category-router.ts';

export default createCategoryRouter({
  entityLabel: 'Category',
  resourceLabel: 'announcement',

  findMany: async () => {
    const categories = await prisma.announcementCategory.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, createdAt: true, _count: { select: { announcements: true } } },
    });
    return categories.map(({ _count, ...category }) => ({ ...category, count: _count.announcements }));
  },

  findUnique: (id) => prisma.announcementCategory.findUnique({ where: { id } }),

  isDuplicateName: async (name, excludeId) => {
    const existing = await prisma.announcementCategory.findFirst({
      where: { name, ...(excludeId !== undefined && { NOT: { id: excludeId } }) },
      select: { id: true },
    });
    return existing !== null;
  },

  countUsage: (id) => prisma.announcement.count({ where: { categoryId: id } }),

  create: async (name) => {
    await prisma.announcementCategory.create({ data: { name } });
  },

  update: (id, name) => prisma.announcementCategory.update({ where: { id }, data: { name } }),

  remove: async (id) => {
    await prisma.announcementCategory.delete({ where: { id } });
  },
});
