/**
 * Compatibility Checker – value and byte formatting
 */

export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value.trim() || "—";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    if ("value" in value && (value as { value?: unknown }).value !== undefined) {
      return formatValue((value as { value?: unknown }).value);
    }
    return JSON.stringify(value);
  }
  return String(value);
}

export function formatBytes(bytes: number): string {
  if (!bytes || Number.isNaN(bytes)) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    sizes.length - 1,
  );
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${sizes[index]}`;
}
