export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'REQUESTED_CHANGES'
  | 'RESUBMITTED'
  | 'REJECTED'
  | 'APPROVED'
  | 'ONBOARDING'
  | 'ACTIVE';

export type DocumentType =
  | 'IDENTITY'
  | 'DEGREE_CERTIFICATE'
  | 'TEACHING_CREDENTIAL'
  | 'RESUME'
  | 'OTHER';

export type DocumentVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  documentType: DocumentType;
  title: string;
  fileUrl: string;
  verificationStatus: DocumentVerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

export interface ApplicationEducation {
  id: string;
  degree: string;
  institution: string;
  fieldOfStudy?: string;
  startYear: number;
  endYear?: number;
  honors?: string;
  isVerified: boolean;
}

export interface ApplicationExperience {
  id: string;
  role: string;
  organization: string;
  location?: string;
  startYear: number;
  endYear?: number;
  isCurrent: boolean;
  description?: string;
}

export interface ApplicationSubject {
  subjectId: string;
  subjectName: string;
  levels: string[];
  isPrimary: boolean;
}

export interface ApplicationLanguage {
  languageId: string;
  languageName: string;
  proficiency: 'NATIVE' | 'FLUENT' | 'PROFESSIONAL' | 'INTERMEDIATE' | 'BASIC';
}

export interface TutorApplication {
  id: string;
  applicantUserId: string;
  applicantName: string;
  applicantEmail: string;
  applicantAvatar?: string;
  status: ApplicationStatus;
  headline: string;
  bio: string;
  yearsExperience: number;
  hourlyRate: number;
  currency: string;
  teachingStyle?: string;
  introVideoUrl?: string;
  subjects: ApplicationSubject[];
  languages: ApplicationLanguage[];
  education: ApplicationEducation[];
  experience: ApplicationExperience[];
  documents: ApplicationDocument[];
  reviewerUserId?: string;
  reviewerName?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  requestedChanges?: string;
  approvalNotes?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}
