/**
 * Top banner: sidebar toggle + attention summary
 */

interface AttentionBannerProps {
  sidebarOpen: boolean;
  attentionCount: number;
  hasResult: boolean;
  onToggleSidebar: () => void;
}

export function AttentionBanner({
  sidebarOpen,
  attentionCount,
  hasResult,
  onToggleSidebar,
}: AttentionBannerProps) {
  const attentionLabel = hasResult
    ? attentionCount === 0
      ? "All parameters aligned"
      : `${attentionCount} parameters require attention`
    : "Awaiting comparison";

  const iconBg =
    attentionCount === 0 && hasResult
      ? "bg-emerald-100 text-emerald-600"
      : "bg-rose-100 text-rose-500";

  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300"
          type="button"
          onClick={onToggleSidebar}
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M3 12h18" />
              <path d="M3 6h18" />
              <path d="M3 18h18" />
            </svg>
          </span>
          {sidebarOpen ? "Hide panel" : "Show panel"}
        </button>

        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-2xl ${iconBg}`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{attentionLabel}</p>
            <p className="text-xs text-slate-500">
              Parameters are extracted from the uploaded technical documentation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
