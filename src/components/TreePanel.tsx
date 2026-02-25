import React, { useMemo } from "react";
import type { TreeNode } from "../types";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import TreeNodeRow from "./TreeNodeRow";

type Props = {
  title: string;
  root: TreeNode;
  expanded: Set<string>;
  onToggleExpand: (id: string) => void;

  onCollapseAll: () => void;
  onExpandOneLevel: () => void;

  dropTarget: { parentId: string; beforeNodeId: string | null } | null;
  onSelectDropTarget: (parentId: string, beforeNodeId: string | null) => void;

  onDragStart: (activeId: string) => void;
  onDragOver: (activeId: string, overId: string | null) => void;
  onDragEnd: (activeId: string, overId: string | null) => void;

  onEditKey: (nodeId: string, newKey: string) => void;
};

export default function TreePanel(props: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const rootKids = props.root.children ?? [];
  const ids = useMemo(() => rootKids.map((c) => c.id), [rootKids]);

  function renderSubtree(nodes: TreeNode[], parentId: string, depth: number) {
    return (
      <SortableContext items={nodes.map((n) => n.id)} strategy={verticalListSortingStrategy}>
        {nodes.map((n) => {
          const isExpanded = props.expanded.has(n.id);
          const hasKids =
            (n.type === "object" || n.type === "array") && (n.children?.length ?? 0) > 0;

          const canShowChildren = hasKids && isExpanded;

          return (
            <React.Fragment key={n.id}>
              <TreeNodeRow
                node={n}
                depth={depth}
                parentId={parentId}
                isExpanded={isExpanded}
                onToggleExpand={props.onToggleExpand}
                onSelectDropTarget={props.onSelectDropTarget}
                onEditKey={props.onEditKey}
              />
              {canShowChildren && (
                <div className="subtree">{renderSubtree(n.children ?? [], n.id, depth + 1)}</div>
              )}
            </React.Fragment>
          );
        })}
      </SortableContext>
    );
  }

  return (
    <section className="panel">
      <div className="panelHeader">
        <div className="panelTitle">{props.title}</div>

        <div className="panelHeaderRight">
          <button className="btnGhost" onClick={props.onCollapseAll} title="Collapse everything">
            Collapse all
          </button>
          <button className="btnGhost" onClick={props.onExpandOneLevel} title="Expand root and first level">
            Expand 1 level
          </button>
        </div>
      </div>

      <div className="panelBody treeWrap">
        <DndContext
          sensors={sensors}
          onDragStart={(e: DragStartEvent) => props.onDragStart(String(e.active.id))}
          onDragOver={(e: DragOverEvent) => {
            const activeId = String(e.active.id);
            const overId = e.over ? String(e.over.id) : null;
            props.onDragOver(activeId, overId);
          }}
          onDragEnd={(e: DragEndEvent) => {
            const activeId = String(e.active.id);
            const overId = e.over ? String(e.over.id) : null;
            props.onDragEnd(activeId, overId);
          }}
        >
          <div className="treeList" onMouseEnter={() => props.onSelectDropTarget(props.root.id, null)}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              {renderSubtree(rootKids, props.root.id, 0)}
            </SortableContext>
          </div>
        </DndContext>
      </div>
    </section>
  );
}