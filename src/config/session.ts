/**
 * The admin session cookie's name, and nothing else.
 *
 * Middleware runs on the Edge runtime, where `node:crypto`, `bcryptjs` and the
 * Prisma client cannot be imported. Keeping the name here lets middleware read
 * the cookie without pulling the whole authentication module — and its Node-only
 * dependencies — across that boundary.
 */
export const SESSION_COOKIE = "nlogn_admin_session";

/** How long a session lasts before it has to be re-established. */
export const SESSION_DAYS = 7;
