import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar";
import JsonEditor from "./components/JsonEditor";
import TreePanel from "./components/TreePanel";
import type { JsonFile, TreeNode, JsonValue } from "./types";
import { downloadText, loadActiveFileId, loadFiles, saveActiveFileId, saveFiles } from "./utils/storage";
import {
  canAcceptChild,
  cloneTree,
  findNode,
  findParentOf,
  normalizeArrayIndices,
  parseJsonText,
  prettyJson,
  sanitizeKeyForParent,
  treeToValue,
  valueToTree
} from "./utils/jsonTree";

function uid(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

const DEFAULT_JSON = `{
  "cars": {
    "1": {
      "models": ["Evo VIII", "Evo IX"]
    },
    "2": {
      "models": ["Evo X"]
    }
  },
  "meta": {
    "source": "demo",
    "count": 2
  }
}`;

export default function App() {
  const [files, setFiles] = useState<JsonFile[]>(() => {
    const stored = loadFiles();
    if (stored && stored.length) return stored;

    const first: JsonFile = {
      id: uid(),
      name: "demo.json",
      jsonText: DEFAULT_JSON,
      updatedAt: Date.now()
    };
    saveFiles([first]);
    saveActiveFileId(first.id);
    return [first];
  });

  const [activeId, setActiveId] = useState<string>(() => loadActiveFileId() ?? files[0]?.id ?? "");

  const activeFile = useMemo(() => files.find((f) => f.id === activeId) ?? files[0], [files, activeId]);

  const [sidebarMin, setSidebarMin] = useState(false);

  // Left editor (original snapshot, read-only)
  const [originalText, setOriginalText] = useState<string>(activeFile?.jsonText ?? DEFAULT_JSON);

  // Right editor (updated editable JSON, saved to file)
  const [updatedText, setUpdatedText] = useState<string>(activeFile?.jsonText ?? DEFAULT_JSON);
  const [updatedError, setUpdatedError] = useState<string | null>(null);

  // Middle structure
  const [treeRoot, setTreeRoot] = useState<TreeNode>(() => {
    const { value } = parseJsonText(updatedText);
    return value ? valueToTree(value, "$") : valueToTree({}, "$");
  });

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set<string>());
  const [dropTarget, setDropTarget] = useState<{ parentId: string; beforeNodeId: string | null } | null>(null);

  useEffect(() => {
    if (!activeFile) return;

    // when switching files, snapshot original and load updated
    setOriginalText(activeFile.jsonText);
    setUpdatedText(activeFile.jsonText);

    const parsed = parseJsonText(activeFile.jsonText);
    setUpdatedError(parsed.error);

    if (parsed.value) {
      const root = valueToTree(parsed.value, "$");
      setTreeRoot(root);

      const nextExpanded = new Set<string>();
      nextExpanded.add(root.id);
      // expand one level by default for readability
      (root.children ?? []).forEach((c) => nextExpanded.add(c.id));
      setExpanded(nextExpanded);
    }
  }, [activeFile?.id]);

  useEffect(() => {
    if (activeFile?.id) saveActiveFileId(activeFile.id);
  }, [activeFile?.id]);

  function persistFileJsonText(fileId: string, jsonText: string) {
    setFiles((prev) => {
      const next = prev.map((f) => (f.id === fileId ? { ...f, jsonText, updatedAt: Date.now() } : f));
      saveFiles(next);
      return next;
    });
  }

  // FIX: Cancel should not create a file, and empty names should not create a file
  function addNewFile() {
    const name = prompt("New file name", `file-${files.length + 1}.json`);

    // user clicked Cancel
    if (name === null) return;

    const trimmed = name.trim();

    // user hit OK with empty name
    if (!trimmed) return;

    const finalName = trimmed.endsWith(".json") ? trimmed : `${trimmed}.json`;

    const file: JsonFile = {
      id: uid(),
      name: finalName,
      jsonText: `{\n  \n}\n`,
      updatedAt: Date.now()
    };

    const next = [file, ...files];
    setFiles(next);
    saveFiles(next);
    setActiveId(file.id);
  }

  function renameFile(id: string, name: string) {
    setFiles((prev) => {
      const next = prev.map((f) => (f.id === id ? { ...f, name, updatedAt: Date.now() } : f));
      saveFiles(next);
      return next;
    });
  }

  function deleteFile(id: string) {
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      saveFiles(next);
      if (activeId === id) {
        const newActive = next[0]?.id ?? "";
        setActiveId(newActive);
        if (newActive) saveActiveFileId(newActive);
      }
      return next;
    });
  }

  async function importJsonFile(file: File) {
    const text = await file.text();
    const parsed = parseJsonText(text);
    if (parsed.error) {
      alert(`Import failed: ${parsed.error}`);
      return;
    }
    const formatted = prettyJson(parsed.value as JsonValue);
    const newFile: JsonFile = {
      id: uid(),
      name: file.name,
      jsonText: formatted,
      updatedAt: Date.now()
    };
    const next = [newFile, ...files];
    setFiles(next);
    saveFiles(next);
    setActiveId(newFile.id);
  }

  function exportJsonFile(fileId: string) {
    const f = files.find((x) => x.id === fileId);
    if (!f) return;
    downloadText(f.name, f.jsonText);
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function collapseAll() {
    setExpanded(() => new Set<string>([treeRoot.id]));
  }

  function expandOneLevel() {
    setExpanded(() => {
      const next = new Set<string>();
      next.add(treeRoot.id);
      (treeRoot.children ?? []).forEach((c) => next.add(c.id));
      return next;
    });
  }

  function onSelectDropTarget(parentId: string, beforeNodeId: string | null) {
    setDropTarget({ parentId, beforeNodeId });
  }

  function onEditKey(nodeId: string, newKey: string) {
    if (!newKey) return;

    setTreeRoot((prev) => {
      const next = cloneTree(prev);
      const node = findNode(next, nodeId);
      if (!node) return prev;

      const parentInfo = findParentOf(next, nodeId);
      if (!parentInfo) return prev;

      const parent = parentInfo.parent;
      if (parent.type === "array") return prev;

      const safeKey = sanitizeKeyForParent(parent, newKey);
      node.key = safeKey;
      return next;
    });
  }

  function onDragStart(_activeId: string) {
    // no-op
  }

  function onDragOver(_activeId: string, overId: string | null) {
    if (!overId) return;

    setTreeRoot((prev) => {
      const next = cloneTree(prev);

      const overNode = findNode(next, overId);
      if (!overNode) return prev;

      if (canAcceptChild(overNode)) {
        setDropTarget({ parentId: overNode.id, beforeNodeId: null });
      } else {
        const overInfo = findParentOf(next, overId);
        if (!overInfo) return prev;
        setDropTarget({ parentId: overInfo.parent.id, beforeNodeId: overId });
      }

      return next;
    });
  }

  function onDragEnd(activeId: string, _overId: string | null) {
    if (!dropTarget) return;

    setTreeRoot((prev) => {
      const next = cloneTree(prev);

      const fromInfo = findParentOf(next, activeId);
      if (!fromInfo) return prev;

      const fromParent = fromInfo.parent;
      const fromIndex = fromInfo.index;

      const activeNode = fromParent.children?.[fromIndex];
      if (!activeNode) return prev;

      const toParent = findNode(next, dropTarget.parentId);
      if (!toParent || !canAcceptChild(toParent)) return prev;

      if (!fromParent.children) fromParent.children = [];
      if (!toParent.children) toParent.children = [];

      fromParent.children.splice(fromIndex, 1);

      let toIndex = toParent.children.length;
      if (dropTarget.beforeNodeId) {
        const idx = toParent.children.findIndex((c) => c.id === dropTarget.beforeNodeId);
        toIndex = idx >= 0 ? idx : toParent.children.length;
      }

      if (toParent.type === "object") {
        activeNode.key = sanitizeKeyForParent(toParent, activeNode.key);
      }

      toParent.children.splice(toIndex, 0, activeNode);

      normalizeArrayIndices(next);

      return next;
    });
  }

  function onUpdatedEditorChange(v: string) {
    setUpdatedText(v);

    const parsed = parseJsonText(v);
    setUpdatedError(parsed.error);

    if (activeFile?.id) persistFileJsonText(activeFile.id, v);
  }

  function formatUpdated() {
    const parsed = parseJsonText(updatedText);
    if (!parsed.value) return;
    const formatted = prettyJson(parsed.value);
    setUpdatedText(formatted);
    setUpdatedError(null);
    if (activeFile?.id) persistFileJsonText(activeFile.id, formatted);
  }

  function rebuildTreeFromUpdated() {
    const parsed = parseJsonText(updatedText);
    setUpdatedError(parsed.error);

    if (!parsed.value) return;

    const root = valueToTree(parsed.value, "$");
    setTreeRoot(root);

    const nextExpanded = new Set<string>();
    nextExpanded.add(root.id);
    (root.children ?? []).forEach((c) => nextExpanded.add(c.id));
    setExpanded(nextExpanded);
  }

  function saveChangesToUpdatedJson() {
    const jsonValue = treeToValue(treeRoot);
    const text = prettyJson(jsonValue);

    setUpdatedText(text);
    setUpdatedError(null);
    if (activeFile?.id) persistFileJsonText(activeFile.id, text);
  }

  function resetUpdatedToOriginal() {
    setUpdatedText(originalText);
    const parsed = parseJsonText(originalText);
    setUpdatedError(parsed.error);
    if (activeFile?.id) persistFileJsonText(activeFile.id, originalText);

    if (parsed.value) {
      const root = valueToTree(parsed.value, "$");
      setTreeRoot(root);
      const nextExpanded = new Set<string>();
      nextExpanded.add(root.id);
      (root.children ?? []).forEach((c) => nextExpanded.add(c.id));
      setExpanded(nextExpanded);
    }
  }

  return (
    <div className="appShell">
      <div className="bgGlow" />

      <Sidebar
        files={files}
        activeId={activeFile?.id ?? ""}
        minimized={sidebarMin}
        onToggleMinimize={() => setSidebarMin((v) => !v)}
        onSelect={setActiveId}
        onAdd={addNewFile}
        onRename={renameFile}
        onDelete={deleteFile}
        onImportJsonFile={importJsonFile}
        onExportJsonFile={exportJsonFile}
      />

      <main className="main">
        <header className="topBar">
          <div className="brand">
            <div className="logoMark" />
            <div className="brandText">
              <div className="brandTitle">JSON Reshaper</div>
              <div className="brandSub">Left is original, middle is structure, right is updated output</div>
            </div>
          </div>

          <div className="topActions">
            <button className="btnGhost" onClick={rebuildTreeFromUpdated} title="Build the middle structure from the updated JSON">
              Rebuild from Updated
            </button>
            <button className="btnGhost" onClick={resetUpdatedToOriginal} title="Reset updated JSON back to original">
              Reset Updated
            </button>
            <button className="btnPrimary" onClick={saveChangesToUpdatedJson} title="Write the structure into the updated JSON">
              Save Changes
            </button>
          </div>
        </header>

        <div className="grid3">
          <JsonEditor
            title="Original JSON (read only)"
            value={originalText}
            readOnly={true}
            statusText="Original snapshot"
          />

          <TreePanel
            title="Structure (drag keys, rename keys)"
            root={treeRoot}
            expanded={expanded}
            onToggleExpand={toggleExpand}
            onCollapseAll={collapseAll}
            onExpandOneLevel={expandOneLevel}
            dropTarget={dropTarget}
            onSelectDropTarget={onSelectDropTarget}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onEditKey={onEditKey}
          />

          <JsonEditor
            title="Updated JSON (editable output)"
            value={updatedText}
            onChange={onUpdatedEditorChange}
            error={updatedError}
            onFormat={formatUpdated}
          />
        </div>

        <footer className="footerBar">
          <div className="footerLeft">
            <span className="kbdPill">Tip</span>
            Keep most nodes collapsed. Expand only what you need, then drag and drop.
          </div>

          <div className="footerRight">
            <button className="btnGhost" onClick={() => exportJsonFile(activeFile.id)} title="Download current updated JSON">
              Export updated JSON
            </button>
            <button className="btnPrimary" onClick={saveChangesToUpdatedJson}>
              Save Changes
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}