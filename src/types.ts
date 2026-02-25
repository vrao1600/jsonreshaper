// src/types.ts
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export type JsonObject = { [k: string]: JsonValue };
export type JsonArray = JsonValue[];

export type JsonType = "object" | "array" | "primitive";

export type TreeNode = {
  id: string;
  key: string; // for root, use "$"
  type: JsonType;
  value?: JsonPrimitive; // when primitive
  children?: TreeNode[]; // when object/array
};

export type JsonFile = {
  id: string;
  name: string;
  jsonText: string;
  updatedAt: number;
};

export type DragAction =
  | { kind: "reorder"; parentId: string; fromIndex: number; toIndex: number }
  | { kind: "move"; fromParentId: string; toParentId: string; fromIndex: number; toIndex: number };