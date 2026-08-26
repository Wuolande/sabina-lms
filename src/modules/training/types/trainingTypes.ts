export type CourseCategory = 
  | 'Classroom Tools'
  | 'Pedagogy'
  | 'Safeguarding'
  | 'Exam Coaching'
  | 'Business & Growth';

export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';

export interface TrainingResource {
  title: string;
  url: string;
  type: 'pdf' | 'link' | 'cheatsheet';
}

export interface TrainingModule {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  moduleType: 'video' | 'reading' | 'interactive' | 'quiz';
  videoUrl?: string;
  readingContent?: string;
  durationMinutes: number;
  orderIndex: number;
  resources?: TrainingResource[];
  isCompleted?: boolean;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  orderIndex: number;
}

export interface TrainingQuiz {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  passingScore: number;
  timeLimitMinutes?: number;
  maxAttempts?: number;
  questions: QuizQuestion[];
}

export interface TrainingCourse {
  id: string;
  slug: string;
  title: string;
  headline: string;
  description: string;
  category: CourseCategory;
  level: CourseLevel;
  estimatedMinutes: number;
  thumbnailUrl: string;
  badgeTitle: string;
  badgeIcon: string;
  isMandatory: boolean;
  passingScorePercentage: number;
  orderIndex: number;
  isPublished: boolean;
  modules?: TrainingModule[];
  quiz?: TrainingQuiz;
  // Tutor personalized stats:
  isEnrolled?: boolean;
  progressPercentage?: number;
  status?: 'not_started' | 'in_progress' | 'completed';
  completedAt?: string;
  certificateCode?: string;
}

export interface TutorCertificate {
  id: string;
  tutorId: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  tutorName: string;
  tutorAvatar?: string;
  certificateCode: string;
  badgeTitle: string;
  badgeIcon: string;
  scoreAchieved: number;
  issuedAt: string;
  expiresAt?: string;
  isValid: boolean;
}

export interface QuizSubmissionResult {
  scorePercentage: number;
  passed: boolean;
  totalQuestions: number;
  correctCount: number;
  certificateCode?: string;
  badgeTitle?: string;
  explanationList: {
    questionId: string;
    isCorrect: boolean;
    correctOptionIndex: number;
    selectedOptionIndex: number;
    explanation: string;
  }[];
}
