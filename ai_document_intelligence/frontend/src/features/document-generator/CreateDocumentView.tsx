import { useEffect, useRef, useState } from 'react';
import { IconFileText, IconSparkles, IconUpload } from '../../components/Icons';
import type { TemplateDef } from './templates';
import { getApiBase } from '../../lib/api';
import type { GeneratedDocument } from './types';

interface CreateDocumentViewProps {
  template: TemplateDef;
  onGenerated: (doc: GeneratedDocument) => void;
  onError: (message: string) => void;
}

const MAX_FILES = 10;

/**
 * Backend stage -> percentage floor. Section streaming fills the gap between
 * SECTION_PROGRESS_START and SECTION_PROGRESS_END based on real section count.
 */
const SECTION_PROGRESS_START = 55;
const SECTION_PROGRESS_END = 85;

const STAGE_PROGRESS: Array<[RegExp, number]> = [
  [/preparing generation request/i, 5],
  [/building section plan/i, 20],
  [/refining early plan/i, 35],
  [/generating final document sections/i, 50],
  [/starting live section streaming/i, SECTION_PROGRESS_START],
  [/compiling streamed sections/i, SECTION_PROGRESS_END],
  [/running final validation/i, 95],
];

function stageToProgress(stage: string): number | null {
  for (const [pattern, value] of STAGE_PROGRESS) {
    if (pattern.test(stage)) return value;
  }
  return null;
}

