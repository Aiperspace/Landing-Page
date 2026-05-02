/**
 * Single nav icon in the feature sidebar
 */

interface SidebarIconProps {
  active?: boolean;
  label: string;
}

export function SidebarIcon({ active, label }: SidebarIconProps) {
  return (
    <button
      className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
        active
          ? "border-blue-200 bg-blue-600 text-white shadow-sm"
          : "border-transparent bg-transparent text-slate-500 hover:border-slate-200 hover:bg-white"
      }`}
      type="button"
      aria-label={label}
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
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    </button>
  );
}
