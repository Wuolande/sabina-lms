/**
 * Tutor Application Repository
 * -----------------------------------------------------------------------
 * All data access for tutor_applications and related tables.
 * Uses adminSupabase (service role) for all queries — bypasses RLS.
 *
 * Tables queried:
 *   public.tutor_applications            (migration 003)
 *   public.tutor_application_documents   (migration 003)
 *   public.tutor_application_education   (migration 003)
 *   public.tutor_application_experience  (migration 003)
 *   public.tutor_application_subjects    (migration 003)
 *   public.tutor_application_languages   (migration 003)
 *   public.users                         (migration 001)
 *
 * Migration note: All column mappings use snake_case DB columns → camelCase TS.
 * When migrating to a new Supabase project, only the .env.local keys need to change.
 * -----------------------------------------------------------------------
 */

import { adminSupabase } from '@/src/shared/database/supabase';
import {
  TutorApplication,
  ApplicationStatus,
  ApplicationDocument,
  ApplicationEducation,
  ApplicationExperience,
  ApplicationSubject,
  ApplicationLanguage,
} from '../domain/types';

export interface ListApplicationsResult {
  data: TutorApplication[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  statusCounts?: Record<string, number>;
}

export class TutorApplicationRepository {
  /**
   * List applications with pagination, status filter, and search.
   * Includes applicant user data for display in the admin table.
   */
  async findAll(options: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    submittedFrom?: string;
    submittedTo?: string;
  }): Promise<ListApplicationsResult> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(options.limit || 20, 100);
    const offset = (page - 1) * limit;

    let query = adminSupabase
      .from('tutor_applications')
      .select(
        `
        id, status, headline, bio, years_experience, hourly_rate, currency,
        teaching_style, intro_video_url, rejection_reason, requested_changes,
        approval_notes, submitted_at, created_at, updated_at,
        applicant:users!applicant_user_id(
          id, email, display_name, avatar_url, country, phone, timezone
        )
      `,
        { count: 'exact' }
      );

    if (options.status) {
      query = query.eq('status', options.status);
    }
    if (options.submittedFrom) {
      query = query.gte('submitted_at', options.submittedFrom);
    }
    if (options.submittedTo) {
      query = query.lte('submitted_at', options.submittedTo);
    }

    // Full-text search across headline + applicant display_name
    if (options.search) {
      const q = options.search.trim();
      query = query.or(`headline.ilike.%${q}%,bio.ilike.%${q}%`);
    }

