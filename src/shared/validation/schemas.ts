import { z } from 'zod';

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const UuidParamSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
});

export const EntityIdParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
