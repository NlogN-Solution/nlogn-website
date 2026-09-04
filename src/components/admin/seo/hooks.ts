"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, qs, ApiError } from "@/components/admin/api";

/**
 * One endpoint, one panel.
 *
 * Each section fetches independently rather than the page waiting on one large
 * request, so Search Console being slow leaves the traffic chart interactive.
 * That is also what lets a disconnected provider render its own explanation
 * while everything around it works.
<<<<<<< Updated upstream
 *
 * `loading` is derived from whether the settled result matches the request we
 * currently want, rather than being flipped on by the effect. Setting state
 * synchronously inside an effect schedules a second render before the browser
 * paints, and with nine of these on one page that is nine wasted render passes
 * every time the date range changes.
 *
 * The last successful payload is kept while a new one is in flight, so changing
 * the range redraws the charts once with new data instead of blanking them to a
 * skeleton and back.
=======
>>>>>>> Stashed changes
 */

export type Loadable<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: (options?: { refresh?: boolean }) => void;
};

<<<<<<< Updated upstream
type Settled<T> = { key: string; nonce: number; data: T | null; error: string | null };

=======
>>>>>>> Stashed changes
export function useEndpoint<T>(
  path: string | null,
  params: Record<string, string | number | undefined> = {},
): Loadable<T> {
<<<<<<< Updated upstream
  // Serialised, so an object literal in the caller does not re-fire the effect
  // on every render.
  const key = `${path}${qs(params)}`;

  const [nonce, setNonce] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  /** Set by `reload({ refresh: true })`; consumed by the next request only. */
  const forceNext = useRef(false);

  const current = settled?.key === key && settled.nonce === nonce ? settled : null;
  const loading = Boolean(path) && current === null;

  useEffect(() => {
    if (!path) return;

    let cancelled = false;
    const refresh = forceNext.current;
    forceNext.current = false;

    void (async () => {
      try {
        const result = await api.get<T>(
          `${path}${qs({ ...params, ...(refresh ? { refresh: "1" } : {}) })}`,
        );
        // A slower earlier request must not overwrite a newer response — the
        // usual cause of a chart snapping back to the previous date range.
        if (!cancelled) setSettled({ key, nonce, data: result, error: null });
      } catch (caught) {
        if (cancelled) return;
        setSettled({
          key,
          nonce,
          data: null,
          error: caught instanceof ApiError ? caught.message : "Something went wrong loading this.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
    // `key` already encodes `path` and every parameter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce]);

  const reload = useCallback((options: { refresh?: boolean } = {}) => {
    if (options.refresh) forceNext.current = true;
    setNonce((value) => value + 1);
  }, []);

  return {
    // Deliberately the last payload rather than `current`: holding the previous
    // period's data on screen while the next loads is what stops every panel
    // flashing a skeleton on a range change.
    data: settled?.data ?? null,
    loading,
    error: current?.error ?? null,
    reload,
  };
=======
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState<string | null>(null);

  // Serialised, so an object literal in the caller does not re-fire the effect
  // on every render.
  const key = `${path}${qs(params)}`;
  const latest = useRef(0);

  const load = useCallback(
    async (options: { refresh?: boolean } = {}) => {
      if (!path) return;

      const ticket = ++latest.current;
      setLoading(true);
      setError(null);

      try {
        const result = await api.get<T>(
          `${path}${qs({ ...params, ...(options.refresh ? { refresh: "1" } : {}) })}`,
        );
        // A slower earlier request must not overwrite a newer response — the
        // usual cause of a chart snapping back to the previous date range.
        if (ticket === latest.current) setData(result);
      } catch (caught) {
        if (ticket !== latest.current) return;
        setError(
          caught instanceof ApiError ? caught.message : "Something went wrong loading this.",
        );
      } finally {
        if (ticket === latest.current) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
>>>>>>> Stashed changes
}

/* ── shared response shapes ──────────────────────────────────────────────── */

export type Delta = {
  current: number;
  previous: number;
  change: number;
  changePct: number | null;
  direction: "up" | "down" | "flat";
  sentiment: "positive" | "negative" | "neutral";
};

export type Disconnected = { connected: false; reason: string };

export type Connected<T> = {
  connected: true;
  data: T;
  fetchedAt: string;
  stale: boolean;
  error?: string;
};

export type Reported<T> = Disconnected | Connected<T>;

export type Pagination = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};
