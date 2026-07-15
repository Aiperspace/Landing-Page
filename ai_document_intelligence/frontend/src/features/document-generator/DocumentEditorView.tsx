import { useEffect, useState } from 'react';
import { MarkdownContent } from '../../components/MarkdownContent';
import { getApiBase } from '../../lib/api';
import { normalizeTypography, normalizeDocument } from '../../lib/textNormalize';
import type { GeneratedDocument } from './types';

interface DocumentEditorViewProps {
  doc: GeneratedDocument;
  onBackToCreate: () => void;
  onDocChange: (next: GeneratedDocument) => void;
}

function sectionMd(s: { title: string; content: string }) {
  const content = normalizeTypography(s.content);
  const c = content.trimStart();
  if (c.startsWith('#')) return content;
  return `## ${s.title}\n\n${content}`;
}

function safeFileBase(title: string) {
  const s = title.replace(/[/\\?%*:|"<>]/g, '-').trim();
  return s || 'document';
}

export function DocumentEditorView({
  doc,
  onBackToCreate,
  onDocChange,
}: DocumentEditorViewProps) {
  const [editableDoc, setEditableDoc] = useState<GeneratedDocument>(doc);
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);
  const [draftContent, setDraftContent] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [editingDocTitle, setEditingDocTitle] = useState(false);
  const [draftDocTitle, setDraftDocTitle] = useState('');
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'docx' | null>(null);

  useEffect(() => {
    setEditableDoc(doc);
    setEditingSectionIndex(null);
    setDraftContent('');
    setDraftTitle('');
    setEditingDocTitle(false);
  }, [doc]);

  const exportAs = async (format: 'pdf' | 'docx') => {
    if (exporting) return;

    setExporting(format);
    try {
      const res = await fetch(`${getApiBase()}/export-${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizeDocument(editableDoc)),
      });
      if (!res.ok) {
        let detail = `Server returned ${res.status}`;
        try {
          const errJson = (await res.json()) as { detail?: unknown };
          if (typeof errJson.detail === 'string') detail = errJson.detail;
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeFileBase(editableDoc.title)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert(`Could not export ${format.toUpperCase()}. ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setExporting(null);
    }
  };

  const startEditingSection = (index: number) => {
    setEditingSectionIndex(index);
    setDraftContent(editableDoc.sections[index]?.content ?? '');
    setDraftTitle(editableDoc.sections[index]?.title ?? '');
  };

  const cancelEditingSection = () => {
    setEditingSectionIndex(null);
    setDraftContent('');
    setDraftTitle('');
  };

  const saveSection = (index: number) => {
    const nextDoc: GeneratedDocument = {
      ...editableDoc,
      sections: editableDoc.sections.map((section, i) =>
        i === index ? { ...section, title: draftTitle.trim() || section.title, content: draftContent } : section,
      ),
    };
    setEditableDoc(nextDoc);
    onDocChange(nextDoc);
    setEditingSectionIndex(null);
    setDraftContent('');
    setDraftTitle('');
  };

  const commitDocTitle = () => {
    const next = draftDocTitle.trim();
    setEditingDocTitle(false);
    if (!next || next === editableDoc.title) return;
    const nextDoc: GeneratedDocument = { ...editableDoc, title: next };
    setEditableDoc(nextDoc);
    onDocChange(nextDoc);
  };

  const copyMarkdown = async () => {
    const body = editableDoc.sections.map(sectionMd).join('\n\n');
    try {
      await navigator.clipboard.writeText(`# ${editableDoc.title}\n\n${body}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      alert('Could not copy to clipboard.');
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50/50">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void exportAs('docx')}
            disabled={exporting !== null}
            aria-busy={exporting === 'docx'}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting === 'docx' ? 'Exporting…' : 'Download DOCX'}
          </button>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200/80">Ready</span>
        </div>

        <div className="mx-2 hidden h-6 w-px bg-slate-200 lg:block" />

        <div className="flex flex-1 flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600">
          <span className="ml-auto flex items-center gap-1 text-xs">
            <button
              type="button"
              className="rounded px-2 py-1 hover:bg-slate-200/80"
              onClick={() => void copyMarkdown()}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              className="rounded px-2 py-1 hover:bg-slate-200/80 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => void exportAs('pdf')}
              disabled={exporting !== null}
              aria-busy={exporting === 'pdf'}
            >
              {exporting === 'pdf' ? 'Exporting…' : 'Export PDF'}
            </button>
            <button type="button" onClick={onBackToCreate} className="rounded px-2 py-1 hover:bg-slate-200/80">
              New doc
            </button>
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-8">
        <article className="doc-content mx-auto max-w-4xl rounded-xl border border-slate-200/80 bg-white px-10 py-12 shadow-sm">
          <div className="mb-10 border-b border-slate-100 pb-6">
            {editingDocTitle ? (
              <input
                autoFocus
                value={draftDocTitle}
                onChange={(e) => setDraftDocTitle(e.target.value)}
                onBlur={commitDocTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitDocTitle();
                  if (e.key === 'Escape') setEditingDocTitle(false);
                }}
                aria-label="Document title"
                className="w-full rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-2xl font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setDraftDocTitle(editableDoc.title);
                  setEditingDocTitle(true);
                }}
                title="Click to rename"
                className="-mx-2 w-full rounded-lg px-2 py-1 text-left text-2xl font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                {editableDoc.title}
              </button>
            )}
          </div>
          <div className="space-y-6">
            {editableDoc.sections.map((section, index) => {
              const isEditing = editingSectionIndex === index;
              return (
                <section key={index} className="rounded-xl border border-slate-200/70 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    {isEditing ? (
                      <input
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        aria-label={`Title for section ${index + 1}`}
                        className="flex-1 rounded-lg border border-blue-300 px-3 py-1.5 text-lg font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    ) : (
                      <h2 className="text-lg font-semibold text-slate-900">{index + 1}. {section.title}</h2>
                    )}
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => startEditingSection(index)}
                        className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                    ) : null}
                  </div>

                  {isEditing ? (
                    <>
                      <textarea
                        value={draftContent}
                        onChange={(e) => setDraftContent(e.target.value)}
                        rows={10}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-800 outline-none ring-blue-200 focus:ring-2"
                      />
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={cancelEditingSection}
                          className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => saveSection(index)}
                          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          Save
                        </button>
                      </div>
                    </>
                  ) : (
                    <MarkdownContent content={sectionMd(section)} />
                  )}
                </section>
              );
            })}

            <details className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium text-slate-700">Full markdown preview</summary>
              <MarkdownContent
                className="mt-3"
                content={editableDoc.sections.map(sectionMd).join('\n\n')}
              />
            </details>
          </div>
        </article>
      </div>

    </div>
  );
}

