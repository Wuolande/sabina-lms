/**
 * Student Domain Types
 * -----------------------------------------------------------------------
 * Models student profiles, learning milestones, goals, favorites,
 * and cross-portal tutor enrollments.
 * -----------------------------------------------------------------------
 */

export interface LearningGoalItem {
  id: string;
  studentId?: string;
  subjectId?: string;
  subjectName: string;
  title: string;
  description?: string;
  targetDate?: string;
  progressPercent: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';
  createdAt: string;
}

export interface FavoriteTutorItem {
  tutorProfileId: string;
  slug: string;
  headline: string;
  hourlyRate: number;
  currency: string;
  averageRating: number;
  reviewCount: number;
  isFeatured: boolean;
  isSuperTutor: boolean;
  tutorName: string;
  tutorAvatar?: string;
  tutorCountry?: string;
}

export interface EnrolledTutorItem {
  tutorProfileId: string;
  tutorName: string;
  tutorAvatar?: string;
  headline: string;
  totalLessonsTogether: number;
  totalHoursTogether: number;
  lastLessonAt?: string;
  privateTutorNotes?: string;
}

export interface Student360Aggregate {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  avatarUrl?: string;
  phone?: string;
  country: string;
  timezone: string;
  preferredLanguage: string;
  status: string;
  createdAt: string;
  profile?: {
    id: string;
    targetExam?: string;
    currentLevel: string;
    weeklyStudyHoursTarget: number;
    totalHoursLearned: number;
    completedLessons: number;
    activeSubjectsCount: number;
    learningStreakDays: number;
    lastActiveAt?: string;
  };
  goals: LearningGoalItem[];
  favoriteTutors: FavoriteTutorItem[];
  enrolledTutors: EnrolledTutorItem[];
}

export interface StudentProfileUpdatePayload {
  displayName?: string;
  country?: string;
  timezone?: string;
  preferredLanguage?: string;
  phone?: string;
  targetExam?: string;
  currentLevel?: string;
  weeklyStudyHoursTarget?: number;
}

export interface TutorStudent360Aggregate {
  studentId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  country: string;
  timezone: string;
  phoneNumber?: string;
  joinedAt: string;
  learningStyle?: string;
  targetExam?: string;
  nativeLanguage?: string;
  subjectsOfInterest?: string[];
  enrollment: {
    id?: string;
    status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
    totalLessonsTogether: number;
    totalHoursTogether: number;
    privateTutorNotes?: string;
    tutorRoadmap?: string;
    targetLevel?: string;
    firstEnrolledAt?: string;
    lastLessonAt?: string;
  };
  learningGoals: Array<{
    id: string;
    subjectName: string;
    targetGoal: string;
    targetDate?: string;
    progressPct: number;
    status: string;
    createdAt: string;
  }>;
  lessons: Array<{
    id: string;
    bookingId: string;
    bookingRef: string;
    subjectName: string;
    scheduledStart: string;
    scheduledEnd: string;
    actualStart?: string;
    actualEnd?: string;
    status: string;
    curriculumTopic?: string;
    lessonNotes?: string;
    studentFeedback?: string;
    hasStudentReviewed: boolean;
    videoRoomId: string;
  }>;
  materials: Array<{
    id: string;
    lessonId: string;
    name: string;
    sizeBytes: number;
    fileType: string;
    url: string;
    uploadedByRole: string;
    createdAt: string;
  }>;
}

export interface UpdateStudentEnrollmentPayload {
  privateTutorNotes?: string;
  tutorRoadmap?: string;
  targetLevel?: string;
  status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
}
