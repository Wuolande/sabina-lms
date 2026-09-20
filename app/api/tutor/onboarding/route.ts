/**
 * API Route: POST /api/tutor/onboarding
 * -----------------------------------------------------------------------
 * Enterprise Tutor Onboarding Submission.
 * Authenticates applicant, saves identity, credentials, education,
 * work experience, subject taxonomy, languages, availability schedule,
 * and synchronizes with both tutor_applications and tutor_profiles.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractAuthUser } from '@/src/shared/auth/authService';
import { adminSupabase } from '@/src/shared/database/supabase';
import { domainLessonService } from '@/src/modules/lessons/services/lessonService';
import { z } from 'zod';

const DAY_MAP: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const OnboardingSchema = z.object({
  displayName: z.string().min(2, 'Display name is required'),
  country: z.string().min(2, 'Country is required'),
  timezone: z.string().min(2, 'Timezone is required'),
  phone: z.string().optional(),
  avatarUrl: z.string().optional(),

  headline: z.string().min(5, 'Professional headline must be at least 5 characters'),
  bioAboutMe: z.string().min(20, 'About Me must be at least 20 characters'),
  bioExperience: z.string().optional(),
  bioStyle: z.string().optional(),

  languages: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      proficiency: z.string(),
    })
  ).min(1, 'At least one language is required'),

  degrees: z.array(
    z.object({
      id: z.string().optional(),
      degree: z.string().min(2),
      institution: z.string().min(2),
      fieldOfStudy: z.string().optional(),
      startYear: z.string(),
      endYear: z.string().optional(),
      honors: z.string().optional(),
      documentName: z.string().optional(),
      documentUrl: z.string().optional(),
    })
  ).optional().default([]),

  certifications: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string().min(2),
      issuer: z.string().min(2),
      issueYear: z.string(),
      credentialId: z.string().optional(),
    })
  ).optional().default([]),

  experiences: z.array(
    z.object({
      id: z.string().optional(),
      role: z.string().min(2),
      organization: z.string().min(2),
      startYear: z.string(),
      endYear: z.string().optional(),
      isCurrent: z.boolean().optional(),
      description: z.string().optional(),
    })
  ).optional().default([]),

  primarySubjectId: z.string().min(1, 'Primary subject is required'),
  secondarySubjectIds: z.array(z.string()).optional().default([]),
  hourlyRate: z.number().min(5).max(500),
  trialPrice: z.number().min(0).max(250).optional(),
  instantBookingEnabled: z.boolean().optional().default(true),
  noticeHours: z.string().optional().default('12'),

  schedule: z.array(
    z.object({
      day: z.string(),
      active: z.boolean(),
      start: z.string(),
      end: z.string(),
    })
  ).optional().default([]),

  videoUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await extractAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to submit tutor application.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = OnboardingSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid application payload';
      return NextResponse.json(
        { error: firstError, details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 1. Update public.users table with profile data
    const parts = data.displayName.split(' ');
    const fName = ((data as any).firstName || parts[0] || 'Tutor').trim();
    const lName = ((data as any).lastName || parts.slice(1).join(' ') || 'Educator').trim();

    const userUpdates: Record<string, any> = {
      first_name: fName,
      last_name: lName,
      display_name: data.displayName,
      country: data.country,
      timezone: data.timezone,
      updated_at: new Date().toISOString(),
    };
    if (data.phone) userUpdates.phone = data.phone;
    if (data.avatarUrl) userUpdates.avatar_url = data.avatarUrl;

    await adminSupabase.from('users').update(userUpdates).eq('id', user.id);

    // Ensure user has TUTOR role assigned in user_roles
    try {
      await adminSupabase.from('user_roles').upsert({
        user_id: user.id,
        role_id: 'TUTOR',
      });
    } catch {
      // Non-blocking
    }

    // 2. Create or Update public.tutor_applications
    const combinedBio = [data.bioAboutMe, data.bioExperience, data.bioStyle]
      .filter(Boolean)
      .join('\n\n');

    const yearsExperience = data.experiences.length > 0 ? Math.max(1, data.experiences.length * 2) : 1;

    // Check if an existing application exists for this user
    const { data: existingApp } = await adminSupabase
      .from('tutor_applications')
      .select('id, status')
      .eq('applicant_user_id', user.id)
      .maybeSingle();

    let applicationId: string;

    if (existingApp) {
      applicationId = existingApp.id;
      await adminSupabase
        .from('tutor_applications')
        .update({
          status: 'SUBMITTED',
          headline: data.headline,
          bio: combinedBio,
          years_experience: yearsExperience,
          hourly_rate: data.hourlyRate,
          teaching_style: data.bioStyle || null,
          intro_video_url: data.videoUrl || null,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId);
    } else {
      const { data: newApp, error: appError } = await adminSupabase
        .from('tutor_applications')
        .insert({
          applicant_user_id: user.id,
          status: 'SUBMITTED',
          headline: data.headline,
          bio: combinedBio,
          years_experience: yearsExperience,
          hourly_rate: data.hourlyRate,
          currency: 'USD',
          teaching_style: data.bioStyle || null,
          intro_video_url: data.videoUrl || null,
          submitted_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (appError || !newApp) {
        throw new Error(`Failed to create tutor application: ${appError?.message}`);
      }
      applicationId = newApp.id;
    }

    // 3. Save Education Degrees
    if (data.degrees.length > 0) {
      await adminSupabase
        .from('tutor_application_education')
        .delete()
        .eq('application_id', applicationId);

      const eduRows = data.degrees.map((d) => ({
        application_id: applicationId,
        degree: d.degree,
        institution: d.institution,
        field_of_study: d.fieldOfStudy || null,
        start_year: parseInt(d.startYear, 10) || new Date().getFullYear(),
        end_year: d.endYear ? parseInt(d.endYear, 10) : null,
        honors: d.honors || null,
      }));

      await adminSupabase.from('tutor_application_education').insert(eduRows);
    }

    // 4. Save Work Experiences
    if (data.experiences.length > 0) {
      await adminSupabase
        .from('tutor_application_experience')
        .delete()
        .eq('application_id', applicationId);

      const expRows = data.experiences.map((e) => ({
        application_id: applicationId,
        role: e.role,
        organization: e.organization,
        start_year: parseInt(e.startYear, 10) || new Date().getFullYear(),
        end_year: e.endYear ? parseInt(e.endYear, 10) : null,
        is_current: !!e.isCurrent,
        description: e.description || null,
      }));

      await adminSupabase.from('tutor_application_experience').insert(expRows);
    }

    // 5. Save Application Subjects
    const allSubjectIds = Array.from(new Set([data.primarySubjectId, ...data.secondarySubjectIds]));
    if (allSubjectIds.length > 0) {
      await adminSupabase
        .from('tutor_application_subjects')
        .delete()
        .eq('application_id', applicationId);

      const subRows = allSubjectIds.map((subId) => ({
        application_id: applicationId,
        subject_id: subId,
        is_primary: subId === data.primarySubjectId,
      }));

      await adminSupabase.from('tutor_application_subjects').insert(subRows);
    }

    // 6. Save Application Languages
    const langCodes = data.languages.map((l) => l.code.toLowerCase());
    const { data: dbLangs } = await adminSupabase
      .from('languages')
      .select('id, code')
      .in('code', langCodes);

    const langMap = new Map((dbLangs || []).map((l: any) => [l.code.toLowerCase(), l.id]));

    const appLangRows = data.languages
      .map((l) => {
        const langId = langMap.get(l.code.toLowerCase());
        if (!langId) return null;
        let proficiency = 'PROFESSIONAL';
        const pUpper = l.proficiency.toUpperCase();
        if (pUpper.includes('NATIVE') || pUpper.includes('BILINGUAL')) proficiency = 'NATIVE';
        else if (pUpper.includes('FLUENT') || pUpper.includes('C2') || pUpper.includes('C1')) proficiency = 'FLUENT';
        else if (pUpper.includes('INTERMEDIATE') || pUpper.includes('B2') || pUpper.includes('B1')) proficiency = 'INTERMEDIATE';
        else if (pUpper.includes('BASIC') || pUpper.includes('A2') || pUpper.includes('A1')) proficiency = 'BASIC';

        return {
          application_id: applicationId,
          language_id: langId,
          proficiency,
        };
      })
      .filter((row): row is { application_id: string; language_id: any; proficiency: string } => Boolean(row));

    if (appLangRows.length > 0) {
      await adminSupabase
        .from('tutor_application_languages')
        .delete()
        .eq('application_id', applicationId);

      await adminSupabase.from('tutor_application_languages').insert(appLangRows);
    }

    // 7. Upsert public.tutor_profiles so the tutor can preview and access portal
    const cleanName = data.displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'tutor';
    const tutorSlug = `${cleanName}-${user.id.slice(0, 8)}`;

    const { data: tutorProfile, error: profErr } = await adminSupabase
      .from('tutor_profiles')
      .upsert(
        {
          user_id: user.id,
          application_id: applicationId,
          slug: tutorSlug,
          headline: data.headline,
          bio: combinedBio,
          hourly_rate: data.hourlyRate,
          currency: 'USD',
          years_experience: yearsExperience,
          teaching_style: data.bioStyle || null,
          intro_video_url: data.videoUrl || null,
          verification_status: 'PENDING',
          account_status: 'ACTIVE',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select('id')
      .single();

    if (tutorProfile?.id) {
      // Sync tutor active subjects
      await adminSupabase.from('tutor_subjects').delete().eq('tutor_id', tutorProfile.id);
      const tutorSubRows = allSubjectIds.map((subId) => ({
        tutor_id: tutorProfile.id,
        subject_id: subId,
        is_primary: subId === data.primarySubjectId,
      }));
      await adminSupabase.from('tutor_subjects').insert(tutorSubRows);

      // Sync tutor active languages
      await adminSupabase.from('tutor_languages').delete().eq('tutor_id', tutorProfile.id);
      const tutorLangRows = (appLangRows as any[]).map((al) => ({
        tutor_id: tutorProfile.id,
        language_id: al.language_id,
        proficiency: al.proficiency,
      }));
      if (tutorLangRows.length > 0) {
        await adminSupabase.from('tutor_languages').insert(tutorLangRows);
      }

      // Sync weekly availability
      if (data.schedule && data.schedule.length > 0) {
        const rules = data.schedule.map((s) => ({
          dayOfWeek: DAY_MAP[s.day] ?? 1,
          startTime: s.start.length === 5 ? `${s.start}:00` : s.start,
          endTime: s.end.length === 5 ? `${s.end}:00` : s.end,
          isActive: s.active,
        }));
        await domainLessonService.saveTutorAvailability(tutorProfile.id, rules);
      }
    }

    // 8. Record audit log
    try {
      await adminSupabase.from('audit_logs').insert({
        id: `tutor-onboard-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        actor_user_id: user.id,
        actor_name: data.displayName,
        actor_role: 'TUTOR',
        action: 'TUTOR_APPLICATION_SUBMITTED',
        entity_type: 'TUTOR_APPLICATION',
        entity_id: applicationId,
        details: `Tutor onboarding submitted for ${data.displayName} (${data.headline}).`,
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      applicationId,
      tutorProfileId: tutorProfile?.id,
      message: 'Tutor application and schedule submitted successfully.',
    });
  } catch (error: any) {
    console.error('[POST /api/tutor/onboarding]', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while saving your tutor application.' },
      { status: error.statusCode || 500 }
    );
  }
}
