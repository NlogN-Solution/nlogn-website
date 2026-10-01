import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

/**
 * One response envelope for the whole API, and one place that decides what an
 * error is allowed to say. Internal messages and stack traces never reach a
 * client — the log keeps the detail, the caller gets a code.
 */

export type ApiError = {
  code: string;
  message: string;
  /** Field-level messages, only ever for validation failures. */
  fields?: Record<string, string>;
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true as const, data }, init);
}

export function fail(
  code: string,
  message: string,
  status = 400,
  extra?: Omit<ApiError, "code" | "message">,
) {
  return NextResponse.json(
    { success: false as const, error: { code, message, ...extra } },
    { status },
  );
}

export const errors = {
  unauthorized: () => fail("UNAUTHORIZED", "You need to sign in to do that.", 401),
  forbidden: () => fail("FORBIDDEN", "Your role does not allow that action.", 403),
  notFound: (what = "That record") => fail("NOT_FOUND", `${what} could not be found.`, 404),
  conflict: (message: string) => fail("CONFLICT", message, 409),
  tooMany: (retryAfter: number) =>
    NextResponse.json(
      {
        success: false as const,
        error: { code: "RATE_LIMITED", message: "Too many requests. Try again shortly." },
      },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    ),
  badRequest: (message: string) => fail("BAD_REQUEST", message, 400),
  server: () => fail("INTERNAL_ERROR", "Something went wrong on our side.", 500),
};

/** Turns a ZodError into a field map the admin forms can render inline. */
export function validationFailed(error: ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!fields[key]) fields[key] = issue.message;
  }
  return fail("VALIDATION_ERROR", "Please check the highlighted fields.", 422, { fields });
}

/** Parses a JSON body against a schema, returning either the value or a response. */
export async function readBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<{ data: T; response?: never } | { data?: never; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { response: errors.badRequest("We could not read that request body.") };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { response: validationFailed(parsed.error) };
  return { data: parsed.data };
}

/**
 * Wraps a handler so an unexpected throw becomes a 500 with no internals in it.
 * Anything deliberate should be returned through `fail`/`errors` instead.
 */
export function handler<Args extends unknown[]>(
  fn: (...args: Args) => Promise<NextResponse>,
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof ZodError) return validationFailed(error);
      console.error("[api] unhandled error:", error);
      return errors.server();
    }
  };
}

/** Standard list query parsing, shared by every paginated admin endpoint. */
export function readListParams(url: URL, { maxPerPage = 100 } = {}) {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const perPageRaw = Number(url.searchParams.get("perPage") ?? 20) || 20;
  const perPage = Math.min(maxPerPage, Math.max(1, perPageRaw));
  return {
    page,
    perPage,
    skip: (page - 1) * perPage,
    take: perPage,
    q: url.searchParams.get("q")?.trim() || undefined,
    status: url.searchParams.get("status")?.trim() || undefined,
    category: url.searchParams.get("category")?.trim() || undefined,
    sort: url.searchParams.get("sort")?.trim() || "newest",
  };
}

export function paginated<T>(items: T[], total: number, page: number, perPage: number) {
  return {
    items,
    pagination: {
      page,
      perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
      hasNext: page * perPage < total,
      hasPrev: page > 1,
    },
  };
}
