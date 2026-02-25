// src/utils/storage.ts
import type { JsonFile } from "../types";

const KEY = "json-reshaper.files.v1";
const ACTIVE = "json-reshaper.activeFileId.v1";

export function loadFiles(): JsonFile[] | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as JsonFile[];
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveFiles(files: JsonFile[]) {
  localStorage.setItem(KEY, JSON.stringify(files));
}

export function loadActiveFileId(): string | null {
  try {
    return localStorage.getItem(ACTIVE);
  } catch {
    return null;
  }
}

export function saveActiveFileId(id: string) {
  localStorage.setItem(ACTIVE, id);
}

export function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}