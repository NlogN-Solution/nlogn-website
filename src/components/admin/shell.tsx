"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BookOpen,
  Briefcase,
  ChevronDown,
  FolderOpen,
  Gauge,
  Inbox,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  Settings,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { api } from "@/components/admin/api";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import type { Capability } from "@/server/permissions";

/**
 * The dashboard chrome.
 *
 * Navigation is filtered by capability, so a viewer does not see a Settings
 * link that would 403 on click — the menu reflects what this person can
 * actually do rather than what the product can do.
 */

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  capability: Capability;
};

type NavGroup = { heading: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    heading: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard, capability: "content:read" },
    ],
  },
  {
    heading: "Performance",
    items: [
      { label: "SEO & traffic", href: "/admin/seo", icon: TrendingUp, capability: "seo:read" },
    ],
  },
  {
    heading: "Content",
    items: [
      { label: "Blogs", href: "/admin/blogs", icon: BookOpen, capability: "content:read" },
      { label: "Insights", href: "/admin/insights", icon: Lightbulb, capability: "content:read" },
      {
        label: "Case studies",
        href: "/admin/case-studies",
        icon: Briefcase,
        capability: "content:read",
      },
    ],
  },
  {
    heading: "Media",
    items: [
      { label: "Media library", href: "/admin/media", icon: FolderOpen, capability: "media:read" },
    ],
  },
  {
    heading: "Inbox",
    items: [{ label: "Messages", href: "/admin/messages", icon: Inbox, capability: "messages:read" }],
  },
  {
    heading: "System",
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings, capability: "settings:read" },
      { label: "Admin users", href: "/admin/users", icon: Users, capability: "users:read" },
      { label: "Activity log", href: "/admin/activity", icon: Activity, capability: "activity:read" },
      { label: "System status", href: "/admin/system", icon: Gauge, capability: "settings:read" },
    ],
  },
];

export type ShellUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
};

export function AdminShell({
  user,
  capabilities,
  unread,
  children,
}: {
  user: ShellUser;
  capabilities: Capability[];
  unread: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  const allowed = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => capabilities.includes(item.capability)),
  })).filter((group) => group.items.length > 0);

  async function signOut() {
    await api.post("/api/auth/logout").catch(() => undefined);
    router.push("/admin/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const sidebar = (
    <nav aria-label="Dashboard" className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-line px-4">
        <Link href="/admin" className="min-w-0">
          <Logo className="h-6 w-auto" />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="grid size-8 place-items-center rounded-md text-muted hover:bg-canvas lg:hidden"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {allowed.map((group) => (
          <div key={group.heading} className="mb-5">
            <p className="px-2 pb-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
              {group.heading}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.8125rem] font-medium transition-colors",
                        active
                          ? "bg-ink text-white"
                          : "text-ink-soft hover:bg-canvas hover:text-ink",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.href === "/admin/messages" && unread > 0 && (
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-1.5 py-0.5 text-[0.6875rem] font-semibold",
                            active ? "bg-white/20 text-white" : "bg-violet text-white",
                          )}
                        >
                          {unread}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-line p-3">
        <Link
          href="/"
          target="_blank"
          className="block rounded-lg px-2.5 py-2 text-[0.8125rem] text-muted transition-colors hover:bg-canvas hover:text-ink"
        >
          View the website →
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-line bg-surface lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <aside className="absolute inset-y-0 left-0 w-[17rem] max-w-[85vw] border-r border-line bg-surface">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-ink-soft hover:bg-canvas lg:hidden"
          >
            <Menu className="size-4" />
          </button>

          <div className="min-w-0 flex-1" />

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenu((v) => !v)}
              aria-expanded={menu}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-canvas"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-violet text-[0.6875rem] font-bold text-white">
                {user.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="hidden min-w-0 text-left sm:block">
                <span className="block truncate text-[0.8125rem] font-medium text-ink">
                  {user.name}
                </span>
                <span className="block truncate text-[0.6875rem] text-muted">
                  {user.role.replace(/_/g, " ").toLowerCase()}
                </span>
              </span>
              <ChevronDown className="size-3.5 shrink-0 text-muted" aria-hidden />
            </button>

            {menu && (
              <>
                <button
                  type="button"
                  aria-hidden
                  tabIndex={-1}
                  onClick={() => setMenu(false)}
                  className="fixed inset-0 z-10 cursor-default"
                />
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-xl border border-line bg-surface shadow-lift"
                >
                  <div className="border-b border-line px-4 py-3">
                    <p className="truncate text-[0.8125rem] font-medium text-ink">{user.name}</p>
                    <p className="truncate text-[0.75rem] text-muted">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={signOut}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[0.8125rem] text-ink-soft transition-colors hover:bg-canvas hover:text-ink"
                  >
                    <LogOut className="size-4" aria-hidden />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-[80rem] px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-xl font-extrabold tracking-[-0.02em] text-ink">{title}</h1>
        {description && <p className="mt-1 text-[0.8125rem] text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
