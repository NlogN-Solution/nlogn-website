"use client";

import { useMemo, useState } from "react";
import { ResourceCard } from "@/components/resources/resource-card";
import { RESOURCE_TYPE_CHIPS } from "@/config/resources";
import { Reveal } from "@/components/ui/reveal";
import type { PublicResource } from "@/server/services/resource.service";

/**
 * The shelf, with its filter.
 *
 * Filtering client-side over the whole published set rather than through the
 * server: a library of this size is a few kilobytes of JSON, and a filter that
 * responds on tap beats one that costs a round trip on a phone connection. If
 * this ever grows past a few hundred items, this is the component to move back
 * onto the server, not the page around it.
 */
export function ResourceLibrary({ resources }: { resources: PublicResource[] }) {
  const [type, setType] = useState<string>("all");

  // Only the types actually present get a filter button — an empty shelf behind
  // a tab is worse than no tab.
  const types = useMemo(() => {
    const present = new Set(resources.map((resource) => resource.type));
    return [...present];
  }, [resources]);

  const shown = useMemo(
    () => (type === "all" ? resources : resources.filter((resource) => resource.type === type)),
    [resources, type],
  );

  return (
    <>
      {types.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <FilterChip active={type === "all"} onClick={() => setType("all")}>
            Everything
          </FilterChip>
          {types.map((name) => (
            <FilterChip key={name} active={type === name} onClick={() => setType(name)}>
              {RESOURCE_TYPE_CHIPS[name]}
            </FilterChip>
          ))}
        </div>
      )}

      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((resource, index) => (
          <Reveal as="li" key={resource.slug} delay={Math.min(index, 5) * 0.06} className="h-full">
            <ResourceCard resource={resource} />
          </Reveal>
        ))}
      </ul>
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "rounded-full border border-ink bg-ink px-4 py-2 text-sm font-medium text-white"
          : "rounded-full border border-line px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-violet/40 hover:text-ink"
      }
    >
      {children}
    </button>
  );
}
