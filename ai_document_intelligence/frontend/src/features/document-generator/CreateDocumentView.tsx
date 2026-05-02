import { useEffect, useMemo, useRef, useState } from 'react';
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

export function CreateDocumentView({ template, onGenerated, onError }: CreateDocumentViewProps) {
  const [desc, setDesc] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [liveDraft, setLiveDraft] = useState('');
  const [liveStage, setLiveStage] = useState<string | null>(null);
  const [stageTimeline, setStageTimeline] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadingStages = useMemo(
    () => [
      'Preparing your template context',
      'Reading uploaded evidence and notes',
      'Generating section-by-section draft',
      'Finalizing structured output',
    ],
    [],
  );

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
    setLiveDraft('');
    setLiveStage('Preparing generation request');
    setStageTimeline(['Preparing generation request']);
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
          setStageTimeline((prev) => {
            if (prev[prev.length - 1] === payload.message) return prev;
            const next = [...prev, payload.message];
            return next.slice(-8);
          });
          return;
        }
        if (currentEvent === 'draft' && typeof payload.text === 'string') {
          setLiveDraft((prev) => prev + payload.text);
          return;
        }
        if (currentEvent === 'completed' && payload.document) {
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
          <div className="w-full max-w-xl rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-900">
            <p className="font-medium">AI drafting in progress ({elapsedSec}s)</p>
            <p className="mt-1 text-blue-800">
              {liveStage || loadingStages[Math.min(loadingStages.length - 1, Math.floor(elapsedSec / 3))]}
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${Math.min(95, 20 + elapsedSec * 5)}%` }}
              />
            </div>
            {stageTimeline.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-blue-800/90">
                {stageTimeline.map((stage, index) => (
                  <li key={`${index}-${stage}`}>- {stage}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        {loading && (
          <div className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Live draft</p>
            <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
              {liveDraft || 'Waiting for first tokens...'}
            </pre>
          </div>
        )}
        <p className="text-center text-xs text-slate-500">Structured output is generated by AI from your inputs and the selected template.</p>
      </div>
    </div>
  );
}
