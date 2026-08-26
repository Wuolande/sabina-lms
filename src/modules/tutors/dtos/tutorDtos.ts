import { z } from 'zod';

export const UpdateTutorProfileSchema = z.object({
  headline: z.string().min(3).optional(),
  bio: z.string().min(10).optional(),
  hourlyRate: z.number().positive().optional(),
  isFeatured: z.boolean().optional(),
  isSuperTutor: z.boolean().optional(),
});

export const SuspendTutorSchema = z.object({
  reason: z.string().min(5, 'A detailed suspension reason is required'),
});

export const FilterTutorsSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
  search: z.string().optional(),
  subject: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
