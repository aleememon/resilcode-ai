"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { formatSize } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";

export type FileTreeEntry = { path: string; size: number };

type TreeNode = {
  name: string;
  path: string;
  size: number;
  /** Number of files contained in the node (1 for a file). */
  fileCount: number;
  children: TreeNode[];
};

/** Trees larger than this start fully collapsed so we don't paint 10k rows. */
const AUTO_COLLAPSE_THRESHOLD = 200;

function buildTree(entries: FileTreeEntry[]): TreeNode[] {
  const root: TreeNode = {
    name: "",
    path: "",
    size: 0,
    fileCount: 0,
    children: [],
  };

  for (const entry of entries) {
    const parts = entry.path.split("/").filter(Boolean);
    if (parts.length === 0) continue;

    let parent = root;
    let currentPath = "";

    for (let index = 0; index < parts.length - 1; index += 1) {
      currentPath = currentPath ? `${currentPath}/${parts[index]}` : parts[index];
      let dir = parent.children.find(
        (child) => child.children.length > 0 && child.name === parts[index],
      );
      if (!dir) {
        dir = {
          name: parts[index],
          path: currentPath,
          size: 0,
          fileCount: 0,
          children: [],
        };
        parent.children.push(dir);
      }
      parent = dir;
    }

    const name = parts[parts.length - 1];
    parent.children.push({
      name,
      path: currentPath ? `${currentPath}/${name}` : name,
      size: entry.size,
      fileCount: 1,
      children: [],
    });
  }

  return root.children;
}

function sortTree(nodes: TreeNode[]) {
  nodes.sort((a, b) => {
    const aIsDir = a.children.length > 0;
    const bIsDir = b.children.length > 0;
    if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  for (const node of nodes) sortTree(node.children);
}

/** Post-order pass that fills directory file counts (and dir byte sizes). */
function summarize(node: TreeNode): number {
  if (node.children.length === 0) {
    node.fileCount = 1;
    return 1;
  }
  let total = 0;
  let bytes = 0;
  for (const child of node.children) {
    total += summarize(child);
    bytes += child.size;
  }
  node.fileCount = total;
  node.size = bytes;
  return total;
}

function collectDirs(nodes: TreeNode[], into: Set<string>) {
  for (const node of nodes) {
    if (node.children.length > 0) {
      into.add(node.path);
      collectDirs(node.children, into);
    }
  }
}

type TreeRowProps = {
  node: TreeNode;
  depth: number;
  collapsed: Set<string>;
  onToggle: (path: string) => void;
};

function TreeRow({ node, depth, collapsed, onToggle }: TreeRowProps) {
  const isDir = node.children.length > 0;
  const isOpen = !collapsed.has(node.path);
  const indent = { paddingLeft: `${depth * 14 + 4}px` };

  if (!isDir) {
    return (
      <li>
        <div
          className="flex items-center gap-space-3xs rounded py-[3px] pr-space-2xs text-on-surface-variant"
          style={indent}
        >
          <Icon
            name="description"
            className="shrink-0 text-[15px] text-outline"
          />
          <span className="truncate">{node.name}</span>
          <span className="ml-auto shrink-0 pl-space-xs text-outline">
            {formatSize(node.size)}
          </span>
        </div>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => onToggle(node.path)}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-space-3xs rounded py-[3px] pr-space-2xs text-left text-on-surface transition-colors hover:bg-surface-container-high"
        style={indent}
      >
        <Icon
          name={isOpen ? "folder_open" : "folder"}
          className="shrink-0 text-[15px] text-primary-container"
        />
        <span className="truncate font-semibold">{node.name}</span>
        <span className="ml-auto shrink-0 pl-space-xs text-outline">
          {node.fileCount.toLocaleString()}{" "}
          {node.fileCount === 1 ? "file" : "files"}
        </span>
        <Icon
          name={isOpen ? "expand_more" : "chevron_right"}
          className="shrink-0 text-[15px] text-outline"
        />
      </button>

      {isOpen ? (
        <ul>
          {node.children.map((child) => (
            <TreeRow
              key={child.path}
              node={child}
              depth={depth + 1}
              collapsed={collapsed}
              onToggle={onToggle}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

type FileTreeProps = {
  files: FileTreeEntry[];
  className?: string;
};

/**
 * Renders the flat `files[]` list returned by the scan endpoints as a nested,
 * collapsible folder tree. Shared by the upload and GitHub import panels.
 */
export function FileTree({ files, className }: FileTreeProps) {
  const tree = useMemo(() => {
    const nodes = buildTree(files);
    sortTree(nodes);
    for (const node of nodes) summarize(node);
    return nodes;
  }, [files]);

  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (files.length > AUTO_COLLAPSE_THRESHOLD) collectDirs(tree, initial);
    return initial;
  });

  const toggle = (path: string) => {
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  if (tree.length === 0) {
    return (
      <p
        className={cn(
          "rounded-lg bg-surface-container-lowest/70 p-space-sm text-center font-label-code-sm text-label-code-sm text-outline",
          className,
        )}
      >
        No files to display.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg bg-surface-container-lowest/70 p-space-xs",
        className,
      )}
    >
      <ul
        aria-label="Ingested files"
        className="max-h-64 overflow-y-auto font-label-code-sm text-label-code-sm"
      >
        {tree.map((node) => (
          <TreeRow
            key={node.path}
            node={node}
            depth={0}
            collapsed={collapsed}
            onToggle={toggle}
          />
        ))}
      </ul>
    </div>
  );
}
