import prisma from '../db.ts';
import { BannerStatus } from '../generated/prisma/client.ts';
import type { Prisma } from '../generated/prisma/client.ts';

export const bannerSelect = {
  id: true,
  title: true,
  excerpt: true,
  status: true,
  displayOrder: true,
  startDate: true,
  endDate: true,
  createdAt: true,
  category: { select: { id: true, name: true } },
  postedBy: { select: { name: true } },
  attachment: { select: { id: true, url: true } },
} as const;

export async function getNextDisplayOrder(client: Prisma.TransactionClient | typeof prisma = prisma): Promise<number> {
  const result = await client.banner.aggregate({
    where: { status: BannerStatus.Published },
    _max: { displayOrder: true },
  });

  return (result._max.displayOrder ?? 0) + 1;
}
