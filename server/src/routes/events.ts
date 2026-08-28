import { Router } from 'express';
import type { Request, Response } from 'express';

import { categoryMessages, eventMessages } from 'core/messages.ts';
import { createEventSchema, updateEventSchema } from 'core/schemas/events.ts';
import type { ErrorResponse, MessageResponse, Serializable } from 'core/types/common.ts';
import type { EventDetailResponse, EventsActiveResponse, EventsResponse } from 'core/types/events.ts';

import prisma from '../db.ts';
import { EventStatus, Role } from '../generated/prisma/client.ts';
import { requireAuth } from 'src/middleware/require-auth.ts';
import { requireAdmin } from '../middleware/require-admin.ts';
import { validate } from '../lib/validate.ts';
import { auth } from '../lib/auth/auth.ts';
import { buildEventsWhere, eventSelect, getEventsFilterOptions } from '../lib/events/events.ts';
import { createZohoCalendarEvent, getDefaultZohoCalendarUid } from '../lib/events/zoho-calendar.ts';
import {
  eventIdParamSchema,
  eventsAdminListQuerySchema,
  eventsListQuerySchema,
} from '../schemas/events.ts';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response<Serializable<EventsResponse> | ErrorResponse>) => {
  const isAdmin = req.user.role === Role.Admin;

  const query = validate(isAdmin ? eventsAdminListQuerySchema : eventsListQuerySchema, req.query, res);
  if (!query) return res.status(400).json({ error: eventMessages.INVALID_QUERY });

  const where = {
    ...buildEventsWhere({ query }),
    ...(!isAdmin && { status: EventStatus.Published }),
  };

  const [events, totalCount, filterOptions] = await Promise.all([
    prisma.event.findMany({
      where,
      select: eventSelect,
      orderBy: { createdAt: query.sortOrder },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.event.count({ where }),
    getEventsFilterOptions({ query, includeStatuses: isAdmin }),
  ]);

  res.json({ events, page: query.page, pageSize: query.pageSize, totalCount, totalPages: Math.max(1, Math.ceil(totalCount / query.pageSize)), filterOptions });
});

router.get('/active', requireAuth, async (req: Request, res: Response<Serializable<EventsActiveResponse> | ErrorResponse>) => {
  const query = validate(eventsListQuerySchema, req.query, res);
  if (!query) return res.status(400).json({ error: eventMessages.INVALID_QUERY });

  const where = { ...buildEventsWhere({ query }), status: EventStatus.Published };

  const events = await prisma.event.findMany({
    where,
    select: eventSelect,
    orderBy: { startDate: query.sortOrder },
  });

  res.json({ events });
});

router.get('/:id', requireAuth, async (req: Request<{ id: string }>, res: Response<Serializable<EventDetailResponse> | ErrorResponse>) => {
  const params = validate(eventIdParamSchema, req.params, res);
  if (!params) return res.status(400).json({ error: eventMessages.INVALID_PARAMS });

  const event = await prisma.event.findUnique({ where: { id: params.id }, select: eventSelect });
  if (!event || (req.user.role !== Role.Admin && event.status !== EventStatus.Published)) {
    return res.status(404).json({ error: eventMessages.NOT_FOUND });
  }

  res.json({ event });
});

router.post('/:id/calendar', requireAuth, async (req: Request<{ id: string }>, res: Response<MessageResponse | ErrorResponse>) => {
  const params = validate(eventIdParamSchema, req.params, res);
  if (!params) return res.status(400).json({ error: eventMessages.INVALID_PARAMS });

  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event || (req.user.role !== Role.Admin && event.status !== EventStatus.Published)) {
    return res.status(404).json({ error: eventMessages.NOT_FOUND });
  }

  if (event.endDate.getTime() < Date.now()) {
    return res.status(409).json({ error: eventMessages.ENDED });
  }

  try {
    const { accessToken } = await auth.api.getAccessToken({ body: { providerId: 'zoho', userId: req.user.id } });
    const calendarUid = await getDefaultZohoCalendarUid(accessToken);

    await createZohoCalendarEvent(accessToken, calendarUid, {
      title: event.title,
      description: event.excerpt,
      location: event.location,
      startDate: event.startDate,
      endDate: event.endDate,
    });
  } catch {
    return res.status(409).json({ error: eventMessages.ZOHO_CALENDAR_NOT_CONNECTED });
  }

  res.status(201).json({ message: eventMessages.ADDED_TO_CALENDAR(event.title) });
});

router.post('/', requireAuth, requireAdmin, async (req: Request, res: Response<MessageResponse | ErrorResponse>) => {
  const body = validate(createEventSchema, req.body, res);
  if (!body) return res.status(400).json({ error: eventMessages.INVALID_BODY });

  const category = await prisma.eventCategory.findUnique({ where: { id: body.categoryId } });
  if (!category) {
    return res.status(400).json({ error: categoryMessages.NOT_FOUND('Category') });
  }

  const event = await prisma.event.create({
    data: {
      title: body.title,
      excerpt: body.excerpt,
      status: body.status,
      mode: body.mode,
      location: body.location,
      startDate: body.startDate,
      endDate: body.endDate,
      categoryId: body.categoryId,
      postedById: req.user.id,
    },
    select: eventSelect,
  });

  res.status(201).json({ message: eventMessages.CREATED(event.title) });
});

router.put('/:id', requireAuth, requireAdmin, async (req: Request<{ id: string }>, res: Response<MessageResponse | ErrorResponse>) => {
  const params = validate(eventIdParamSchema, req.params, res);
  if (!params) return res.status(400).json({ error: eventMessages.INVALID_PARAMS });

  const body = validate(updateEventSchema, req.body, res);
  if (!body) return res.status(400).json({ error: eventMessages.INVALID_BODY });

  const existing = await prisma.event.findUnique({ where: { id: params.id } });
  if (!existing) {
    return res.status(404).json({ error: eventMessages.NOT_FOUND });
  }

  if (body.categoryId !== existing.categoryId) {
    const category = await prisma.eventCategory.findUnique({ where: { id: body.categoryId } });
    if (!category) {
      return res.status(400).json({ error: categoryMessages.NOT_FOUND('Category') });
    }
  }

  const event = await prisma.event.update({
    where: { id: params.id },
    data: {
      title: body.title,
      excerpt: body.excerpt,
      status: body.status,
      mode: body.mode,
      location: body.location,
      startDate: body.startDate,
      endDate: body.endDate,
      categoryId: body.categoryId,
    },
    select: eventSelect,
  });

  res.json({ message: eventMessages.UPDATED(event.title) });
});

router.delete('/:id', requireAuth, requireAdmin, async (req: Request<{ id: string }>, res: Response<MessageResponse | ErrorResponse>) => {
  const params = validate(eventIdParamSchema, req.params, res);
  if (!params) return res.status(400).json({ error: eventMessages.INVALID_PARAMS });

  const existing = await prisma.event.findUnique({ where: { id: params.id } });
  if (!existing) {
    return res.status(404).json({ error: eventMessages.NOT_FOUND });
  }

  await prisma.event.delete({ where: { id: params.id } });

  res.json({ message: eventMessages.DELETED(existing.title) });
});

export default router;
