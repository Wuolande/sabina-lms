/**
 * Admin Service — Client-Side HTTP Layer
 * -----------------------------------------------------------------------
 * All calls from admin UI components go through this service.
 * It calls Next.js API routes which in turn call the Supabase backend.
 * -----------------------------------------------------------------------
 */

import { Tutor360Aggregate } from '@/src/modules/tutors/domain/types';
import { TutorApplication } from '@/src/modules/tutor-applications/domain/types';
import { User360Aggregate, UserListItem } from '@/src/modules/users/domain/types';
import { AdminStats, UserProfile } from '@/types';

const API_BASE = '/api/admin';

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const normalizedPath = path.startsWith('/api/admin')
    ? path
    : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

  const res = await fetch(normalizedPath, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    throw Object.assign(new Error(`Server returned non-JSON response (${res.status}): ${text.substring(0, 100)}`), {
      statusCode: res.status,
    });
  }

  const json = await res.json();

  if (!res.ok) {
    throw Object.assign(new Error(json.error || `Request failed: ${res.status}`), {
      statusCode: res.status,
    });
  }

  return json as T;
}

export const adminService = {
  // ─── Dashboard Stats ──────────────────────────────────────────────────────
  async getStats(): Promise<AdminStats> {
    const data = await apiFetch<{
      totalUsers?: number;
      totalStudents?: number;
      totalTutors?: number;
      activeTutors?: number;
      pendingTutorApplications?: number;
      totalBookings?: number;
      completedLessons?: number;
      grossRevenue?: number;
      platformFees?: number;
      tutorPayouts?: number;
      activeDisputes?: number;
      applicationStatusCounts?: Record<string, number>;
    }>('/stats');

    return {
      totalUsers: data.totalUsers ?? 0,
      totalStudents: data.totalStudents ?? 0,
      totalTutors: data.totalTutors ?? 0,
      activeTutors: data.activeTutors ?? 0,
      pendingTutorApplications: data.pendingTutorApplications ?? 0,
      totalBookings: data.totalBookings ?? 0,
      completedLessons: data.completedLessons ?? 0,
      grossRevenue: data.grossRevenue ?? 0,
      platformFees: data.platformFees ?? 0,
      tutorPayouts: data.tutorPayouts ?? 0,
      activeDisputes: data.activeDisputes ?? 0,
    };
  },

  // ─── User Accounts ───────────────────────────────────────────────────────
  async getUsers(options?: {
    role?: string;
    status?: string;
    search?: string;
    country?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (options?.role && options.role !== 'ALL') params.set('role', options.role);
    if (options?.status && options.status !== 'ALL') params.set('status', options.status);
    if (options?.search) params.set('search', options.search);
    if (options?.country) params.set('country', options.country);
    if (options?.page) params.set('page', String(options.page));
    if (options?.limit) params.set('limit', String(options.limit));

    return apiFetch<UserListItem[]>(`/users?${params.toString()}`);
  },

  async getAllUsers(): Promise<UserProfile[]> {
    const users = await apiFetch<any[]>('/users');
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      role: (u.roles && u.roles[0]) || 'STUDENT',
      firstName: u.firstName || u.displayName.split(' ')[0] || '',
      lastName: u.lastName || u.displayName.split(' ').slice(1).join(' ') || '',
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      phone: u.phone,
      country: u.country || 'Global',
      timezone: u.timezone || 'UTC',
      preferredLanguage: u.preferredLanguage || 'English',
      status: u.status,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt || u.createdAt,
    }));
  },

  async getUser360(id: string): Promise<User360Aggregate> {
    return apiFetch<User360Aggregate>(`/users/${id}`);
  },

  async suspendUser(id: string, reason: string): Promise<boolean> {
    try {
      await apiFetch(`/users/${id}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      return true;
    } catch (err) {
      console.error('[adminService.suspendUser]', err);
      return false;
    }
  },

  async reactivateUser(id: string): Promise<boolean> {
    try {
      await apiFetch(`/users/${id}/reactivate`, { method: 'POST' });
      return true;
    } catch (err) {
      console.error('[adminService.reactivateUser]', err);
      return false;
    }
  },

  async updateUserRoles(id: string, roles: string[]): Promise<boolean> {
    try {
      await apiFetch(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ roles }),
      });
      return true;
    } catch (err) {
      console.error('[adminService.updateUserRoles]', err);
      return false;
    }
  },

  async updateUserProfile(id: string, updates: Record<string, any>): Promise<boolean> {
    try {
      await apiFetch(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return true;
    } catch (err) {
      console.error('[adminService.updateUserProfile]', err);
      return false;
    }
  },

  async createUser(data: {
    email: string;
    displayName: string;
    country?: string;
    timezone?: string;
    roles?: string[];
  }): Promise<boolean> {
    try {
      await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return true;
    } catch (err) {
      console.error('[adminService.createUser]', err);
      return false;
    }
  },

  // ─── Audit Trail ─────────────────────────────────────────────────────────
  async getAuditLogs(options?: {
    page?: number;
    limit?: number;
    entityType?: string;
    action?: string;
    actorUserId?: string;
  }) {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', String(options.page));
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.entityType) params.set('entityType', options.entityType);
    if (options?.action) params.set('action', options.action);
    if (options?.actorUserId) params.set('actorUserId', options.actorUserId);

    const res = await apiFetch<{ data: any[]; total: number; page: number; limit: number }>(
      `/audit-logs?${params.toString()}`
    );

    return {
      ...res,
      data: (res.data || []).map((l: any) => ({
        ...l,
        adminName: l.actorName || 'Administrator',
        targetName: l.entityType ? `${l.entityType}: ${l.entityId}` : (l.entityId || 'Resource'),
      })),
    };
  },

  // ─── Tutor Directory ─────────────────────────────────────────────────────
  async getTutors(options?: {
    status?: string;
    search?: string;
    subject?: string;
    isFeatured?: boolean;
    isSuperTutor?: boolean;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (options?.status) params.set('status', options.status);
    if (options?.search) params.set('search', options.search);
    if (options?.subject) params.set('subject', options.subject);
    if (options?.isFeatured !== undefined) params.set('isFeatured', String(options.isFeatured));
    if (options?.isSuperTutor !== undefined) params.set('isSuperTutor', String(options.isSuperTutor));
    if (options?.page) params.set('page', String(options.page));
    if (options?.limit) params.set('limit', String(options.limit));

    return apiFetch<{ data: any[]; total: number; page: number; limit: number; hasMore: boolean }>(
      `/tutors?${params.toString()}`
    );
  },

  async getTutor360(id: string): Promise<Tutor360Aggregate> {
    return apiFetch<Tutor360Aggregate>(`/tutors/${id}`);
  },

  async suspendTutor(id: string, reason: string): Promise<boolean> {
    try {
      await apiFetch(`/tutors/${id}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      return true;
    } catch (err) {
      console.error('[adminService.suspendTutor]', err);
      return false;
    }
  },

  async reactivateTutor(id: string): Promise<boolean> {
    try {
      await apiFetch(`/tutors/${id}/reactivate`, { method: 'POST' });
      return true;
    } catch (err) {
      console.error('[adminService.reactivateTutor]', err);
      return false;
    }
  },

  async updateTutorRate(id: string, hourlyRate: number): Promise<boolean> {
    try {
      await apiFetch(`/tutors/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ hourlyRate }),
      });
      return true;
    } catch (err) {
      console.error('[adminService.updateTutorRate]', err);
      return false;
    }
  },

  async toggleFeatured(id: string): Promise<boolean | null> {
    try {
      const res = await apiFetch<{ updated: { isFeatured: boolean } }>(`/tutors/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ toggleFeatured: true }),
      });
      return res.updated?.isFeatured ?? null;
    } catch (err) {
      console.error('[adminService.toggleFeatured]', err);
      return null;
    }
  },

  async toggleSuperTutor(id: string): Promise<boolean | null> {
    try {
      const res = await apiFetch<{ updated: { isSuperTutor: boolean } }>(`/tutors/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ toggleSuperTutor: true }),
      });
      return res.updated?.isSuperTutor ?? null;
    } catch (err) {
      console.error('[adminService.toggleSuperTutor]', err);
      return null;
    }
  },

  // ─── Tutor Applications ──────────────────────────────────────────────────
  async getApplications(options?: {
    status?: string;
    search?: string;
    submittedFrom?: string;
    submittedTo?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (options?.status) params.set('status', options.status);
    if (options?.search) params.set('search', options.search);
    if (options?.submittedFrom) params.set('submittedFrom', options.submittedFrom);
    if (options?.submittedTo) params.set('submittedTo', options.submittedTo);
    if (options?.page) params.set('page', String(options.page));
    if (options?.limit) params.set('limit', String(options.limit));

    return apiFetch<{ data: TutorApplication[]; total: number; page: number; limit: number }>(
      `/tutor-applications?${params.toString()}`
    );
  },

  async getPendingTutors(): Promise<UserProfile[]> {
    const res = await this.getApplications({ status: 'SUBMITTED' });
    return (res.data || []).map((app) => ({
      id: app.id,
      email: app.applicantEmail,
      role: 'TUTOR' as const,
      firstName: app.applicantName.split(' ')[0] || '',
      lastName: app.applicantName.split(' ').slice(1).join(' ') || '',
      displayName: app.applicantName,
      avatarUrl: app.applicantAvatar,
      country: 'Global',
      timezone: 'UTC',
      preferredLanguage: 'en',
      status: 'PENDING' as const,
      createdAt: app.submittedAt || app.createdAt,
      updatedAt: app.updatedAt,
    }));
  },

  async getApplication(id: string): Promise<TutorApplication> {
    return apiFetch<TutorApplication>(`/tutor-applications/${id}`);
  },

  async approveTutor(id: string, approvalNotes?: string): Promise<boolean> {
    try {
      await apiFetch(`/tutor-applications/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ approvalNotes }),
      });
      return true;
    } catch (err) {
      console.error('[adminService.approveTutor]', err);
      return false;
    }
  },

  async rejectTutor(id: string, rejectionReason: string): Promise<boolean> {
    try {
      await apiFetch(`/tutor-applications/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejectionReason }),
      });
      return true;
    } catch (err) {
      console.error('[adminService.rejectTutor]', err);
      return false;
    }
  },

  async requestChanges(id: string, requestedChanges: string): Promise<boolean> {
    try {
      await apiFetch(`/tutor-applications/${id}/request-changes`, {
        method: 'POST',
        body: JSON.stringify({ requestedChanges }),
      });
      return true;
    } catch (err) {
      console.error('[adminService.requestChanges]', err);
      return false;
    }
  },

  async startReview(id: string, notes?: string): Promise<boolean> {
    try {
      await apiFetch(`/tutor-applications/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      });
      return true;
    } catch (err) {
      console.error('[adminService.startReview]', err);
      return false;
    }
  },

  async reopenApplication(id: string, notes: string): Promise<boolean> {
    try {
      await apiFetch(`/tutor-applications/${id}/reopen`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      });
      return true;
    } catch (err) {
      console.error('[adminService.reopenApplication]', err);
      return false;
    }
  },

  async verifyDocument(
    applicationId: string,
    docId: string,
    status: 'VERIFIED' | 'REJECTED',
    notes?: string
  ): Promise<boolean> {
    try {
      await apiFetch(`/tutor-applications/${applicationId}/documents/${docId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ status, notes }),
      });
      return true;
    } catch (err) {
      console.error('[adminService.verifyDocument]', err);
      return false;
    }
  },

  // ─── Homepage CMS & Content Management ────────────────────────────────────
  async getHomepageCMS(): Promise<any | null> {
    try {
      return await apiFetch<any>('/homepage');
    } catch (err) {
      console.error('[adminService.getHomepageCMS]', err);
      return null;
    }
  },

  async updateHomepageCMS(payload: any): Promise<any | null> {
    try {
      return await apiFetch<any>('/homepage', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('[adminService.updateHomepageCMS]', err);
      return null;
    }
  },

  // ─── Platform Pages & Legal Suite CMS ─────────────────────────────────────
  async getCMSPages(options?: { category?: string; search?: string }): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (options?.category) params.set('category', options.category);
      if (options?.search) params.set('search', options.search);
      return await apiFetch<any[]>(`/cms/pages?${params.toString()}`);
    } catch (err) {
      console.error('[adminService.getCMSPages]', err);
      return [];
    }
  },

  async getCMSPage(idOrSlug: string): Promise<any | null> {
    try {
      return await apiFetch<any>(`/cms/pages/${idOrSlug}`);
    } catch (err) {
      console.error('[adminService.getCMSPage]', err);
      return null;
    }
  },

  async saveCMSPage(payload: any): Promise<any | null> {
    try {
      return await apiFetch<any>('/cms/pages', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('[adminService.saveCMSPage]', err);
      return null;
    }
  },

  async deleteCMSPage(id: string): Promise<boolean> {
    try {
      await apiFetch<any>(`/cms/pages/${id}`, { method: 'DELETE' });
      return true;
    } catch (err) {
      console.error('[adminService.deleteCMSPage]', err);
      return false;
    }
  },

  // ─── Platform Taxonomy & Reference Data ─────────────────────────────────────
  async getTaxonomy360(): Promise<any> {
    try {
      return await apiFetch<any>('/taxonomy');
    } catch (err) {
      console.error('[adminService.getTaxonomy360]', err);
      return null;
    }
  },

  async upsertSubject(payload: any): Promise<any> {
    try {
      return await apiFetch<any>('/taxonomy/subjects', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('[adminService.upsertSubject]', err);
      return null;
    }
  },

  async deleteSubject(id: string): Promise<boolean> {
    try {
      await apiFetch<any>(`/taxonomy/subjects/${id}`, { method: 'DELETE' });
      return true;
    } catch (err) {
      console.error('[adminService.deleteSubject]', err);
      return false;
    }
  },

  async upsertLanguage(payload: any): Promise<any> {
    try {
      return await apiFetch<any>('/taxonomy/languages', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('[adminService.upsertLanguage]', err);
      return null;
    }
  },

  async deleteLanguage(id: string): Promise<boolean> {
    try {
      await apiFetch<any>(`/taxonomy/languages/${id}`, { method: 'DELETE' });
      return true;
    } catch (err) {
      console.error('[adminService.deleteLanguage]', err);
      return false;
    }
  },

  async upsertCountry(payload: any): Promise<any> {
    try {
      return await apiFetch<any>('/taxonomy/countries', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('[adminService.upsertCountry]', err);
      return null;
    }
  },

  async deleteCountry(id: string): Promise<boolean> {
    try {
      await apiFetch<any>(`/taxonomy/countries/${id}`, { method: 'DELETE' });
      return true;
    } catch (err) {
      console.error('[adminService.deleteCountry]', err);
      return false;
    }
  },

  async upsertTimezone(payload: any): Promise<any> {
    try {
      return await apiFetch<any>('/taxonomy/timezones', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('[adminService.upsertTimezone]', err);
      return null;
    }
  },

  async deleteTimezone(id: string): Promise<boolean> {
    try {
      await apiFetch<any>(`/taxonomy/timezones/${id}`, { method: 'DELETE' });
      return true;
    } catch (err) {
      console.error('[adminService.deleteTimezone]', err);
      return false;
    }
  },

  async getPolicySettings(): Promise<any> {
    try {
      return await apiFetch<any>('/settings');
    } catch (err) {
      console.error('[adminService.getPolicySettings]', err);
      return null;
    }
  },

  async updatePolicySettings(payload: any): Promise<boolean> {
    try {
      await apiFetch<any>('/settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return true;
    } catch (err) {
      console.error('[adminService.updatePolicySettings]', err);
      return false;
    }
  },

  // ─── Payments & Financial Ledger ──────────────────────────────────────────
  async getPayments(): Promise<any> {
    return apiFetch<any>('/payments');
  },

  // ─── Tutor Payouts & Disbursements ────────────────────────────────────────
  async getPayouts(): Promise<any> {
    return apiFetch<any>('/payouts');
  },

  async processPayout(tutorId: string, action: string = 'process'): Promise<any> {
    return apiFetch<any>('/payouts', {
      method: 'POST',
      body: JSON.stringify({ tutorId, action }),
    });
  },

  // ─── Student Reviews Moderation ───────────────────────────────────────────
  async getReviews(): Promise<any> {
    return apiFetch<any>('/reviews');
  },

  async deleteReview(id: string): Promise<boolean> {
    try {
      await apiFetch<any>(`/reviews/${id}`, { method: 'DELETE' });
      return true;
    } catch (err) {
      console.error('[adminService.deleteReview]', err);
      return false;
    }
  },

  // ─── Analytics & Platform Reports ─────────────────────────────────────────
  async getReports(): Promise<any> {
    return apiFetch<any>('/reports');
  },

  // ─── Communications & Email Broadcasts ────────────────────────────────────
  async getEmails(): Promise<{ data: any[]; total: number }> {
    return apiFetch<{ data: any[]; total: number }>('/emails');
  },

  async sendEmail(payload: {
    audience: string;
    recipientEmail?: string;
    templateType: string;
    subject: string;
    content: string;
  }): Promise<{ success: boolean; message: string; record?: any }> {
    return apiFetch<{ success: boolean; message: string; record?: any }>('/emails', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getEmailTemplates(): Promise<{ templates: any[] }> {
    return apiFetch<{ templates: any[] }>('/emails/templates');
  },

  // ─── Security & Google reCAPTCHA ──────────────────────────────────────────
  async getSecuritySettings(): Promise<any> {
    return apiFetch<any>('/settings/security');
  },

  async updateSecuritySettings(payload: any): Promise<{ success: boolean; settings?: any }> {
    return apiFetch<{ success: boolean; settings?: any }>('/settings/security', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // ─── Email Providers & SMTP Configuration ─────────────────────────────────
  async getEmailProviderConfig(): Promise<any> {
    return apiFetch<any>('/settings/email-providers');
  },

  async updateEmailProviderConfig(payload: any): Promise<{ success: boolean; config?: any }> {
    return apiFetch<{ success: boolean; config?: any }>('/settings/email-providers', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async sendTestEmail(payload: { recipientEmail: string; provider?: string; customMessage?: string }): Promise<any> {
    return apiFetch<any>('/settings/email-providers/test', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // ─── Video Provider & Live Classroom Configuration ─────────────────────────
  async getVideoProviderConfig(): Promise<any> {
    return apiFetch<any>('/settings/video-providers');
  },

  async updateVideoProviderConfig(payload: any): Promise<{ success: boolean; config?: any }> {
    return apiFetch<{ success: boolean; config?: any }>('/settings/video-providers', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // ─── Blog Articles & Editorial CMS ────────────────────────────────────────
  async getAdminBlogs(options: {
    search?: string;
    category?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<any> {
    const params = new URLSearchParams();
    if (options.search) params.set('search', options.search);
    if (options.category && options.category !== 'All') params.set('category', options.category);
    if (options.status && options.status !== 'all') params.set('status', options.status);
    if (options.page) params.set('page', String(options.page));
    if (options.pageSize) params.set('pageSize', String(options.pageSize));

    return apiFetch<any>(`/blogs?${params.toString()}`);
  },

  async getAdminBlog(id: string): Promise<any> {
    return apiFetch<any>(`/blogs/${id}`);
  },

  async createAdminBlog(payload: any): Promise<{ success: boolean; post?: any }> {
    return apiFetch<{ success: boolean; post?: any }>('/blogs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateAdminBlog(id: string, payload: any): Promise<{ success: boolean; post?: any }> {
    return apiFetch<{ success: boolean; post?: any }>(`/blogs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteAdminBlog(id: string): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>(`/blogs/${id}`, {
      method: 'DELETE',
    });
  },
};


