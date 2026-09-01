"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { api, ApiError } from "@/components/admin/api";
import { useToast } from "@/components/admin/toast";
import { PageHeader } from "@/components/admin/shell";
import {
  Banner,
  Button,
  ConfirmDialog,
  Field,
  Input,
  Modal,
  Panel,
  Select,
} from "@/components/admin/ui";
import { ROLE_LABELS } from "@/config/roles";
import { cn } from "@/lib/utils";

/**
 * Admin accounts.
 *
 * Roles are coarse on purpose — four of them, mapped to capabilities in
 * `server/permissions.ts`. A per-user permission matrix would be more flexible
 * and, for a team this size, harder to reason about than it is worth.
 */

type User = {
  id: string;
  email: string;
  name: string;
  role: keyof typeof ROLE_LABELS;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

const ROLES = Object.keys(ROLE_LABELS) as (keyof typeof ROLE_LABELS)[];

export function UsersManager({
  initial,
  currentUserId,
}: {
  initial: User[];
  currentUserId: string;
}) {
  const router = useRouter();
  const toast = useToast();

  const [users, setUsers] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<User | null>(null);

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "VIEWER" as User["role"] });

  async function refresh() {
    const next = await api.get<User[]>("/api/admin/users").catch(() => null);
    if (next) setUsers(next);
    router.refresh();
  }

  async function create() {
    setBusy(true);
    setError(null);
    setFieldErrors({});
    try {
      await api.post("/api/admin/users", form);
      toast(`${form.email} can now sign in.`, "success");
      setCreating(false);
      setForm({ name: "", email: "", password: "", role: "VIEWER" });
      refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fields ?? {});
        setError(err.message);
      } else {
        setError("Could not create that account.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function update(user: User, patch: Record<string, unknown>) {
    try {
      await api.patch(`/api/admin/users/${user.id}`, patch);
      toast("Account updated.", "success");
      refresh();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not update that account.", "error");
    }
  }

  async function remove() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await api.del(`/api/admin/users/${pendingDelete.id}`);
      toast("Account deleted.", "success");
      setPendingDelete(null);
      refresh();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not delete that account.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Admin users"
        description="Who can sign in, and what they are allowed to do."
        action={
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
            Add user
          </Button>
        }
      />

      <Panel>
        <ul className="divide-y divide-line">
          {users.map((user) => (
            <li key={user.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
              <span className="min-w-0 flex-1 basis-full sm:basis-auto">
                <span className="block truncate text-[0.875rem] font-medium text-ink">
                  {user.name}
                  {user.id === currentUserId && (
                    <span className="ml-2 text-[0.6875rem] font-normal text-muted">(you)</span>
                  )}
                </span>
                <span className="block truncate text-[0.75rem] text-muted">
                  {user.email}
                  {user.lastLoginAt
                    ? ` · last in ${new Date(user.lastLoginAt).toLocaleDateString("en-GB")}`
                    : " · never signed in"}
                </span>
              </span>

              <Select
                value={user.role}
                aria-label={`Role for ${user.name}`}
                className="w-44 shrink-0"
                disabled={user.id === currentUserId}
                onChange={(e) => update(user, { role: e.target.value })}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </Select>

              <button
                type="button"
                disabled={user.id === currentUserId}
                onClick={() => update(user, { isActive: !user.isActive })}
                className={cn(
                  "shrink-0 rounded-full border px-2.5 py-1 text-[0.6875rem] font-medium transition-colors disabled:opacity-50",
                  user.isActive
                    ? "border-emerald-600/25 bg-emerald-500/10 text-emerald-700"
                    : "border-line bg-canvas text-muted",
                )}
              >
                {user.isActive ? "Active" : "Disabled"}
              </button>

              <button
                type="button"
                disabled={user.id === currentUserId}
                onClick={() => setPendingDelete(user)}
                aria-label={`Delete ${user.name}`}
                className="grid size-8 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      <p className="mt-4 text-[0.75rem] leading-relaxed text-muted">
        Disabling an account or changing its password ends that person&apos;s open sessions
        immediately. The last active super admin cannot be demoted, disabled or deleted.
      </p>

      <Modal open={creating} onClose={() => setCreating(false)} title="Add an admin user">
        <div className="space-y-4 p-5">
          {error && <Banner tone="error">{error}</Banner>}

          <Field label="Name" htmlFor="u-name" required error={fieldErrors.name}>
            <Input id="u-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email" htmlFor="u-email" required error={fieldErrors.email}>
            <Input id="u-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field
            label="Password"
            htmlFor="u-password"
            required
            error={fieldErrors.password}
            hint="At least 12 characters. Length matters more than symbols."
          >
            <Input
              id="u-password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          <Field label="Role" htmlFor="u-role" error={fieldErrors.role}>
            <Select
              id="u-role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as User["role"] })}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setCreating(false)}>Cancel</Button>
            <Button variant="primary" loading={busy} onClick={create}>
              Create account
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={remove}
        loading={busy}
        title="Delete this account?"
        body={
          <>
            <strong className="font-semibold text-ink">{pendingDelete?.email}</strong> will lose
            access immediately. Content they created stays, but the byline link is removed.
            Disabling the account is reversible; this is not.
          </>
        }
      />
    </>
  );
}
