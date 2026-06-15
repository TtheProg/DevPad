import { useState } from "react";
import type { TreeNode } from "../lib/json/tree";

const typeColor: Record<string, string> = {
  string: "text-[var(--color-ok)]",
  number: "text-[var(--color-accent)]",
  boolean: "text-purple-400",
  null: "text-[var(--color-muted)]",
};

function Leaf({ node }: { node: TreeNode }) {
  const display =
    node.type === "string" ? `"${node.value}"` : String(node.value);
  return (
    <span className="font-mono text-sm">
      {node.key !== null && (
        <span className="text-[var(--color-muted)]">{node.key}: </span>
      )}
      <span className={typeColor[node.type] ?? ""}>{display}</span>
    </span>
  );
}

function Branch({ node, depth }: { node: TreeNode; depth: number }) {
  const [open, setOpen] = useState(depth < 1);
  const bracket = node.type === "array" ? ["[", "]"] : ["{", "}"];

  return (
    <div className="font-mono text-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 hover:text-[var(--color-accent)]"
        aria-expanded={open}
      >
        <span className="text-[var(--color-muted)] w-3 inline-block">
          {open ? "▾" : "▸"}
        </span>
        {node.key !== null && (
          <span className="text-[var(--color-muted)]">{node.key}: </span>
        )}
        <span>{bracket[0]}</span>
        {!open && (
          <span className="text-[var(--color-muted)]">
            {node.size} {node.size === 1 ? "item" : "items"}
            {bracket[1]}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="ml-4 border-l border-[var(--color-border)] pl-3">
            {node.children?.map((child, i) => (
              <div key={i} className="py-0.5">
                <TreeRow node={child} depth={depth + 1} />
              </div>
            ))}
          </div>
          <div className="text-[var(--color-fg)]">{bracket[1]}</div>
        </>
      )}
    </div>
  );
}

function TreeRow({ node, depth }: { node: TreeNode; depth: number }) {
  if (node.type === "object" || node.type === "array") {
    return <Branch node={node} depth={depth} />;
  }
  return <Leaf node={node} />;
}

export function TreeView({ root }: { root: TreeNode }) {
  return (
    <div className="overflow-auto p-3">
      <TreeRow node={root} depth={0} />
    </div>
  );
}
