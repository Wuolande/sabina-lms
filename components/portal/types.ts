export type PortalUser = {
  id: number | string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: "student" | "tutor";
  timezone: string;
  phone: string;
  country: string;
  avatarUrl: string | null;
  avatarId: number | string | null;
  /** Tutors only: application/profile status. */
  tutorStatus?: "draft" | "submitted" | "changes_requested" | "approved" | "rejected" | "suspended" | null;
  tutorSlug?: string | null;
  /** Students only: learning goals saved. */
  goalsSet?: boolean;
};
