/** Human-readable role names, shared by the API and the dashboard UI. */
export const ROLE_LABELS = {
  SUPER_ADMIN: "Super admin",
  CONTENT_MANAGER: "Content manager",
  MARKETING_MANAGER: "Marketing manager",
  VIEWER: "Viewer",
} as const;

export type RoleName = keyof typeof ROLE_LABELS;
