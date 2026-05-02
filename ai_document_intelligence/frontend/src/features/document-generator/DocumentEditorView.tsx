import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getApiBase } from '../../lib/api';
import type { GeneratedDocument } from './types';

interface DocumentEditorViewProps {
  doc: GeneratedDocument;
  onBackToCreate: () => void;
  onDocChange: (next: GeneratedDocument) => void;
}

function sectionMd(s: { title: string; content: string }) {
  const c = s.content.trimStart();
  if (c.startsWith('#')) return s.content;
  return `## ${s.title}\n\n${s.content}`;
}

function safeFileBase(title: string) {
  const s = title.replace(/[/\\?%*:|"<>]/g, '-').trim();
  return s || 'document';
}

function downloadMarkdown(doc: GeneratedDocument) {
  const body = doc.sections.map(sectionMd).join('\n\n---\n\n');
  const blob = new Blob([`# ${doc.title}\n\n${body}`], { type: 'text/markdown;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${safeFileBase(doc.title)}.md`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function DocumentEditorView({
  doc,
  onBackToCreate,
  onDocChange,
}: DocumentEditorViewProps) {
  const [editableDoc, setEditableDoc] = useState<GeneratedDocument>(doc);
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);
  const [draftContent, setDraftContent] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    setEditableDoc(doc);
    setEditingSectionIndex(null);
    setDraftContent('');
  }, [doc]);


  const exportPdf = async () => {
    if (isExportingPdf) return;

    setIsExportingPdf(true);
    try {
      const res = await fetch(`${getApiBase()}/export-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editableDoc),
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
      a.download = `${safeFileBase(doc.title)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert(`Could not export PDF. ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const startEditingSection = (index: number) => {
    setEditingSectionIndex(index);
    setDraftContent(editableDoc.sections[index]?.content ?? '');
  };

  const cancelEditingSection = () => {
    setEditingSectionIndex(null);
    setDraftContent('');
  };

  const saveSection = (index: number) => {
    const nextDoc: GeneratedDocument = {
      ...editableDoc,
      sections: editableDoc.sections.map((section, i) =>
        i === index ? { ...section, content: draftContent } : section,
      ),
    };
    setEditableDoc(nextDoc);
    onDocChange(nextDoc);
    setEditingSectionIndex(null);
    setDraftContent('');
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50/50">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => downloadMarkdown(editableDoc)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Download DOCX
          </button>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200/80">Ready</span>
        </div>

        <div className="mx-2 hidden h-6 w-px bg-slate-200 lg:block" />

        <div className="flex flex-1 flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600">
          <ToolbarBtn>↶</ToolbarBtn>
          <ToolbarBtn>↷</ToolbarBtn>
          <span className="mx-1 h-5 w-px bg-slate-200" />
          <select className="max-w-[120px] rounded border-0 bg-transparent text-xs outline-none">
            <option>Normal</option>
            <option>Heading 1</option>
            <option>Heading 2</option>
          </select>
          <span className="mx-1 h-5 w-px bg-slate-200" />
          <ToolbarBtn bold>B</ToolbarBtn>
          <ToolbarBtn italic>I</ToolbarBtn>
          <ToolbarBtn>U</ToolbarBtn>
          <span className="mx-1 h-5 w-px bg-slate-200" />
          <ToolbarBtn>•</ToolbarBtn>
          <ToolbarBtn>1.</ToolbarBtn>
          <span className="ml-auto flex items-center gap-1 text-xs">
            <button type="button" className="rounded px-2 py-1 hover:bg-slate-200/80" title="Placeholder">
              Theme
            </button>
            <button type="button" className="rounded px-2 py-1 hover:bg-slate-200/80">
              Copy
            </button>
            <button
              type="button"
              className="rounded px-2 py-1 hover:bg-slate-200/80 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={exportPdf}
              disabled={isExportingPdf}
              aria-busy={isExportingPdf}
            >
              {isExportingPdf ? 'Exporting...' : 'Export PDF'}
            </button>
            <button type="button" onClick={onBackToCreate} className="rounded px-2 py-1 hover:bg-slate-200/80">
              New doc
            </button>
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-8">
        <article className="doc-content mx-auto max-w-4xl rounded-xl border border-slate-200/80 bg-white px-10 py-12 shadow-sm">
          <h1 className="mb-10 border-b border-slate-100 pb-6 text-2xl font-semibold text-slate-900">{editableDoc.title}</h1>
          <div className="space-y-6">
            {editableDoc.sections.map((section, index) => {
              const isEditing = editingSectionIndex === index;
              return (
                <section key={`${section.title}-${index}`} className="rounded-xl border border-slate-200/70 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">{index + 1}. {section.title}</h2>
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
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none ring-blue-200 focus:ring-2"
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
                    <div className="prose-space">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{sectionMd(section)}</ReactMarkdown>
                    </div>
                  )}
                </section>
              );
            })}

            <details className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium text-slate-700">Full markdown preview</summary>
              <div className="prose-space mt-3">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {editableDoc.sections.map(sectionMd).join('\n\n')}
                </ReactMarkdown>
              </div>
            </details>
          </div>
        </article>
      </div>

    </div>
  );
}

function ToolbarBtn({
  children,
  bold,
  italic,
  ...rest
}: { children: ReactNode; bold?: boolean; italic?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`rounded px-2 py-1 text-xs hover:bg-slate-200/80 ${bold ? 'font-bold' : ''} ${italic ? 'italic' : ''}`}
      {...rest}
    >
      {children}
    </button>
  );
}
