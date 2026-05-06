import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { CreateDocumentView } from './CreateDocumentView';
import { DocumentEditorView } from './DocumentEditorView';
import { WelcomeView } from './WelcomeView';
import { NewTemplateModal } from './NewTemplateModal';
import { getTemplate, TEMPLATES } from './templates';
import type { GeneratedDocument, RecentDocument } from './types';
import { deleteUserTemplate, loadUserTemplates, type UserTemplateRecord } from './userTemplates';
import { CompatibilityCheckerPage } from '../compatibility-checker/CompatibilityCheckerPage';
import { bootstrapSupabaseSessionFromUrl } from '../../lib/supabase';

type Mode = 'welcome' | 'create' | 'editor';

const WIP_FEATURE_TITLES: Record<string, string> = {
  branch: 'Product Tree',
  layers: 'System Graph',
  health: 'Traceability',
  history: 'Sync & Update',
  rocket: 'Release Assistant',
};

export function DocumentGeneratorPage() {
  const initialFeature = new URLSearchParams(window.location.search).get('feature');
  const startsInDocs = initialFeature === 'document-generator';
  const [activeRailId, setActiveRailId] = useState<string>(startsInDocs ? 'docs' : 'home');
  const [mode, setMode] = useState<Mode>(startsInDocs ? 'create' : 'welcome');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(startsInDocs ? 'test_report' : null);
  const [currentDoc, setCurrentDoc] = useState<GeneratedDocument | null>(null);
  const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([]);
  const [activeRecentId, setActiveRecentId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [userTemplates, setUserTemplates] = useState<UserTemplateRecord[]>([]);
  const [newTemplateOpen, setNewTemplateOpen] = useState(false);
  const [editingUserTemplate, setEditingUserTemplate] = useState<UserTemplateRecord | null>(null);

  const template = getTemplate(selectedTemplateId, userTemplates);

  const selectedBaseTypeId = useMemo(() => {
    if (!selectedTemplateId) return null;
    const builtin = TEMPLATES.find((t) => t.id === selectedTemplateId);
    if (builtin) return builtin.id;
    const custom = userTemplates.find((t) => t.id === selectedTemplateId);
    return custom?.baseTypeId ?? null;
  }, [selectedTemplateId, userTemplates]);

  const customTemplatesSidebar = useMemo(() => {
    const visible = selectedBaseTypeId ? userTemplates.filter((u) => u.baseTypeId === selectedBaseTypeId) : userTemplates;
    return visible.map((u) => ({
      id: u.id,
      label: u.name,
    }));
  }, [selectedBaseTypeId, userTemplates]);

  const refreshUserTemplates = useCallback(async () => {
    const loaded = await loadUserTemplates();
    setUserTemplates(loaded);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      await bootstrapSupabaseSessionFromUrl();
      const loaded = await loadUserTemplates();
      if (!alive) return;
      setUserTemplates(loaded);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleSelectTemplate = useCallback((id: string) => {
    setActiveRailId('docs');
    void refreshUserTemplates();
    setSelectedTemplateId(id);
    setMode('create');
    setCurrentDoc(null);
    setActiveRecentId(null);
    setBanner(null);
  }, [refreshUserTemplates]);

  const handleNewTemplate = useCallback(() => {
    setEditingUserTemplate(null);
    setNewTemplateOpen(true);
    setBanner(null);
  }, []);

  const handleEditCustomTemplate = useCallback((id: string) => {
    const t = userTemplates.find((x) => x.id === id);
    if (!t) return;
    setEditingUserTemplate(t);
    setNewTemplateOpen(true);
    setBanner(null);
  }, [userTemplates]);

  const handleDeleteCustomTemplate = useCallback(async (id: string) => {
    if (!window.confirm('Delete this template? This cannot be undone.')) return;
    try {
      await deleteUserTemplate(id);
      await refreshUserTemplates();
    } catch (err) {
      setBanner(err instanceof Error ? err.message : 'Could not delete template.');
      return;
    }
    setRecentDocs((prev) => prev.filter((r) => r.templateId !== id));
    if (selectedTemplateId === id) {
      setSelectedTemplateId(null);
      setMode('welcome');
      setCurrentDoc(null);
      setActiveRecentId(null);
    }
    setEditingUserTemplate((cur) => (cur?.id === id ? null : cur));
    setBanner(null);
  }, [refreshUserTemplates, selectedTemplateId]);

  const handleUserTemplateSaved = useCallback((record: UserTemplateRecord) => {
    void refreshUserTemplates();
    setSelectedTemplateId(record.id);
    setCurrentDoc(null);
    setActiveRecentId(null);
    setMode('create');
    setBanner(null);
    setNewTemplateOpen(false);
    setEditingUserTemplate(null);
  }, [refreshUserTemplates]);

  const handleOpenRecent = useCallback(
    (id: string) => {
      const found = recentDocs.find((r) => r.id === id);
      if (!found) return;
      setCurrentDoc(found.doc);
      setActiveRailId('docs');
      setSelectedTemplateId(found.templateId);
      setActiveRecentId(id);
      setMode('editor');
      setBanner(null);
      void refreshUserTemplates();
    },
    [recentDocs, refreshUserTemplates],
  );

  const handleGenerated = useCallback(
    (doc: GeneratedDocument) => {
      const id = crypto.randomUUID();
      const tpl = selectedTemplateId ?? 'test_report';
      setRecentDocs((prev) => [{ id, title: doc.title, templateId: tpl, doc }, ...prev].slice(0, 12));
      setCurrentDoc(doc);
      setActiveRecentId(id);
      setMode('editor');
      setBanner(null);
    },
    [selectedTemplateId],
  );

  const handleBackToCreate = useCallback(() => {
    if (!selectedTemplateId) {
      setMode('welcome');
      return;
    }
    setMode('create');
    setCurrentDoc(null);
    setActiveRecentId(null);
  }, [selectedTemplateId]);

  const handleDocEdited = useCallback(
    (nextDoc: GeneratedDocument) => {
      setCurrentDoc(nextDoc);
      if (!activeRecentId) return;
      setRecentDocs((prev) =>
        prev.map((item) => (item.id === activeRecentId ? { ...item, title: nextDoc.title, doc: nextDoc } : item)),
      );
    },
    [activeRecentId],
  );

  const isWorkInProgressFeature = activeRailId in WIP_FEATURE_TITLES;

  return (
    <AppLayout
      activeRailId={activeRailId}
      onSelectRail={(id) => setActiveRailId(id)}
      selectedTemplateId={activeRecentId ? null : selectedTemplateId}
      onSelectTemplate={handleSelectTemplate}
      onNewTemplate={handleNewTemplate}
      builtinTemplates={TEMPLATES.map(({ id, label }) => ({ id, label }))}
      customTemplates={customTemplatesSidebar}
      onEditCustomTemplate={handleEditCustomTemplate}
      onDeleteCustomTemplate={handleDeleteCustomTemplate}
      recentDocs={recentDocs}
      activeRecentId={activeRecentId}
      onOpenRecent={handleOpenRecent}
      showTemplateSidebar={activeRailId === 'docs'}
      variant={mode === 'editor' ? 'editor' : 'default'}
    >
      {activeRailId === 'home' ? (
        <CompatibilityCheckerPage />
      ) : isWorkInProgressFeature ? (
        <section className="mx-auto flex h-full w-full max-w-4xl items-center justify-center px-8 py-12">
          <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Work in Progress</p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900">{WIP_FEATURE_TITLES[activeRailId]}</h1>
            <p className="mt-3 text-sm text-slate-600">
              This feature is currently under development and will be available in an upcoming update.
            </p>
          </div>
        </section>
      ) : (
        <>
          {banner && (
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-900" role="alert">
          {banner}
        </div>
          )}
          {mode === 'editor' && currentDoc ? (
            <DocumentEditorView doc={currentDoc} onBackToCreate={handleBackToCreate} onDocChange={handleDocEdited} />
          ) : mode === 'create' && template ? (
            <CreateDocumentView template={template} onGenerated={handleGenerated} onError={(m) => setBanner(m)} />
          ) : (
            <WelcomeView />
          )}
        </>
      )}
      <NewTemplateModal
        open={newTemplateOpen}
        onClose={() => {
          setNewTemplateOpen(false);
          setEditingUserTemplate(null);
        }}
        baseTypes={TEMPLATES}
        editingRecord={editingUserTemplate}
        onSaved={handleUserTemplateSaved}
        onError={(m) => setBanner(m)}
      />
    </AppLayout>
  );
}
