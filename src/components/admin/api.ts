"use client";

/**
 * The admin client's single door to the API.
 *
 * Every call unwraps the `{ success, data | error }` envelope, so a component
 * deals in values and thrown `ApiError`s rather than in response shapes. Field-
 * level validation messages ride along on the error, which is what lets forms
 * highlight the offending input instead of showing one generic banner.
 */

export class ApiError extends Error {
  code: string;
  status: number;
  fields?: Record<string, string>;

  constructor(message: string, code: string, status: number, fields?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers:
      init?.body instanceof FormData
        ? init?.headers
        : { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    credentials: "same-origin",
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    // A 204 or an HTML error page — fall through to the status check.
  }

  const body = payload as
    | { success: true; data: T }
    | { success: false; error: { code: string; message: string; fields?: Record<string, string> } }
    | null;

  if (!res.ok || !body || body.success === false) {
    const error = body && body.success === false ? body.error : null;
    // A dead session should land on the login page, not on a confusing error.
    // A full navigation on purpose: the admin layout resolves the session on
    // the server, and a client-side router push would reuse the stale tree.
    if (res.status === 401 && typeof window !== "undefined") {
      const next = encodeURIComponent(window.location.pathname);
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `/admin/login?next=${next}`;
    }
    throw new ApiError(
      error?.message ?? `Request failed (${res.status}).`,
      error?.code ?? "REQUEST_FAILED",
      res.status,
      error?.fields,
    );
  }

  return body.data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, form: FormData) =>
    request<T>(path, { method: "POST", body: form }),
};

/** Query-string builder that drops empty values rather than sending `?q=`. */
export function qs(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}
