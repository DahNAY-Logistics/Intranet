import { randomUUID } from 'node:crypto';

import { Router } from 'express';
import type { Request, Response } from 'express';

import { commonMessages, userMessages } from 'core/messages.ts';
import type { ErrorResponse, MessageResponse, Serializable } from 'core/types/common.ts';
import type { UserDetail, UsersLookupResponse, UsersResponse } from 'core/types/users.ts';

import prisma from 'src/db.ts';
import { Role, UserStatus } from '../generated/prisma/client.ts';
import { requireAuth } from 'src/middleware/require-auth.ts';
import { requireAdmin } from '../middleware/require-admin.ts';
import { validate } from '../lib/validate.ts';
import { buildUsersWhere, findConflictFields, getReportingDescendantIds, getUsersFilterOptions, validateUserReferences } from '../lib/users/users.ts';
import { userIdParamSchema, usersCreateSchema, usersLookupQuerySchema, usersQuerySchema, usersStatusUpdateSchema, usersUpdateSchema } from '../schemas/users.ts';

const router = Router();

router.get("/", requireAuth, requireAdmin, async (req: Request, res: Response<Serializable<UsersResponse> | ErrorResponse>) => {
  const query = validate(usersQuerySchema, req.query, res);
  if (!query)
    return res.status(400).json({ error: commonMessages.INVALID_QUERY });

  const [users, totalCount, filterOptions] = await Promise.all([
    prisma.user.findMany({
      where: buildUsersWhere({ query }),
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        role: true,
        status: true,
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
        joinedDate: true,
      },
      orderBy: {
        [query.sortBy]: query.sortOrder,
      },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.user.count({
      where: buildUsersWhere({ query }),
    }),
    getUsersFilterOptions({ query }),
  ]);

  res.json({
    users,
    page: query.page,
    pageSize: query.pageSize,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / query.pageSize)),
    filterOptions,
  });
});

router.post('/', requireAuth, requireAdmin, async (req: Request, res: Response<MessageResponse | ErrorResponse>) => {
  const body = validate(usersCreateSchema, req.body, res);
  if (!body) return res.status(400).json({ error: commonMessages.INVALID_BODY });

  const conflictFields = await findConflictFields({ email: body.email, employeeId: body.employeeId });
  if (conflictFields) {
    res.status(400).json({ error: userMessages.DUPLICATE_FIELD });
    return;
  }

  const referenceError = await validateUserReferences(body);
  if (referenceError) {
    res.status(400).json({ error: referenceError });
    return;
  }

  const user = await prisma.user.create({
    data: { id: randomUUID(), ...body },
    select: { name: true },
  });

  res.status(201).json({ message: userMessages.CREATED(user.name) });
});

const USERS_LOOKUP_LIMIT = 500;

router.get('/lookup', requireAuth, requireAdmin, async (req: Request, res: Response<Serializable<UsersLookupResponse> | ErrorResponse>) => {
  const query = validate(usersLookupQuerySchema, req.query, res);
  if (!query) return res.status(400).json({ error: commonMessages.INVALID_QUERY });

  const excludeIds = query.excludeId
    ? [query.excludeId, ...(await getReportingDescendantIds(query.excludeId))]
    : [];

  const users = await prisma.user.findMany({
    where: { status: UserStatus.Active, ...(excludeIds.length > 0 && { id: { notIn: excludeIds } }) },
    select: { id: true, name: true, employeeId: true },
    orderBy: { name: 'asc' },
    take: USERS_LOOKUP_LIMIT,
  });

  res.json({ users });
});

router.get('/:id', requireAuth, requireAdmin, async (req: Request<{ id: string }>, res: Response<Serializable<UserDetail> | ErrorResponse>) => {
  const params = validate(userIdParamSchema, req.params, res);
  if (!params) return res.status(400).json({ error: commonMessages.INVALID_QUERY });

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      employeeId: true,
      name: true,
      email: true,
      role: true,
      status: true,
      department: { select: { id: true, name: true } },
      designation: { select: { id: true, name: true } },
      location: { select: { id: true, name: true } },
      dob: true,
      joinedDate: true,
      reportedTo: { select: { id: true, name: true } },
    },
  });
  if (!user) {
    return res.status(404).json({ error: userMessages.NOT_FOUND });
  }

  res.json(user);
});

router.put('/:id', requireAuth, requireAdmin, async (req: Request<{ id: string }>, res: Response<MessageResponse | ErrorResponse>) => {
  const params = validate(userIdParamSchema, req.params, res);
  if (!params) return res.status(400).json({ error: commonMessages.INVALID_QUERY });

  const body = validate(usersUpdateSchema, req.body, res);
  if (!body) return res.status(400).json({ error: commonMessages.INVALID_BODY });

  const conflictFields = await findConflictFields({ email: body.email, employeeId: body.employeeId, excludeId: params.id });
  if (conflictFields) {
    return res.status(400).json({ error: userMessages.DUPLICATE_FIELD });
  }

  const referenceError = await validateUserReferences({ ...body, selfId: params.id });
  if (referenceError) {
    return res.status(400).json({ error: referenceError });
  }

  const user = await prisma.$transaction(async (tx) => {
    if (body.role !== Role.Admin) {
      const existing = await tx.user.findUnique({ where: { id: params.id }, select: { role: true } });
      if (existing?.role === Role.Admin) {
        const adminCount = await tx.user.count({ where: { role: Role.Admin } });
        if (adminCount === 1) return null;
      }
    }
    return tx.user.update({
      where: { id: params.id },
      data: body,
    });
  });

  if (!user) {
    return res.status(400).json({ error: userMessages.LAST_ADMIN });
  }

  res.json({ message: userMessages.UPDATED(user.name) });
});

router.patch('/deactivate', requireAuth, requireAdmin, async (req: Request, res: Response<MessageResponse | ErrorResponse>) => {
  const body = validate(usersStatusUpdateSchema, req.body, res);
  if (!body) return res.status(400).json({ error: commonMessages.INVALID_BODY });

  const { protectedAdminNames } = await prisma.$transaction(async (tx) => {
    const adminMatches = await tx.user.findMany({
      where: { id: { in: body.ids }, role: Role.Admin },
      select: { name: true },
    });

    if (adminMatches.length > 0) {
      return { protectedAdminNames: adminMatches.map((user) => user.name) };
    }

    await tx.user.updateMany({
      where: { id: { in: body.ids }, role: { not: Role.Admin } },
      data: { status: UserStatus.Inactive },
    });

    await tx.session.deleteMany({ where: { userId: { in: body.ids } } });

    return { protectedAdminNames: [] as string[] };
  });

  if (protectedAdminNames.length > 0) {
    return res.status(403).json({ error: userMessages.CANNOT_DEACTIVATE_ADMIN(protectedAdminNames) });
  }

  res.json({ message: userMessages.DEACTIVATED(body.ids.length) });
});

router.patch('/reactivate', requireAuth, requireAdmin, async (req: Request, res: Response<MessageResponse | ErrorResponse>) => {
  const body = validate(usersStatusUpdateSchema, req.body, res);
  if (!body) return res.status(400).json({ error: commonMessages.INVALID_BODY });

  await prisma.user.updateMany({
    where: { id: { in: body.ids } },
    data: { status: UserStatus.Active },
  });

  res.json({ message: userMessages.REACTIVATED(body.ids.length) });
});

export default router;
