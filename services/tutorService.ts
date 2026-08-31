/**
 * Tutor Service — Client-Side HTTP Layer
 * -----------------------------------------------------------------------
 * Connects frontend UI components (Homepage, Find Tutors, Tutor Profile)
 * to live Next.js API routes powered by the Supabase database.
 * -----------------------------------------------------------------------
 */

import { TutorProfile, TutorSearchParams, Subject, Language } from "@/types";

export const tutorService = {
  /**
   * Search and filter verified active tutors from Supabase database.
   */
  async getTutors(params?: TutorSearchParams): Promise<{ tutors: TutorProfile[]; total: number }> {
    try {
      const searchParams = new URLSearchParams();

      if (params?.query) searchParams.set('query', params.query);
      if (params?.subjectGroup && params.subjectGroup !== 'all') searchParams.set('subjectGroup', params.subjectGroup);
      if (params?.subject && params.subject !== 'all') searchParams.set('subject', params.subject);
      if (params?.country && params.country !== 'all') searchParams.set('country', params.country);
      if (params?.language && params.language !== 'all') searchParams.set('language', params.language);
      if (params?.minPrice !== undefined) searchParams.set('minPrice', String(params.minPrice));
      if (params?.maxPrice !== undefined) searchParams.set('maxPrice', String(params.maxPrice));
      if (params?.rating !== undefined && params.rating > 0) searchParams.set('rating', String(params.rating));
      if (params?.nativeOnly) searchParams.set('nativeOnly', 'true');
      if (params?.superTutorOnly) searchParams.set('superTutorOnly', 'true');
      if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));

      const res = await fetch(`/api/tutors?${searchParams.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch tutors: ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.error('[tutorService.getTutors]', err);
      return { tutors: [], total: 0 };
    }
  },

  /**
   * Fetch featured tutors for the homepage showcase.
   */
  async getFeaturedTutors(): Promise<TutorProfile[]> {
    try {
      const res = await fetch('/api/tutors?isFeatured=true&limit=4');
      if (!res.ok) return [];
      const json = await res.json();
      return json.tutors || [];
    } catch (err) {
      console.error('[tutorService.getFeaturedTutors]', err);
      return [];
    }
  },

  /**
   * Fetch public tutor profile by slug.
   */
  async getTutorBySlug(slug: string): Promise<TutorProfile | null> {
    try {
      const res = await fetch(`/api/tutors/${slug}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error('[tutorService.getTutorBySlug]', err);
    }
    return null;
  },

  /**
   * Get all active subjects from Supabase.
   */
  async getAllSubjects(): Promise<Subject[]> {
    try {
      const res = await fetch('/api/subjects');
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error('[tutorService.getAllSubjects]', err);
      return [];
    }
  },

  /**
   * Get popular / featured subjects for homepage showcase.
   */
  async getPopularSubjects(): Promise<Subject[]> {
    try {
      const res = await fetch('/api/subjects?isFeatured=true&limit=8');
      if (!res.ok) return [];
      const subjects: Subject[] = await res.json();
      if (subjects.length > 0) return subjects;
      
      // Fallback to active subjects if none marked featured
      const fallback = await fetch('/api/subjects?limit=8');
      if (!fallback.ok) return [];
      return await fallback.json();
    } catch (err) {
      console.error('[tutorService.getPopularSubjects]', err);
      return [];
    }
  },

  /**
   * Get all supported languages from Supabase.
   */
  async getAllLanguages(): Promise<Language[]> {
    try {
      const res = await fetch('/api/languages');
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error('[tutorService.getAllLanguages]', err);
      return [];
    }
  },

  /**
   * Get all supported countries from Supabase.
   */
  async getAllCountries(): Promise<any[]> {
    try {
      const res = await fetch('/api/countries');
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error('[tutorService.getAllCountries]', err);
      return [];
    }
  },

  /**
   * Get all supported timezones from Supabase.
   */
  async getAllTimezones(): Promise<any[]> {
    try {
      const res = await fetch('/api/timezones');
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error('[tutorService.getAllTimezones]', err);
      return [];
    }
  },

  /**
   * Get all supported currencies from Supabase.
   */
  async getAllCurrencies(): Promise<any[]> {
    try {
      const res = await fetch('/api/currencies');
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error('[tutorService.getAllCurrencies]', err);
      return [];
    }
  },

  /**
   * Tutor Dashboard & Profile Management methods
   */
  async getMyProfile(): Promise<any | null> {
    try {
      const res = await fetch('/api/tutor/profile');
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  async updateMyProfile(payload: any): Promise<boolean> {
    try {
      const res = await fetch('/api/tutor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async uploadAvatar(file: File): Promise<string | null> {
    try {
      const form = new FormData();
      form.append('file', file);

      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) return null;
      const json = await res.json();
      return json.avatarUrl || null;
    } catch {
      return null;
    }
  },

  async getSettings(): Promise<any | null> {
    try {
      const res = await fetch('/api/tutor/settings');
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  async updateSettings(payload: any): Promise<boolean> {
    try {
      const res = await fetch('/api/tutor/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Get dynamic homepage content from Supabase CMS.
   */
  async getHomepageContent(): Promise<any | null> {
    try {
      const res = await fetch('/api/homepage');
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  async deactivateAccount(reason: string): Promise<boolean> {
    try {
      const res = await fetch('/api/tutor/settings/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteAccountGdpr(confirmation: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/tutor/settings/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation, reason }),
      });
      const json = await res.json();
      if (res.ok) return { success: true };
      return { success: false, error: json.error || 'Failed to delete account' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  },

  async getDashboardData(): Promise<any | null> {
    try {
      const res = await fetch('/api/tutor/dashboard');
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  async getEarnings(): Promise<any | null> {
    try {
      const res = await fetch('/api/tutor/earnings');
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  async requestPayout(amount: number, currency: string = 'USD'): Promise<any> {
    try {
      const res = await fetch('/api/tutor/earnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to request payout' };
    }
  },
};
