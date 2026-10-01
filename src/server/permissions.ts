import type { AdminRole } from "@/generated/prisma";

/**
 * Capability-based access control.
 *
 * Roles map to capabilities here rather than being checked directly in route
 * handlers, so adding a role or moving a capability is an edit to one table
 * instead of a hunt through the API.
 */

export const CAPABILITIES = [
  "content:read",
  "content:write",
  "content:publish",
  "content:delete",
  "media:read",
  "media:write",
  "media:delete",
  "messages:read",
  "messages:write",
  "settings:read",
  "settings:write",
  "users:read",
  "users:write",
  "activity:read",
  "seo:read",
  "seo:write",
  "seo:connect",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

const ROLE_CAPABILITIES: Record<AdminRole, readonly Capability[]> = {
  SUPER_ADMIN: CAPABILITIES,
  CONTENT_MANAGER: [
    "content:read",
    "content:write",
    "content:publish",
    "content:delete",
    "media:read",
    "media:write",
    "media:delete",
    "messages:read",
    "settings:read",
    "activity:read",
    "seo:read",
  ],
  MARKETING_MANAGER: [
    "content:read",
    "content:write",
    "content:publish",
    "media:read",
    "media:write",
    "messages:read",
    "messages:write",
    "settings:read",
    "settings:write",
    "activity:read",
    // Marketing owns the SEO dashboard day to day, including triggering a sync
    // and running a crawl. Connecting a Google account is `seo:connect` and
    // stays with the super admin, because that grants access to an account
    // outside this application.
    "seo:read",
    "seo:write",
  ],
  VIEWER: ["content:read", "media:read", "messages:read", "activity:read", "seo:read"],
};

export function can(role: AdminRole, capability: Capability) {
  return ROLE_CAPABILITIES[role].includes(capability);
}

export function capabilitiesFor(role: AdminRole) {
  return [...ROLE_CAPABILITIES[role]];
}

// Display labels live in `config/roles` so the admin UI can import them without
// reaching into `server/`.
export { ROLE_LABELS } from "@/config/roles";
