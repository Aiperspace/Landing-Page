/**
 * Compatibility Checker – build table rows from API response
 */

import type {
  ComparisonResponse,
  ComparisonRow,
  ParameterEntry,
  Status,
} from "../types";
import { formatValue } from "./formatters";
import { isEmpty, isParameterEntry } from "./validation";

export const STATUS_ORDER: Record<Status, number> = {
  incompatible: 0,
  missing: 1,
  compatible: 2,
};

export const STATUS_MAP: Record<ParameterEntry["Status"], Status> = {
  OK: "compatible",
  Different: "incompatible",
  Missing: "missing",
};

export const STATUS_STYLES: Record<
  Status,
  { label: string; className: string }
> = {
  compatible: {
    label: "Compatible",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  incompatible: {
    label: "Incompatible",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
  missing: {
    label: "Missing",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
};

export function buildRows(result?: ComparisonResponse): ComparisonRow[] {
  if (!result) return [];
  const rows: ComparisonRow[] = [];

  Object.entries(result).forEach(([parameter, value]) => {
    if (parameter === "Summary" || parameter === "raw" || parameter === "DetectedComponents") return;
    if (!isParameterEntry(value)) return;

    const productA = formatValue(value.A);
    const productB = formatValue(value.B);
    let reasoning = "Parameters align across both components.";

    if (value.Status === "Different") {
      reasoning = "Values differ between the two components.";
    } else if (value.Status === "Missing") {
      const missingA = isEmpty(value.A);
      const missingB = isEmpty(value.B);
      reasoning =
        missingA && missingB
          ? "Missing in both components."
          : missingA && !missingB
          ? "Missing in Component A."
          : !missingA && missingB
            ? "Missing in Component B."
            : "Missing in one of the components.";
    }

    rows.push({
      parameter,
      productA,
      productB,
      status: STATUS_MAP[value.Status],
      reasoning,
    });
  });

  return rows.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
}
