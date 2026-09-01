"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { api, ApiError } from "@/components/admin/api";
import { Banner, Button, Field, Input } from "@/components/admin/ui";

/**
 * Sign-in.
 *
 * The failure message is the same for a wrong password and an unknown address —
 * telling someone which half they got right is how an attacker enumerates
 * accounts.
 */
export function LoginForm({
  configured,
  hasAdmins,
}: {
  configured: boolean;
  hasAdmins: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/auth/login", { email, password });
      // A full navigation, so the layout re-runs and picks up the session.
      router.push(next.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError && err.status !== 500
          ? "That email and password do not match an active account."
          : "Something went wrong signing in. Try again.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex justify-center">
        <Logo className="h-7 w-auto" />
      </div>

      <div className="rounded-xl border border-line bg-surface p-6 sm:p-8">
        <h1 className="font-display text-lg font-extrabold tracking-[-0.02em] text-ink">
          Sign in to the dashboard
        </h1>
        <p className="mt-1.5 text-[0.8125rem] text-muted">
          The control centre for the nlogn website.
        </p>

        {!configured && (
          <div className="mt-5">
            <Banner tone="warning">
              <code>DATABASE_URL</code> is not set, so the dashboard cannot sign anyone in.
            </Banner>
          </div>
        )}

        {configured && !hasAdmins && (
          <div className="mt-5">
            <Banner tone="warning">
              No admin account exists yet. Run <code>npm run db:seed</code> to create the first one.
            </Banner>
          </div>
        )}

        {error && (
          <div className="mt-5">
            <Banner tone="error">{error}</Banner>
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Email" htmlFor="email" required>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@nlogn.com"
              disabled={!configured}
            />
          </Field>

          <Field label="Password" htmlFor="password" required>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!configured}
            />
          </Field>

          <Button
            type="submit"
            variant="primary"
            loading={busy}
            disabled={!configured}
            className="w-full"
          >
            Sign in
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-[0.75rem] text-muted">
        This area is not indexed and is for nlogn staff only.
      </p>
    </div>
  );
}
