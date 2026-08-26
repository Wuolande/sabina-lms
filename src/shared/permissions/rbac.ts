import { UserRole, UserRoleType } from './roles';
import { Permissions, PermissionType } from './permissions';
import { ForbiddenError, UnauthorizedError } from '../errors';

export interface UserContext {
  id: string;
  email: string;
  displayName: string;
  roles: UserRoleType[];
  permissions?: PermissionType[];
}

const RolePermissionsMap: Record<UserRoleType, PermissionType[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permissions),
  [UserRole.ADMIN]: Object.values(Permissions),
  [UserRole.TUTOR]: [],
  [UserRole.STUDENT]: [],
};

export function hasRole(user: UserContext | null | undefined, allowedRoles: UserRoleType | UserRoleType[]): boolean {
  if (!user) return false;
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return user.roles.some((r) => roles.includes(r));
}

export function hasPermission(user: UserContext | null | undefined, permission: PermissionType): boolean {
  if (!user) return false;
  if (user.roles.includes(UserRole.SUPER_ADMIN)) return true;

  // Direct explicit permissions
  if (user.permissions && user.permissions.includes(permission)) return true;

  // Role mapped permissions
  return user.roles.some((r) => RolePermissionsMap[r]?.includes(permission));
}

export function requirePermission(user: UserContext | null | undefined, permission: PermissionType): void {
  if (!user) {
    throw new UnauthorizedError();
  }
  if (!hasPermission(user, permission)) {
    throw new ForbiddenError(`Missing required permission: ${permission}`);
  }
}

export function requireRole(user: UserContext | null | undefined, roles: UserRoleType | UserRoleType[]): void {
  if (!user) {
    throw new UnauthorizedError();
  }
  if (!hasRole(user, roles)) {
    throw new ForbiddenError('User does not have the required role.');
  }
}
