/**
 * PDF file input with label, size display, and remove action
 */

import { formatBytes } from "../utils";

const ACCENT_CLASSES = {
  blue: {
    container: "hover:border-blue-300 hover:bg-blue-50/40",
    badge: "text-blue-600 bg-blue-50",
  },
  amber: {
    container: "hover:border-amber-300 hover:bg-amber-50/40",
    badge: "text-amber-600 bg-amber-50",
  },
} as const;

type Accent = keyof typeof ACCENT_CLASSES;

interface FileInputProps {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  accent: Accent;
}

export function FileInput({ label, file, onChange, accent }: FileInputProps) {
  const classes = ACCENT_CLASSES[accent];

  return (
    <label
      className={`group flex cursor-pointer flex-col gap-3 rounded-2xl border border-dashed border-slate-200/70 p-4 transition ${classes.container}`}
    >
      <input
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${classes.badge}`}
        >
          PDF
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-slate-900">
          {file ? file.name : "Drop or select a component PDF"}
        </span>
        <span className="text-xs text-slate-500">
          {file ? formatBytes(file.size) : "Only .pdf files supported"}
        </span>
      </div>
      {file && (
        <button
          type="button"
          className="self-start text-xs font-semibold text-slate-500 hover:text-slate-700"
          onClick={(e) => {
            e.preventDefault();
            onChange(null);
          }}
        >
          Remove file
        </button>
      )}
    </label>
  );
}
