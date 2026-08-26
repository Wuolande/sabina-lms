/**
 * User Management Domain Types
 * -----------------------------------------------------------------------
 * Global user identity, roles, and administrative aggregate representations.
 * -----------------------------------------------------------------------
 */

import { UserRoleType } from '@/src/shared/permissions/roles';

export type UserAccountStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'INCOMPLETE';

export interface UserListItem {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  avatarUrl?: string;
  phone?: string;
  country?: string;
  timezone?: string;
  preferredLanguage?: string;
  status: UserAccountStatus;
  roles: UserRoleType[];
  createdAt: string;
  updatedAt: string;
  studentProfile?: {
    completedLessons: number;
    totalHoursLearned: number;
    learningStreakDays: number;
  };
  tutorProfile?: {
    id: string;
    slug: string;
    headline: string;
    hourlyRate: number;
    averageRating: number;
    accountStatus: string;
  };
}

export interface User360Aggregate {
  id: string;
  authId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  avatarUrl?: string;
  phone?: string;
  country?: string;
  timezone?: string;
  preferredLanguage?: string;
  status: UserAccountStatus;
  createdAt: string;
  updatedAt: string;
  roles: UserRoleType[];
  studentProfile?: {
    id: string;
    targetExam?: string;
    currentLevel?: string;
    weeklyStudyHoursTarget: number;
    totalHoursLearned: number;
    completedLessons: number;
    activeSubjectsCount: number;
    learningStreakDays: number;
    lastActiveAt?: string;
    goals: Array<{
      id: string;
      title: string;
      subjectName?: string;
      targetDate?: string;
      progressPercent: number;
      status: string;
    }>;
  };
  tutorProfile?: {
    id: string;
    slug: string;
    headline: string;
    hourlyRate: number;
    currency: string;
    averageRating: number;
    reviewCount: number;
    totalLessons: number;
    totalStudents: number;
    accountStatus: string;
    isFeatured: boolean;
    isSuperTutor: boolean;
  };
  auditTrail: Array<{
    id: string;
    action: string;
    actorName: string;
    actorRole?: string;
    details?: string;
    beforeState?: Record<string, any>;
    afterState?: Record<string, any>;
    createdAt: string;
  }>;
}

export interface UserListResult {
  data: UserListItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
