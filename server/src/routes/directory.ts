import { Router } from 'express';
import type { Request, Response } from 'express';

import { commonMessages } from 'core/messages.ts';
import type { ErrorResponse, Serializable } from 'core/types/common.ts';
import type { DirectoryResponse } from 'core/types/directory.ts';

import prisma from '../db.ts';
import { requireAuth } from 'src/middleware/require-auth.ts';
import { validate } from '../lib/validate.ts';
import { buildDirectoryWhere, getDirectoryFilterOptions } from '../lib/users/directory.ts';
import { directoryQuerySchema } from '../schemas/directory.ts';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response<Serializable<DirectoryResponse> | ErrorResponse>) => {
  const query = validate(directoryQuerySchema, req.query, res);
  if (!query) return res.status(400).json({ error: commonMessages.INVALID_QUERY });

  const where = buildDirectoryWhere({ query });

  const [entries, totalCount, filterOptions] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        employeeId: true,
        reportedTo: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
        joinedDate: true,
      },
      orderBy: { [query.sortBy]: query.sortOrder },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.user.count({ where }),
    getDirectoryFilterOptions({ query }),
  ]);

  res.json({ entries, page: query.page, pageSize: query.pageSize, totalCount, totalPages: Math.max(1, Math.ceil(totalCount / query.pageSize)), filterOptions });
});

export default router;
