/**
 * Compatibility Checker – type guards and value checks
 */

import type { ParameterEntry } from "../types";

export function isParameterEntry(value: unknown): value is ParameterEntry {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    (typeof record.A === "string" || typeof record.A === "number") &&
    (typeof record.B === "string" || typeof record.B === "number") &&
    (record.Status === "OK" ||
      record.Status === "Different" ||
      record.Status === "Missing")
  );
}

export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (
      normalized === "" ||
      normalized === "—" ||
      normalized === "n/a" ||
      normalized === "na" ||
      normalized === "not provided" ||
      normalized === "not specified" ||
      normalized === "not available" ||
      normalized === "unknown" ||
      normalized === "none" ||
      normalized === "null" ||
      normalized === "tbd"
    ) {
      return true;
    }
    return (
      normalized.includes("not specified") ||
      normalized.includes("not provided") ||
      normalized.includes("not available") ||
      normalized.includes("unknown") ||
      normalized.includes("n/a") ||
      normalized.includes("tbd")
    );
  }
  return false;
}
