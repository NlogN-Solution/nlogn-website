"use client";

import { useState } from "react";
import { CalendarRange, RefreshCw } from "lucide-react";
import { Button, Input } from "@/components/admin/ui";
import { RANGE_PRESETS, type RangePreset } from "@/lib/date-range";
import { cn } from "@/lib/utils";

/**
 * The date range control.
 *
 * One row above the charts, as the whole dashboard's single filter — every
 * panel reads the same range, so a keyword table can never be showing a
 * different fortnight from the chart above it.
 */

export type RangeValue =
  | { preset: RangePreset }
  | { preset: "custom"; start: string; end: string };

export function rangeToParams(value: RangeValue): Record<string, string> {
  return value.preset === "custom"
    ? { range: "custom", start: value.start, end: value.end }
    : { range: value.preset };
}

export function RangePicker({
  value,
  onChange,
  onRefresh,
  refreshing,
}: {
  value: RangeValue;
  onChange: (value: RangeValue) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const [customOpen, setCustomOpen] = useState(value.preset === "custom");
  const [start, setStart] = useState(value.preset === "custom" ? value.start : "");
  const [end, setEnd] = useState(value.preset === "custom" ? value.end : "");

  const apply = () => {
    if (start && end && start <= end) onChange({ preset: "custom", start, end });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        role="group"
        aria-label="Date range"
        className="flex flex-wrap items-center gap-1 rounded-lg border border-line bg-surface p-1"
      >
        {(Object.keys(RANGE_PRESETS) as RangePreset[]).map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={value.preset === preset}
            onClick={() => {
              setCustomOpen(false);
              onChange({ preset });
            }}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-[0.75rem] font-medium transition-colors",
              value.preset === preset
                ? "bg-ink text-white"
                : "text-ink-soft hover:bg-canvas hover:text-ink",
            )}
          >
            {RANGE_PRESETS[preset].label.replace("Last ", "")}
          </button>
        ))}

        <button
          type="button"
          aria-pressed={value.preset === "custom"}
          onClick={() => setCustomOpen((open) => !open)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[0.75rem] font-medium transition-colors",
            value.preset === "custom"
              ? "bg-ink text-white"
              : "text-ink-soft hover:bg-canvas hover:text-ink",
          )}
        >
          <CalendarRange className="size-3.5" aria-hidden />
          Custom
        </button>
      </div>

      {onRefresh && (
        <Button
          size="sm"
          onClick={onRefresh}
          loading={refreshing}
          icon={<RefreshCw className="size-3.5" aria-hidden />}
          title="Fetch the latest data from each connected provider"
        >
          Refresh
        </Button>
      )}

      {customOpen && (
        <div className="flex w-full flex-wrap items-end gap-2 rounded-lg border border-line bg-surface p-3 sm:w-auto">
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-[0.6875rem] font-medium text-muted">From</span>
            <Input
              type="date"
              value={start}
              max={end || undefined}
              onChange={(event) => setStart(event.target.value)}
              className="h-8 py-1 text-[0.8125rem]"
            />
          </label>
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-[0.6875rem] font-medium text-muted">To</span>
            <Input
              type="date"
              value={end}
              min={start || undefined}
              onChange={(event) => setEnd(event.target.value)}
              className="h-8 py-1 text-[0.8125rem]"
            />
          </label>
          <Button size="sm" variant="primary" onClick={apply} disabled={!start || !end || start > end}>
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}
