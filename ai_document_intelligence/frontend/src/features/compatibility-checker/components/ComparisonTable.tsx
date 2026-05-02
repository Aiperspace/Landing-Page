/**
 * Parameter compatibility table with optional skeleton loading
 */

import type { ComparisonRow } from "../types";
import { StatusPill } from "./StatusPill";

interface ComparisonTableProps {
  rows: ComparisonRow[];
  detectedComponents?: {
    component_a_type: string;
    component_b_type: string;
    component_a_confidence?: number;
    component_b_confidence?: number;
    pair_key: string;
    pair_supported: boolean;
  } | null;
}

const SKELETON_ROWS = 5;
const SKELETON_COLS = 5;

export function ComparisonTable({ rows, detectedComponents }: ComparisonTableProps) {
  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Parameter Compatibility Summary
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Side-by-side comparison of the extracted requirements.
          </p>
          {detectedComponents ? (
            <p className="mt-2 text-xs text-slate-600">
              Detected pair:{" "}
              <span className="font-semibold text-slate-800">
                {detectedComponents.component_a_type} ↔ {detectedComponents.component_b_type}
              </span>{" "}
              ({detectedComponents.pair_supported ? "focused comparison" : "fallback core comparison"})
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Parameter</th>
              <th className="px-5 py-3">Component A</th>
              <th className="px-5 py-3">Component B</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Reasoning</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.length === 0
              ? Array.from({ length: SKELETON_ROWS }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="text-sm">
                    {Array.from({ length: SKELETON_COLS }).map((__, cellIndex) => (
                      <td
                        key={`cell-${index}-${cellIndex}`}
                        className="px-5 py-4"
                      >
                        <div className="h-3 w-32 animate-pulse rounded-full bg-slate-200" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row) => (
                  <tr key={row.parameter} className="text-sm text-slate-700">
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {row.parameter}
                    </td>
                    <td className="px-5 py-4 text-slate-700">{row.productA}</td>
                    <td className="px-5 py-4 text-slate-700">{row.productB}</td>
                    <td className="px-5 py-4">
                      <StatusPill status={row.status} />
                    </td>
                    <td className="px-5 py-4 text-slate-500">{row.reasoning}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
