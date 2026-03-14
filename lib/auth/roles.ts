export const APP_ROLES = [
  "admin",
  "tax_manager",
  "accountant",
  "viewer",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_RANK: Record<AppRole, number> = {
  admin: 4,
  tax_manager: 3,
  accountant: 2,
  viewer: 1,
};

export function hasRequiredRole(userRole: AppRole, minimumRole: AppRole) {
  return ROLE_RANK[userRole] >= ROLE_RANK[minimumRole];
}
