export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  TUTOR: 'TUTOR',
  STUDENT: 'STUDENT',
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];
