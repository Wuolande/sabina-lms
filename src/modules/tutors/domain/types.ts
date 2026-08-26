export type TutorAccountStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
export type TutorVerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Tutor360Aggregate {
  id: string;
  userId: string;
  slug: string;
  headline: string;
  bio: string;
  hourlyRate: number;
  currency: string;
  yearsExperience: number;
  teachingStyle?: string;
  introVideoUrl?: string;
  averageRating: number;
  reviewCount: number;
  totalLessons: number;
  totalStudents: number;
  accountStatus: TutorAccountStatus;
  verificationStatus: TutorVerificationStatus;
  suspensionReason?: string;
  suspendedAt?: string;
  isSuperTutor: boolean;
  isFeatured: boolean;
  responseTimeMinutes: number;
  attendanceRate: number;
  repeatStudentRate: number;
  applicationId?: string;
  createdAt: string;

  // Aggregate Sections
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    displayName: string;
    avatarUrl?: string;
    phone?: string;
    country?: string;
    timezone?: string;
    status?: string;
    createdAt: string;
  };
  subjects: Array<{
    id: string;
    subjectId?: string;
    name: string;
    category?: string;
    levels: string[];
    isPrimary: boolean;
  }>;
  languages: Array<{
    id: string;
    languageId?: string;
    name: string;
    code?: string;
    proficiency: string;
  }>;
  education: Array<{
    id: string;
    degree: string;
    institution: string;
    fieldOfStudy?: string;
    startYear: number;
    endYear?: number;
    honors?: string;
    isVerified: boolean;
  }>;
  certifications: Array<{
    id: string;
    title: string;
    issuer: string;
    issueYear: number;
    credentialId?: string;
    certificateUrl?: string;
    isVerified: boolean;
  }>;
  experiences: Array<{
    id: string;
    role: string;
    organization: string;
    location?: string;
    startYear?: number;
    endYear?: number;
    description?: string;
    period: string;
  }>;
  auditTrail: Array<{
    id: string;
    action: string;
    actorName: string;
    actorRole?: string;
    details?: string;
    beforeState?: Record<string, any>;
    afterState?: Record<string, any>;
    ipAddress?: string;
    createdAt: string;
  }>;
}
