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
};
