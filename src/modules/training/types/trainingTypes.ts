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

/* ═══════════════════════════════════════════════════════════════
   LIVE GROUP TRAINING & COHORT WORKSHOP TYPES
═══════════════════════════════════════════════════════════════ */

export interface LiveTrainingSession {
  id: string;
  slug: string;
  title: string;
  headline: string;
  description: string;
  trainerName: string;
  trainerAvatar?: string;
  trainerRole: string;
  category: CourseCategory;
  scheduledAt: string;
  durationMinutes: number;
  maxAttendees: number;
  currentAttendees: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  videoRoomId: string;
  streamUrl?: string;
  slidesUrl?: string;
  recordingUrl?: string;
  attendanceCode?: string;
  isMandatory: boolean;
  badgeTitle?: string;
  // Tutor registration state:
  isRegistered?: boolean;
  hasAttended?: boolean;
  certificateIssued?: boolean;
  certificateCode?: string;
  registeredAttendees?: Array<{
    id: string;
    tutorId: string;
    tutorName: string;
    tutorAvatar?: string;
    registeredAt: string;
    attended: boolean;
  }>;
}

export interface LiveTrainingRegistration {
  id: string;
  sessionId: string;
  tutorId: string;
  tutorName: string;
  tutorAvatar?: string;
  registeredAt: string;
  attended: boolean;
  attendedMinutes: number;
  certificateIssued: boolean;
  certificateCode?: string;
  feedbackRating?: number;
  feedbackNotes?: string;
}

export interface LivePoll {
  id: string;
  sessionId: string;
  question: string;
  options: string[];
  correctOptionIndex?: number;
  isActive: boolean;
  totalVotes?: number;
  results?: number[];
}

export interface LiveChatMessage {
  id: string;
  senderName: string;
  senderRole: 'trainer' | 'tutor' | 'admin';
  senderAvatar?: string;
  text: string;
  timestamp: string;
  isPinned?: boolean;
}

export interface LiveQnAItem {
  id: string;
  authorName: string;
  authorAvatar?: string;
  question: string;
  upvotes: number;
  isAnswered: boolean;
  answerText?: string;
  createdAt: string;
}
