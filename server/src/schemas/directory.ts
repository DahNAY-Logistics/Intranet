import { peopleQuerySchema, sortBySchema, sortOrderSchema } from './shared.ts';

export const directoryQuerySchema = peopleQuerySchema.extend({
  sortBy: sortBySchema(['employeeId', 'name', 'joinedDate'], 'employeeId'),

  sortOrder: sortOrderSchema('desc'),
});
