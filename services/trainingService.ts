import { TrainingCourse, TutorCertificate, QuizSubmissionResult, LiveTrainingSession } from '@/src/modules/training/types/trainingTypes';

export class TrainingService {
  async getCourses(): Promise<TrainingCourse[]> {
    try {
      const res = await fetch('/api/tutor/training');
      if (!res.ok) return [];
      const data = await res.json();
      return data.courses || [];
    } catch {
      return [];
    }
  }

  async getCourseBySlug(slug: string): Promise<TrainingCourse | null> {
    try {
      const res = await fetch(`/api/tutor/training/${slug}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.course || null;
    } catch {
      return null;
    }
  }

  async completeModule(moduleId: string, courseId: string): Promise<{ progress: number }> {
    const res = await fetch(`/api/tutor/training/module/${moduleId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to complete module');
    }
    return await res.json();
  }

  async submitQuiz(quizId: string, courseId: string, answers: Record<string, number>): Promise<QuizSubmissionResult> {
    const res = await fetch(`/api/tutor/training/quiz/${quizId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, answers }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit quiz');
    }
    return await res.json();
  }

  async getCertificates(): Promise<TutorCertificate[]> {
    try {
      const res = await fetch('/api/tutor/training/certificates');
      if (!res.ok) return [];
      const data = await res.json();
      return data.certificates || [];
    } catch {
      return [];
    }
  }

  async getCertificateById(id: string): Promise<TutorCertificate | null> {
    try {
      const res = await fetch(`/api/tutor/training/certificates/${id}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.certificate || null;
    } catch {
      return null;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     LIVE GROUP TRAINING & COHORT WORKSHOPS
  ═══════════════════════════════════════════════════════════════ */

  async getLiveSessions(): Promise<LiveTrainingSession[]> {
    try {
      const res = await fetch('/api/tutor/training/live');
      if (!res.ok) return [];
      const data = await res.json();
      return data.sessions || [];
    } catch {
      return [];
    }
  }

  async getLiveSessionById(idOrSlug: string): Promise<LiveTrainingSession | null> {
    try {
      const res = await fetch(`/api/tutor/training/live/${idOrSlug}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.session || null;
    } catch {
      return null;
    }
  }

  async registerForLiveSession(sessionId: string): Promise<{ success: boolean; isRegistered: boolean }> {
    const res = await fetch(`/api/tutor/training/live/${sessionId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to register for live session');
    }
    return await res.json();
  }

  async confirmLiveAttendance(sessionId: string): Promise<{ success: boolean; certificateCode: string }> {
    const res = await fetch(`/api/tutor/training/live/${sessionId}/attend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to confirm attendance');
    }
    return await res.json();
  }

  async createLiveSession(data: any): Promise<LiveTrainingSession> {
    const res = await fetch('/api/admin/training/live', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create live session');
    }
    const result = await res.json();
    return result.session;
  }
}

export const trainingService = new TrainingService();
