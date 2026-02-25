// src/components/TreeNodeRow.tsx
import React, { useMemo, useState } from "react";
import type { TreeNode } from "../types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Props = {
  node: TreeNode;
  depth: number;
  parentId: string;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onSelectDropTarget: (targetParentId: string, beforeNodeId: string | null) => void;
  onEditKey: (nodeId: string, newKey: string) => void;
};

export default function TreeNodeRow(props: Props) {
  const [editing, setEditing] = useState(false);
  const [keyDraft, setKeyDraft] = useState(props.node.key);

  const sortable = useSortable({ id: props.node.id });
  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(sortable.transform),
      transition: sortable.transition
    }),
    [sortable.transform, sortable.transition]
  );

  const hasKids = (props.node.children?.length ?? 0) > 0 && (props.node.type === "object" || props.node.type === "array");

  return (
    <div
      ref={sortable.setNodeRef}
      style={style}
      className={`row ${sortable.isDragging ? "rowDragging" : ""}`}
      onMouseEnter={() => props.onSelectDropTarget(props.parentId, props.node.id)}
    >
      <div className="rowLeft" style={{ paddingLeft: `${12 + props.depth * 18}px` }}>
        <button
          className={`twisty ${hasKids ? "" : "twistyHidden"}`}
          onClick={() => hasKids && props.onToggleExpand(props.node.id)}
          title={hasKids ? "Expand or collapse" : ""}
        >
          {props.isExpanded ? "▾" : "▸"}
        </button>

        <span
          className={`typePill type_${props.node.type}`}
          title={props.node.type}
        >
          {props.node.type}
        </span>

        {!editing && (
          <button
            className="keyBtn"
            onClick={() => {
              setKeyDraft(props.node.key);
              setEditing(true);
            }}
            title="Rename key"
          >
            {props.node.key}
          </button>
        )}

        {editing && (
          <div className="keyEdit">
            <input
              className="keyInput"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  props.onEditKey(props.node.id, keyDraft.trim());
                  setEditing(false);
                }
                if (e.key === "Escape") setEditing(false);
              }}
              autoFocus
            />
            <button
              className="miniBtn"
              onClick={() => {
                props.onEditKey(props.node.id, keyDraft.trim());
                setEditing(false);
              }}
              title="Save"
            >
              ✓
            </button>
            <button className="miniBtn" onClick={() => setEditing(false)} title="Cancel">
              ✕
            </button>
          </div>
        )}
      </div>

      <div className="rowRight">
        <button
          className="dragHandle"
          ref={sortable.setActivatorNodeRef}
          {...sortable.listeners}
          {...sortable.attributes}
          title="Drag"
        >
          ⠿
        </button>

        {props.node.type === "primitive" && (
          <span className="valuePreview" title={String(props.node.value)}>
            {String(props.node.value)}
          </span>
        )}

        {props.node.type !== "primitive" && (
          <span className="valuePreview" title="Container">
            {props.node.type === "object" ? `{${props.node.children?.length ?? 0}}` : `[${props.node.children?.length ?? 0}]`}
          </span>
        )}
      </div>
    </div>
  );
}