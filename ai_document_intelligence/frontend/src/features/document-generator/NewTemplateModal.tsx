import { useEffect, useState } from 'react';
import { IconSparkles, IconUpload } from '../../components/Icons';
import type { TemplateDef } from './templates';
import { addUserTemplate, updateUserTemplate, type UserTemplateRecord } from './userTemplates';

interface NewTemplateModalProps {
  open: boolean;
  onClose: () => void;
  baseTypes: TemplateDef[];
  /** When set, the modal edits this saved template instead of creating a new one. */
  editingRecord?: UserTemplateRecord | null;
  onSaved: (record: UserTemplateRecord) => void;
  onError: (message: string) => void;
}

export function NewTemplateModal({ open, onClose, baseTypes, editingRecord, onSaved, onError }: NewTemplateModalProps) {
  const [name, setName] = useState('');
  const [baseTypeId, setBaseTypeId] = useState(baseTypes[0]?.id ?? 'test_report');
  const [file, setFile] = useState<File | null>(null);
  const [outlineText, setOutlineText] = useState('');
  const [saving, setSaving] = useState(false);
  const [subscriptionNotice, setSubscriptionNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editingRecord) {
      setName(editingRecord.name);
      setBaseTypeId(editingRecord.baseTypeId);
      setOutlineText(editingRecord.outline.join('\n'));
      setFile(null);
    } else {
      setName('');
      setBaseTypeId(baseTypes[0]?.id ?? 'test_report');
      setOutlineText('');
      setFile(null);
      setSubscriptionNotice(null);
    }
  }, [open, editingRecord, baseTypes]);

  if (!open) return null;

  const isEdit = Boolean(editingRecord);

  const outlineFromText = () =>
    outlineText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

  const applyDefaultOutline = () => {
    const d = baseTypes.find((t) => t.id === baseTypeId);
    setOutlineText(d ? d.outline.join('\n') : '');
  };

  const onExtractSectionsClick = () => {
    setSubscriptionNotice(
      'Extracting section titles from a document with AI is available on a higher subscription tier. Upgrade your plan or contact sales to enable this feature. You can still add section titles manually or use the default outline.',
    );
  };

  const save = () => {
    const lines = outlineFromText();
    if (!name.trim()) {
      onError('Enter a name for this template.');
      return;
    }
    if (lines.length < 2) {
      onError('Add at least two section titles (one per line), or use default sections.');
      return;
    }
    setSaving(true);
    try {
      let record: UserTemplateRecord;
      if (editingRecord) {
        const updated = updateUserTemplate(editingRecord.id, {
          name: name.trim(),
          baseTypeId,
          outline: lines,
          sourceFileName: file?.name ?? editingRecord.sourceFileName,
        });
        if (!updated) {
          onError('Could not update template (it may have been removed).');
          return;
        }
        record = updated;
      } else {
        record = addUserTemplate({
          name: name.trim(),
          baseTypeId,
          outline: lines,
          sourceFileName: file?.name,
        });
      }
      onSaved(record);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4" role="dialog" aria-modal="true" aria-labelledby="new-template-title">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 id="new-template-title" className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Edit template' : 'New company template'}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800">
            Close
          </button>
        </div>

        <div className="space-y-5 px-5 py-5 text-sm">
          <p className="leading-relaxed text-slate-600">
            Choose which of the five document types this template follows, then set section titles manually, use the default outline for that type, or (on eligible
            plans) extract titles from a <strong>PDF</strong> or <strong>image</strong> with AI. Saved templates appear under &quot;Your templates&quot; in the
            sidebar.
          </p>

          <div>
            <label className="font-medium text-slate-800">Template name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="e.g. Acme Test Report layout"
            />
          </div>

          <div>
            <label className="font-medium text-slate-800">Document type (one of five)</label>
            <select
              value={baseTypeId}
              onChange={(e) => setBaseTypeId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              {baseTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-medium text-slate-800">Template file (PDF or image)</label>
            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 transition hover:border-slate-300">
              <IconUpload className="text-slate-400" />
              <span className="mt-2 text-center text-slate-700">{file ? file.name : 'Click to choose PDF, PNG, or JPG'}</span>
              {isEdit && editingRecord?.sourceFileName && !file ? (
                <span className="mt-1 block text-center text-xs text-slate-500">
                  Previously: {editingRecord.sourceFileName}. Upload a new file only if you want to replace the stored reference.
                </span>
              ) : null}
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setFile(f ?? null);
                }}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={applyDefaultOutline}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Use default sections
            </button>
            <button
              type="button"
              onClick={onExtractSectionsClick}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <IconSparkles className="h-3.5 w-3.5 text-white" />
              Extract sections with AI
            </button>
          </div>

          {subscriptionNotice ? (
            <div
              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs leading-relaxed text-amber-950"
              role="status"
            >
              {subscriptionNotice}
            </div>
          ) : null}

          <div>
            <label className="font-medium text-slate-800">Section titles (one per line)</label>
            <textarea
              value={outlineText}
              onChange={(e) => setOutlineText(e.target.value)}
              rows={12}
              className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs leading-relaxed text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Purpose&#10;Scope&#10;…"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save to templates'}
          </button>
        </div>
      </div>
    </div>
  );
}