    const { data, count, error } = await query
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`[TutorApplicationRepository.findAll] ${error.message}`);
    }

    const mapped: TutorApplication[] = (data || []).map((d: any) =>
      this.mapListRow(d)
    );

    return {
      data: mapped,
      total: count || 0,
      page,
      limit,
      hasMore: offset + limit < (count || 0),
    };
  }

  /**
   * Get a single application with ALL related data:
   * documents, education, experience, subjects, languages.
   */
  async findById(id: string): Promise<TutorApplication | null> {
    const { data, error } = await adminSupabase
      .from('tutor_applications')
      .select(
        `
        *,
        applicant:users!applicant_user_id(
          id, email, display_name, avatar_url, country, phone, timezone, created_at
        ),
        reviewer:users!reviewer_user_id(id, display_name, email),
        documents:tutor_application_documents(*),
        education:tutor_application_education(*),
        experience:tutor_application_experience(*),
        subjects:tutor_application_subjects(
          *,
          subject:subjects(id, name, slug, category)
        ),
        languages:tutor_application_languages(
          *,
          language:languages(id, name, code, native_name)
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`[TutorApplicationRepository.findById] ${error.message}`);
    }
    if (!data) return null;

    return this.mapFullRow(data);
  }

  /**
   * Update application fields.
   * Only updates the columns that are passed — null values are explicit clears.
   */
  async update(
    id: string,
    updates: {
      status?: ApplicationStatus;
      rejectionReason?: string | null;
      requestedChanges?: string | null;
      approvalNotes?: string | null;
      reviewerUserId?: string | null;
      reviewedAt?: string | null;
      submittedAt?: string | null;
    }
  ): Promise<TutorApplication | null> {
    const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };

    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.rejectionReason !== undefined) dbUpdates.rejection_reason = updates.rejectionReason;
    if (updates.requestedChanges !== undefined) dbUpdates.requested_changes = updates.requestedChanges;
    if (updates.approvalNotes !== undefined) dbUpdates.approval_notes = updates.approvalNotes;
    if (updates.reviewerUserId !== undefined) dbUpdates.reviewer_user_id = updates.reviewerUserId;
    if (updates.reviewedAt !== undefined) dbUpdates.reviewed_at = updates.reviewedAt;
    if (updates.submittedAt !== undefined) dbUpdates.submitted_at = updates.submittedAt;

    const { error } = await adminSupabase
      .from('tutor_applications')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      throw new Error(`[TutorApplicationRepository.update] ${error.message}`);
    }

    return this.findById(id);
  }

  /**
   * Add a verification document to an application.
   * Called after a Cloudinary upload completes.
   */
  async addDocument(
    applicationId: string,
    dto: {
      documentType: string;
      title: string;
      fileUrl: string;
      fileAssetId?: string;
    }
  ): Promise<ApplicationDocument> {
    const { data, error } = await adminSupabase
      .from('tutor_application_documents')
      .insert({
        application_id: applicationId,
        document_type: dto.documentType,
        title: dto.title,
        file_url: dto.fileUrl,
        file_asset_id: dto.fileAssetId || null,
        verification_status: 'PENDING',
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`[TutorApplicationRepository.addDocument] ${error.message}`);
    }

    return this.mapDocument(data);
  }

  /**
   * Verify or reject a specific document.
   */
  async verifyDocument(
    documentId: string,
    adminId: string,
    status: 'VERIFIED' | 'REJECTED',
    notes?: string
  ): Promise<ApplicationDocument> {
    const { data, error } = await adminSupabase
      .from('tutor_application_documents')
      .update({
        verification_status: status,
        verified_by: adminId,
        verified_at: new Date().toISOString(),
        notes: notes || null,
      })
      .eq('id', documentId)
      .select('*')
      .single();

    if (error) {
      throw new Error(`[TutorApplicationRepository.verifyDocument] ${error.message}`);
    }

    return this.mapDocument(data);
  }

  /**
   * Count applications by status — used for admin dashboard widget.
   * Calls the get_application_status_counts() PostgreSQL function (migration 007).
   */
  async countByStatus(): Promise<Record<string, number>> {
    const { data, error } = await adminSupabase.rpc('get_application_status_counts');
    if (error) {
      console.warn('[TutorApplicationRepository.countByStatus]', error.message);
      return {};
    }
    return (data as Record<string, number>) || {};
  }

  // ─── Private mappers ──────────────────────────────────────────────────────

  private mapListRow(d: any): TutorApplication {
    const applicant = d.applicant || {};
    return {
      id: d.id,
      applicantUserId: d.applicant_user_id || applicant.id,
      applicantName: applicant.display_name || 'Applicant',
      applicantEmail: applicant.email || '',
      applicantAvatar: applicant.avatar_url || undefined,
      status: d.status,
      headline: d.headline || '',
      bio: d.bio || '',
      yearsExperience: d.years_experience || 0,
      hourlyRate: Number(d.hourly_rate) || 0,
      currency: d.currency || 'USD',
      teachingStyle: d.teaching_style || undefined,
      introVideoUrl: d.intro_video_url || undefined,
      subjects: [],
      languages: [],
      education: [],
      experience: [],
      documents: [],
      reviewerUserId: d.reviewer_user_id || undefined,
      rejectionReason: d.rejection_reason || undefined,
      requestedChanges: d.requested_changes || undefined,
      approvalNotes: d.approval_notes || undefined,
      submittedAt: d.submitted_at || undefined,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    };
  }

  private mapFullRow(d: any): TutorApplication {
    const applicant = d.applicant || {};
    const reviewer = d.reviewer || {};

    return {
      id: d.id,
      applicantUserId: d.applicant_user_id || applicant.id,
      applicantName: applicant.display_name || 'Applicant',
      applicantEmail: applicant.email || '',
      applicantAvatar: applicant.avatar_url || undefined,
      status: d.status,
      headline: d.headline || '',
      bio: d.bio || '',
      yearsExperience: d.years_experience || 0,
      hourlyRate: Number(d.hourly_rate) || 0,
      currency: d.currency || 'USD',
      teachingStyle: d.teaching_style || undefined,
      introVideoUrl: d.intro_video_url || undefined,
      subjects: (d.subjects || []).map((s: any) => this.mapSubject(s)),
      languages: (d.languages || []).map((l: any) => this.mapLanguage(l)),
      education: (d.education || []).map((e: any) => this.mapEducation(e)),
      experience: (d.experience || []).map((ex: any) => this.mapExperience(ex)),
      documents: (d.documents || []).map((doc: any) => this.mapDocument(doc)),
      reviewerUserId: d.reviewer_user_id || undefined,
      reviewerName: reviewer.display_name || undefined,
      reviewedAt: d.reviewed_at || undefined,
      rejectionReason: d.rejection_reason || undefined,
      requestedChanges: d.requested_changes || undefined,
      approvalNotes: d.approval_notes || undefined,
      submittedAt: d.submitted_at || undefined,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    };
  }

  private mapDocument(d: any): ApplicationDocument {
    return {
      id: d.id,
      applicationId: d.application_id,
      documentType: d.document_type,
      title: d.title,
      fileUrl: d.file_url,
      verificationStatus: d.verification_status,
      verifiedBy: d.verified_by || undefined,
      verifiedAt: d.verified_at || undefined,
      notes: d.notes || undefined,
    };
  }

  private mapEducation(e: any): ApplicationEducation {
    return {
      id: e.id,
      degree: e.degree,
      institution: e.institution,
      fieldOfStudy: e.field_of_study || undefined,
      startYear: e.start_year,
      endYear: e.end_year || undefined,
      honors: e.honors || undefined,
      isVerified: Boolean(e.is_verified),
    };
  }

  private mapExperience(ex: any): ApplicationExperience {
    return {
      id: ex.id,
      role: ex.role,
      organization: ex.organization,
      location: ex.location || undefined,
      startYear: ex.start_year,
      endYear: ex.end_year || undefined,
      isCurrent: Boolean(ex.is_current),
      description: ex.description || undefined,
    };
  }

  private mapSubject(s: any): ApplicationSubject {
    return {
      subjectId: s.subject_id,
      subjectName: s.subject?.name || 'Subject',
      levels: s.levels || [],
      isPrimary: Boolean(s.is_primary),
    };
  }

  private mapLanguage(l: any): ApplicationLanguage {
    return {
      languageId: l.language_id,
      languageName: l.language?.name || 'Language',
      proficiency: l.proficiency,
    };
  }
}

export const tutorApplicationRepository = new TutorApplicationRepository();
