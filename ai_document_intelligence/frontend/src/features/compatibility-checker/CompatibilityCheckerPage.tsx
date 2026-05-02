/**
 * Compatibility Checker – main feature page (aiper-project parity, Vite app)
 */

import { useMemo, useState } from "react";
import {
  AttentionBanner,
  ComparisonSidebar,
  ComparisonSummary,
  ComparisonTable,
} from "./components";
import { useCompare } from "./hooks/useCompare";
import { buildRows } from "./utils";

export function CompatibilityCheckerPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const {
    fileA,
    fileB,
    setFileA,
    setFileB,
    result,
    error,
    isLoading,
    compare,
  } = useCompare();

  const rows = useMemo(() => buildRows(result ?? undefined), [result]);

  const attentionCount = useMemo(
    () => rows.filter((row) => row.status !== "compatible").length,
    [rows],
  );

  const okItems = useMemo(
    () => rows.filter((row) => row.status === "compatible"),
    [rows],
  );
  const differentItems = useMemo(
    () => rows.filter((row) => row.status === "incompatible"),
    [rows],
  );
  const missingItems = useMemo(
    () => rows.filter((row) => row.status === "missing"),
    [rows],
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-auto bg-[radial-gradient(circle_at_top,_#dfe9ff,_#f6f8fb_55%)]">
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 gap-6 px-6 py-8">
        <ComparisonSidebar
          sidebarOpen={sidebarOpen}
          fileA={fileA}
          fileB={fileB}
          isLoading={isLoading}
          onFileAChange={setFileA}
          onFileBChange={setFileB}
          onCompare={compare}
        />

        <main className="min-w-0 flex-1 space-y-6">
          <AttentionBanner
            sidebarOpen={sidebarOpen}
            attentionCount={attentionCount}
            hasResult={result != null}
            onToggleSidebar={() => setSidebarOpen((o) => !o)}
          />

          <ComparisonTable rows={rows} detectedComponents={result?.DetectedComponents ?? null} />

          <ComparisonSummary
            result={result}
            error={error}
            isLoading={isLoading}
            okItems={okItems}
            differentItems={differentItems}
            missingItems={missingItems}
          />
        </main>
      </div>
    </div>
  );
}
