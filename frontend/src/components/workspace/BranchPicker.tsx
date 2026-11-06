"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "../ui/Icon";
import type { GitHubBranch } from "@/lib/github";

type BranchPickerProps = {
  branches: GitHubBranch[];
  value: string | null;
  defaultBranch?: string | null;
  onChange: (name: string) => void;
};

export function BranchPicker({
  branches,
  value,
  defaultBranch,
  onChange,
}: BranchPickerProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = needle
      ? branches.filter((b) => b.name.toLowerCase().includes(needle))
      : branches;
    // Default branch first, then alphabetical.
    return [...matches].sort((a, b) => {
      if (a.name === defaultBranch) return -1;
      if (b.name === defaultBranch) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [branches, query, defaultBranch]);

  if (branches.length === 0) {
    return (
      <p className="font-label-code-sm text-label-code-sm text-outline">
        No branches found.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-space-2xs rounded-lg bg-surface-container-lowest/80 p-space-xs">
      <div className="relative">
        <Icon
          name="search"
          className="pointer-events-none absolute left-space-xs top-1/2 -translate-y-1/2 text-[18px] text-outline"
        />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${branches.length} branches...`}
          aria-label="Search branches"
          className="w-full rounded bg-surface-container-low py-space-2xs pl-8 pr-space-xs font-label-code-md text-label-code-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-secondary-container"
        />
      </div>

      <div
        role="listbox"
        aria-labelledby="branch-label"
        className="flex max-h-40 flex-col gap-space-3xs overflow-y-auto"
      >
        {filtered.length === 0 ? (
          <p className="p-space-xs text-center font-label-code-sm text-label-code-sm text-outline">
            No branches match “{query}”
          </p>
        ) : null}

        {filtered.map((option) => {
          const selected = option.name === value;
          return (
            <button
              key={option.name}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onChange(option.name)}
              className={cn(
                "flex items-center gap-space-xs rounded p-space-xs text-left transition-colors",
                selected
                  ? "bg-secondary-container/20 text-on-surface"
                  : "text-on-surface-variant hover:bg-surface-container-high",
              )}
            >
              <Icon
                name="fork_right"
                className={cn(
                  "text-[16px]",
                  selected ? "text-secondary-fixed" : "text-outline",
                )}
              />
              <span
                className={cn(
                  "truncate font-label-code-md text-label-code-md",
                  selected && "font-semibold",
                )}
              >
                {option.name}
              </span>
              {option.name === defaultBranch ? (
                <span className="ml-auto rounded-sm bg-secondary-container/30 px-space-3xs font-label-code-sm text-[9px] uppercase text-secondary-fixed">
                  default
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