export function CreateDocumentView({ template, onGenerated, onError }: CreateDocumentViewProps) {
  const [desc, setDesc] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [liveStage, setLiveStage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [sectionsDone, setSectionsDone] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const totalSections = template.outline.length;

  const subtitle =
    template.id === 'test_report'
      ? 'Structured per ECSS-E-ST-10-02C and ECSS-E-ST-10-03C. Enter your test narrative and optional observations; AI generation follows the selected template.'
      : 'Complete the fields below. The backend uses AI to fill the selected template structure.';

  useEffect(() => {
    setDesc('');
    setNotes('');
    setFiles([]);
  }, [template.id]);

  useEffect(() => {
    if (!loading) {
      setElapsedSec(0);
      return;
    }
    const id = window.setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [loading]);

  const mergeFiles = (incoming: FileList | File[]) => {
    const next = [...files, ...Array.from(incoming)].slice(0, MAX_FILES);
    setFiles(next);
  };

  const generate = async () => {
    setLoading(true);
    setLiveStage('Preparing generation request');
    setProgress(5);
    setSectionsDone(0);
    let draftBuffer = '';
    try {
      const form = new FormData();
      form.append('description', desc);
      form.append('notes', notes);
      form.append('template_type', template.baseTypeId ?? template.id);
      form.append('section_outline', JSON.stringify(template.outline));
      files.forEach((f) => form.append('files', f));
      const res = await fetch(`${getApiBase()}/generate-document-stream`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        let detail = `Server returned ${res.status}`;
        try {
          const errJson = (await res.json()) as { detail?: unknown };
          if (typeof errJson.detail === 'string') {
            detail = errJson.detail;
          }
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      }
      const isStream = (res.headers.get('content-type') || '').includes('text/event-stream');
      if (!isStream || !res.body) {
        const fallbackDoc = (await fetch(`${getApiBase()}/generate-document`, {
          method: 'POST',
          body: form,
        }).then((r) => r.json())) as GeneratedDocument;
        onGenerated(fallbackDoc);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = 'message';

      const flushEvent = (rawChunk: string) => {
        const lines = rawChunk.split('\n');
        const dataLines: string[] = [];
        currentEvent = 'message';
        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trim());
          }
        }
        if (!dataLines.length) return;
        const payloadText = dataLines.join('\n');
        let payload: Record<string, unknown> = {};
        try {
          payload = JSON.parse(payloadText) as Record<string, unknown>;
        } catch {
          return;
        }
        if (currentEvent === 'progress' && typeof payload.message === 'string') {
          setLiveStage(payload.message);
          const pct = stageToProgress(payload.message);
          if (pct !== null) setProgress((prev) => Math.max(prev, pct));
          return;
        }
        if (currentEvent === 'draft' && typeof payload.text === 'string') {
          // Draft tokens are not rendered, but counting the section headings as they
          // stream in gives a real completion percentage instead of a timer guess.
          draftBuffer += payload.text;
          const headings = (draftBuffer.match(/^##\s+/gm) || []).length;
          const done = Math.min(headings, totalSections);
          setSectionsDone(done);
          if (totalSections > 0) {
            const span = SECTION_PROGRESS_END - SECTION_PROGRESS_START;
            const pct = SECTION_PROGRESS_START + Math.round((done / totalSections) * span);
            setProgress((prev) => Math.max(prev, pct));
          }
          return;
        }
        if (currentEvent === 'completed' && payload.document) {
          setProgress(100);
          onGenerated(payload.document as GeneratedDocument);
          return;
        }
        if (currentEvent === 'error' && typeof payload.message === 'string') {
          throw new Error(payload.message);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';
        parts.forEach(flushEvent);
      }
      if (buffer.trim()) flushEvent(buffer);
    } catch (e) {
      console.error(e);
      const base = getApiBase();
      const hint =
        e instanceof TypeError
          ? ` Cannot reach the API at ${base}. If you use Docker, run backend + frontend together and ensure port 8000 is published.`
          : '';
      const msg = e instanceof Error ? e.message : 'Unknown error';
      onError(`Could not generate the document.${hint} ${msg}`.trim());
    } finally {
      setLoading(false);
      setLiveStage(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-600">
        <IconFileText className="h-4 w-4" />
        {template.label}
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create New Document</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{subtitle}</p>

      <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50/80 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Document structure</p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
          {template.outline.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </div>

      <div className="mt-8 space-y-6">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <IconFileText className="h-4 w-4 text-blue-500" aria-hidden />
            Test Description
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={8}
            className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 shadow-sm outline-none ring-blue-600/0 transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            placeholder="Describe the test, objectives, environment, and subsystem under verification…"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <IconFileText className="h-4 w-4 text-blue-500" aria-hidden />
            Test Observations / Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            placeholder="e.g. Minor instability observed at phase 3; operator notes; deviations…"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <IconFileText className="h-4 w-4 text-blue-500" aria-hidden />
            Upload Files (Optional)
          </label>
          <button
            type="button"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.length) mergeFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={`mt-2 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition ${
              dragOver ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-slate-50/30 hover:border-slate-300 hover:bg-slate-50/80'
            }`}
          >
            <IconUpload className="text-slate-400" />
            <p className="mt-3 text-sm font-medium text-slate-700">Drop files here or click to browse</p>
            <p className="mt-1 text-xs text-slate-500">PDF, DOCX, TXT, CSV, XLSX, PNG, JPG, WEBP · up to {MAX_FILES} files</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.docx,.txt,.csv,.xlsx,.png,.jpg,.jpeg,.webp"
              onChange={(e) => {
                if (e.target.files?.length) mergeFiles(e.target.files);
              }}
            />
          </button>
          {files.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-slate-600">
              {files.map((f) => (
                <li key={f.name + f.size}>{f.name}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center gap-2">
        <button
          type="button"
          disabled={loading || !desc.trim()}
          onClick={() => void generate()}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-10 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            'Generating…'
          ) : (
            <>
              <IconSparkles className="text-white" />
              Generate Document
            </>
          )}
        </button>
        {loading && (
          <div className="w-full max-w-xl rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-blue-900">{progress}% complete</p>
              <p className="text-xs text-blue-800/80">{elapsedSec}s</p>
            </div>
            <div
              className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-blue-100"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Document generation progress"
            >
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2.5 text-xs text-blue-800">
              {sectionsDone > 0 && sectionsDone < totalSections
                ? `Writing section ${sectionsDone} of ${totalSections}`
                : liveStage || 'Working…'}
            </p>
          </div>
        )}
        <p className="text-center text-xs text-slate-500">AIPER is an AI and may make mistakes.</p>
      </div>
    </div>
  );
}
