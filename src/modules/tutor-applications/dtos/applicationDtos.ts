import { z } from 'zod';

export const ReviewApplicationSchema = z.object({
  notes: z.string().optional(),
});

export const ApproveApplicationSchema = z.object({
  approvalNotes: z.string().optional(),
  hourlyRate: z.number().positive().optional(),
});

export const RejectApplicationSchema = z.object({
  rejectionReason: z.string().min(5, 'Rejection reason must be at least 5 characters'),
});

export const RequestChangesSchema = z.object({
  requestedChanges: z.string().min(5, 'Requested changes description must be at least 5 characters'),
});

export const FilterApplicationsSchema = z.object({
  status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REQUESTED_CHANGES', 'RESUBMITTED', 'REJECTED', 'APPROVED', 'ONBOARDING', 'ACTIVE']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
