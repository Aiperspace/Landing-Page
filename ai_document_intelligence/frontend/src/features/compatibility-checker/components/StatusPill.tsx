/**
 * Status pill for comparison table
 */

import type { Status } from "../types";
import { STATUS_STYLES } from "../utils";

export function StatusPill({ status }: { status: Status }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${style.className}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
      {style.label}
    </span>
  );
}
