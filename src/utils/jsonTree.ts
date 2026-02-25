// src/utils/jsonTree.ts
import type { JsonValue, JsonObject, JsonArray, TreeNode, JsonPrimitive } from "../types";

function uid(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function isObject(v: unknown): v is JsonObject {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseJsonText(jsonText: string): { value: JsonValue | null; error: string | null } {
  try {
    const v = JSON.parse(jsonText) as JsonValue;
    return { value: v, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid JSON";
    return { value: null, error: msg };
  }
}

export function valueToTree(value: JsonValue, key = "$"): TreeNode {
  if (Array.isArray(value)) {
    const children = value.map((child, idx) => valueToTree(child, String(idx)));
    return { id: uid(), key, type: "array", children };
  }
  if (isObject(value)) {
    const keys = Object.keys(value);
    const children = keys.map((k) => valueToTree(value[k] as JsonValue, k));
    return { id: uid(), key, type: "object", children };
  }
  return { id: uid(), key, type: "primitive", value: value as JsonPrimitive };
}

export function treeToValue(node: TreeNode): JsonValue {
  if (node.type === "primitive") return node.value ?? null;

  const kids = node.children ?? [];
  if (node.type === "array") {
    return kids.map((k) => treeToValue(k));
  }

  const obj: JsonObject = {};
  for (const child of kids) {
    obj[child.key] = treeToValue(child);
  }
  return obj;
}

export function prettyJson(value: JsonValue): string {
  return JSON.stringify(value, null, 2);
}

export function findNode(root: TreeNode, id: string): TreeNode | null {
  if (root.id === id) return root;
  const kids = root.children ?? [];
  for (const c of kids) {
    const found = findNode(c, id);
    if (found) return found;
  }
  return null;
}

export function findParentOf(root: TreeNode, childId: string): { parent: TreeNode; index: number } | null {
  const kids = root.children ?? [];
  for (let i = 0; i < kids.length; i++) {
    if (kids[i].id === childId) return { parent: root, index: i };
    const deeper = findParentOf(kids[i], childId);
    if (deeper) return deeper;
  }
  return null;
}

export function canAcceptChild(parent: TreeNode): boolean {
  return parent.type === "object" || parent.type === "array";
}

export function sanitizeKeyForParent(parent: TreeNode, desiredKey: string): string {
  if (parent.type === "array") {
    return desiredKey;
  }
  const existing = new Set((parent.children ?? []).map((c) => c.key));
  if (!existing.has(desiredKey)) return desiredKey;

  let n = 2;
  while (existing.has(`${desiredKey}_${n}`)) n++;
  return `${desiredKey}_${n}`;
}

export function normalizeArrayIndices(node: TreeNode) {
  if (node.type === "array") {
    (node.children ?? []).forEach((c, idx) => {
      c.key = String(idx);
      normalizeArrayIndices(c);
    });
  } else {
    (node.children ?? []).forEach((c) => normalizeArrayIndices(c));
  }
}

export function cloneTree<T>(v: T): T {
  return structuredClone ? structuredClone(v) : JSON.parse(JSON.stringify(v));
}