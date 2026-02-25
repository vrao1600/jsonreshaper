// src/components/Sidebar.tsx
import React, { useRef } from "react";
import type { JsonFile } from "../types";

type Props = {
  files: JsonFile[];
  activeId: string;
  minimized: boolean;
  onToggleMinimize: () => void;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onImportJsonFile: (file: File) => void;
  onExportJsonFile: (id: string) => void;
};

export default function Sidebar(props: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <aside className={`sidebar ${props.minimized ? "sidebarMin" : ""}`}>
      <div className="sidebarTop">
        <button className="iconBtn" onClick={props.onToggleMinimize} title="Minimize sidebar">
          {props.minimized ? "»" : "«"}
        </button>

        {!props.minimized && (
          <div className="sidebarTitleWrap">
            <div className="sidebarTitle">Files</div>
            <div className="sidebarSub">Local, saved in your browser</div>
          </div>
        )}
      </div>

      {!props.minimized && (
        <div className="sidebarActions">
          <button className="btnPrimary" onClick={props.onAdd}>
            New JSON
          </button>

          <button
            className="btnGhost"
            onClick={() => inputRef.current?.click()}
            title="Import a .json file"
          >
            Import
          </button>

          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) props.onImportJsonFile(f);
            }}
          />
        </div>
      )}

      <div className="fileList">
        {props.files.map((f) => {
          const active = f.id === props.activeId;
          return (
            <div
              key={f.id}
              className={`fileItem ${active ? "fileItemActive" : ""}`}
              onClick={() => props.onSelect(f.id)}
              role="button"
              tabIndex={0}
            >
              <div className="fileDot" />
              <div className="fileName" title={f.name}>
                {props.minimized ? f.name.slice(0, 1).toUpperCase() : f.name}
              </div>

              {!props.minimized && (
                <div className="fileBtns">
                  <button
                    className="miniBtn"
                    onClick={(e) => {
                      e.stopPropagation();
                      const name = prompt("Rename file", f.name);
                      if (name && name.trim()) props.onRename(f.id, name.trim());
                    }}
                    title="Rename"
                  >
                    ✎
                  </button>
                  <button
                    className="miniBtn"
                    onClick={(e) => {
                      e.stopPropagation();
                      props.onExportJsonFile(f.id);
                    }}
                    title="Export"
                  >
                    ⤓
                  </button>
                  <button
                    className="miniBtnDanger"
                    onClick={(e) => {
                      e.stopPropagation();
                      const ok = confirm(`Delete "${f.name}"? This cannot be undone.`);
                      if (ok) props.onDelete(f.id);
                    }}
                    title="Delete"
                  >
                    🗑
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!props.minimized && (
        <div className="sidebarFooter">
          <div className="hint">
            Tip: edit JSON on the left, then drag keys on the right, then click Save Changes.
          </div>
        </div>
      )}
    </aside>
  );
}