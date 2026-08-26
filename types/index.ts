export type UserRole = "STUDENT" | "TUTOR" | "ADMIN";

export type UserStatus = "ACTIVE" | "PENDING" | "SUSPENDED" | "INCOMPLETE";

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl?: string;
  phone?: string;
  country: string;
  timezone: string;
  preferredLanguage: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export type TutorVerificationStatus = "REGISTERED" | "PROFILE_INCOMPLETE" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

export interface Subject {
  id: string;
  name: string;
  slug: string;
  category: "Languages" | "Mathematics" | "Sciences" | "Technology" | "Business" | "Humanities" | "Arts & Music" | "Test Prep" | string;
  description: string;
  iconName?: string;
  tutorCount?: number;
  popular?: boolean;
}

export interface Language {
  id: string;
  name: string;
  code: string;
  nativeName: string;
}

export interface TutorSubject {
  id: string;
  subjectId: string;
  subject: Subject;
  levels: ("Beginner" | "Intermediate" | "Advanced" | "Conversational" | "Exam Prep")[];
  isPrimary?: boolean;
}

export interface TutorLanguage {
  languageId: string;
  language: Language;
  proficiency: "Native" | "Fluent" | "Professional" | "Intermediate";
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  fieldOfStudy: string;
  startYear: number;
  endYear?: number;
  honors?: string;
  location?: string;
  isVerified?: boolean;
}

export interface Certification {
  id: string;
  title: string;
  issuer: string;
  issueYear: number;
  credentialId?: string;
  certificateUrl?: string;
  isVerified?: boolean;
}

export interface TeachingExperience {
  id: string;
  role: string;
  organization: string;
  location?: string;
  startYear: number;
  endYear?: number | "Present";
  description: string;
  highlights?: string[];
}

export interface TutorFaq {
  question: string;
  answer: string;
}

export interface MethodologyFeature {
  title: string;
  description: string;
  icon?: string;
}

export interface AvailabilityRule {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  isActive: boolean;
}

export interface AvailabilityException {
  id: string;
  date: string; // "YYYY-MM-DD"
  isBlocked: boolean;
  slots?: { startTime: string; endTime: string }[];
  reason?: string;
}

export interface TutorProfile {
  id: string;
  userId: string;
  slug: string;
  user: UserProfile;
  headline: string;
  bio: string;
  hourlyRate: number;
  currency: string;
  yearsExperience: number;
  teachingStyle: string;
  introVideoUrl?: string;
  videoThumbnail?: string;
  verificationStatus: TutorVerificationStatus;
  rejectionReason?: string;
  averageRating: number;
  reviewCount: number;
  totalLessons: number;
  totalStudents: number;
  isFeatured?: boolean;
  isSuperTutor?: boolean;
  responseTimeMinutes?: number;
  attendanceRate?: number;
  repeatStudentRate?: number;
  subjects: TutorSubject[];
  languages: TutorLanguage[];
  education: Education[];
  certifications: Certification[];
  experience?: TeachingExperience[];
  methodology?: MethodologyFeature[];
  faqs?: TutorFaq[];
  curriculumHighlights?: string[];
  availabilityRules: AvailabilityRule[];
  exceptions: AvailabilityException[];
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "RESCHEDULED"
  | "NO_SHOW_STUDENT"
  | "NO_SHOW_TUTOR"
  | "DISPUTED";

export type PaymentStatus = "UNPAID" | "PENDING" | "PAID" | "REFUNDED" | "DISPUTED";

export interface Booking {
  id: string;
  studentId: string;
  student: UserProfile;
  tutorId: string;
  tutor: TutorProfile;
  subjectId: string;
  subject: Subject;
  startTime: string; // ISO UTC
  endTime: string;   // ISO UTC
  durationMinutes: number; // 25, 50, or 75
  price: number;
  currency: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  videoRoomId?: string;
  cancellationReason?: string;
  meetingLink?: string;
  createdAt: string;
  updatedAt: string;
}

export type LessonStatus = "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED" | "DISPUTED";

export interface LessonMaterial {
  id: string;
  name: string;
  sizeBytes: number;
  fileType: string;
  url: string;
  uploadedByRole: "TUTOR" | "STUDENT";
  uploadedAt: string;
}

export interface Lesson {
  id: string;
  bookingId: string;
  booking: Booking;
  studentId: string;
  student: UserProfile;
  tutorId: string;
  tutor: TutorProfile;
  subject: Subject;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  status: LessonStatus;
  videoRoomId: string;
  lessonNotes?: string;
  studentFeedback?: string; // Public feedback for student
  privateTutorNotes?: string; // Private only for tutor
  materials: LessonMaterial[];
  hasStudentReviewed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  lessonId: string;
  studentId: string;
  student: UserProfile;
  tutorId: string;
  rating: number; // 1-5
  reviewText: string;
  tutorResponse?: string;
  tutorResponseAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningGoal {
  id: string;
  studentId: string;
  title: string;
  description?: string;
  targetDate?: string;
  progressPercent: number;
  status: "IN_PROGRESS" | "COMPLETED" | "PAUSED";
  subjectId?: string;
  subjectName?: string;
  createdAt: string;
}

export interface LearningProgress {
  totalHoursLearned: number;
  completedLessons: number;
  activeSubjects: number;
  learningStreakDays: number;
  goals: LearningGoal[];
}

export interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  sizeBytes: number;
  type: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: UserRole;
  content: string;
  attachments?: MessageAttachment[];
  isSystemMessage?: boolean;
  readAt?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: UserProfile[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

export type NotificationType =
  | "BOOKING_CREATED"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "LESSON_REMINDER"
  | "NEW_MESSAGE"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "TUTOR_APPROVED"
  | "TUTOR_REJECTED"
  | "NEW_REVIEW"
  | "PAYOUT_COMPLETED";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl?: string;
  readAt?: string;
  createdAt: string;
}

export interface TutorEarnings {
  totalGrossEarned: number;
  platformCommissionTotal: number;
  netPayoutTotal: number;
  availableBalance: number;
  pendingBalance: number;
  currency: string;
  recentTransactions: {
    id: string;
    date: string;
    studentName: string;
    subjectName: string;
    lessonDuration: number;
    amount: number;
    platformFee: number;
    netAmount: number;
    status: "PAID" | "PENDING" | "PROCESSING";
  }[];
}

export interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalTutors: number;
  activeTutors: number;
  pendingTutorApplications: number;
  totalBookings: number;
  completedLessons: number;
  grossRevenue: number;
  platformFees: number;
  tutorPayouts: number;
  activeDisputes: number;
}

export interface TutorSearchParams {
  query?: string;
  subject?: string;
  subjectGroup?: string;
  country?: string;
  sessionType?: "all" | "private" | "group";
  language?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  dayOfWeek?: number;
  nativeOnly?: boolean;
  superTutorOnly?: boolean;
  sortBy?: "popularity" | "rating" | "price_asc" | "price_desc" | "reviews";
  page?: number;
  limit?: number;
}
