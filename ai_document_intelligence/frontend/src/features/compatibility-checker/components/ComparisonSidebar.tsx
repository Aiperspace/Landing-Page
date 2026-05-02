/**
 * Left sidebar: nav icons + collapsible panel with file inputs and compare action
 */

import { FileInput } from "./FileInput";
import { SidebarIcon } from "./SidebarIcon";

interface ComparisonSidebarProps {
  sidebarOpen: boolean;
  fileA: File | null;
  fileB: File | null;
  isLoading: boolean;
  onFileAChange: (file: File | null) => void;
  onFileBChange: (file: File | null) => void;
  onCompare: () => void;
}

export function ComparisonSidebar({
  sidebarOpen,
  fileA,
  fileB,
  isLoading,
  onFileAChange,
  onFileBChange,
  onCompare,
}: ComparisonSidebarProps) {
  return (
    <aside
      className={`relative flex gap-4 transition-all duration-300 ${
        sidebarOpen ? "w-[360px] min-w-[320px] opacity-100" : "w-16 min-w-[64px] opacity-100"
      }`}
    >
      <div className="flex w-14 flex-col items-center gap-4 rounded-2xl border border-slate-200/60 bg-white/80 py-4 shadow-sm">
        <SidebarIcon active label="Validation" />
        <SidebarIcon label="Components" />
        <SidebarIcon label="Insights" />
        <SidebarIcon label="History" />
      </div>

      <div
        className={`flex-1 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur transition-all duration-300 ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Validation
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              Select Components to Validate
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Choose two PDF product specs to compare (same flow as the original comparator).
            </p>
          </div>
          <button
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm"
            type="button"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
            Add docs
          </button>
        </div>

        <div className="mt-8 space-y-5">
          <div>
            <p className="text-sm font-semibold text-slate-600">Component A</p>
            <div className="mt-3">
              <FileInput
                label="Primary component"
                file={fileA}
                onChange={onFileAChange}
                accent="blue"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-600">Component B</p>
            <div className="mt-3">
              <FileInput
                label="Secondary component"
                file={fileB}
                onChange={onFileBChange}
                accent="amber"
              />
            </div>
          </div>

          <button
            className="mt-2 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            type="button"
            onClick={() => void onCompare()}
            disabled={!fileA || !fileB || isLoading}
          >
            {isLoading ? "Analyzing components..." : "Compare components"}
          </button>

          <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Linked Documents
            </p>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>{fileA ? fileA.name : "No component A uploaded yet"}</p>
              <p>{fileB ? fileB.name : "No component B uploaded yet"}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
