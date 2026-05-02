import { useState, type ReactNode } from 'react';
import {
  IconBell,
  IconFileText,
  IconFolder,
  IconGitBranch,
  IconHelp,
  IconHome,
  IconLayers,
  IconRefresh,
  IconRocket,
  IconSettings,
  IconStethoscope,
  IconChevronDown,
  IconBot,
} from './Icons';

const railItems = [
  {
    Icon: IconHome,
    id: 'home' as const,
    title: 'Compatibility Checker',
    description: 'Compare aerospace components and analyze interface compatibility',
  },
  {
    Icon: IconGitBranch,
    id: 'branch' as const,
    title: 'Product Tree',
    description: 'Browse and manage component library with version history',
  },
  {
    Icon: IconLayers,
    id: 'layers' as const,
    title: 'System Graph',
    description: 'Visual spacecraft architecture with interface mapping and change impact analysis',
  },
  {
    Icon: IconStethoscope,
    id: 'health' as const,
    title: 'Traceability',
    description: 'Track document changes and line-level version history',
  },
  {
    Icon: IconFileText,
    id: 'docs' as const,
    title: 'Document Generator',
    description: 'Generate ECSS-compliant test reports and procedures',
    active: true,
  },
  {
    Icon: IconRefresh,
    id: 'history' as const,
    title: 'Sync & Update',
    description: 'Automatically sync information across multiple documents',
  },
  {
    Icon: IconRocket,
    id: 'rocket' as const,
    title: 'Release Assistant',
    description: 'Automate document release preparation and changelog generation',
  },
];

interface AppLayoutProps {
  activeRailId?: string;
  onSelectRail?: (id: string) => void;
  /** Currently highlighted template id in sidebar */
  selectedTemplateId: string | null;
  onSelectTemplate: (id: string) => void;
  onNewTemplate: () => void;
  builtinTemplates: { id: string; label: string }[];
  customTemplates: { id: string; label: string }[];
  onEditCustomTemplate?: (id: string) => void;
  onDeleteCustomTemplate?: (id: string) => void;
  recentDocs: { id: string; title: string }[];
  activeRecentId: string | null;
  onOpenRecent: (id: string) => void;
  children: ReactNode;
  showTemplateSidebar?: boolean;
  /** Document view: show bell in header */
  variant?: 'default' | 'editor';
}

export function AppLayout({
  activeRailId = 'home',
  onSelectRail,
  selectedTemplateId,
  onSelectTemplate,
  onNewTemplate,
  builtinTemplates,
  customTemplates,
  onEditCustomTemplate,
  onDeleteCustomTemplate,
  recentDocs,
  activeRecentId,
  onOpenRecent,
  children,
  showTemplateSidebar = true,
  variant = 'default',
}: AppLayoutProps) {
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-[#f8fafc] text-slate-800">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-5">
        <div className="flex items-center gap-2">
          <img src="/aiper-logo.png" alt="AIPER space" className="h-14 w-auto max-w-[250px] shrink-0 object-contain object-left" />
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setProjectMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              <IconFolder className="text-slate-500" />
              <span>Alfa Project</span>
              <IconChevronDown className="text-slate-400" />
            </button>
            {projectMenuOpen && (
              <div className="absolute right-0 z-30 mt-2 w-[320px] rounded-xl border border-slate-200 bg-white shadow-lg">
                <p className="border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Switch Project</p>
                <div className="space-y-0.5 p-2">
                  {[
                    { name: 'Alfa Project', desc: 'Next-gen satellite platform', selected: true },
                    { name: 'Beta Mission', desc: 'Earth observation constellation', selected: false },
                    { name: 'Gamma Satellite', desc: 'Deep space communications', selected: false },
                  ].map(({ name, desc, selected }) => (
                    <button
                      key={name}
                      type="button"
                      className="flex w-full items-start justify-between rounded-lg px-3 py-2.5 text-left hover:bg-slate-50"
                    >
                      <span>
                        <span className="block text-sm font-semibold text-slate-800">{name}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">{desc}</span>
                      </span>
                      {selected ? <span className="mt-1 h-2 w-2 rounded-full bg-slate-800" /> : null}
                    </button>
                  ))}
                </div>
                <button type="button" className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-3 text-left text-sm font-medium text-slate-800 hover:bg-slate-50">
                  <span className="text-xl leading-none">+</span> Create new project
                </button>
              </div>
            )}
          </div>
          <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700" title="Help">
            <IconHelp />
          </button>
          {variant === 'editor' && (
            <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700" title="Notifications">
              <IconBell />
            </button>
          )}
          <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700" title="Settings">
            <IconSettings />
          </button>
          <div
            className="flex h-10 w-10 cursor-default items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white"
            title="Profile"
          >
            MF
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-slate-200/80 bg-white py-3" aria-label="Primary">
          {railItems.map(({ Icon, title, description, id }) => (
            <div key={id} className="group relative">
              <button
                type="button"
                onClick={() => onSelectRail?.(id)}
                className={`rounded-xl p-2.5 transition ${
                  activeRailId === id ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                <Icon />
              </button>
              <div className="pointer-events-none absolute left-14 top-1/2 z-40 hidden w-[300px] -translate-y-1/2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg group-hover:block">
                <p className="mt-1 text-sm font-semibold text-slate-900">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
              </div>
            </div>
          ))}
        </nav>

        {showTemplateSidebar && (
          <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200/80 bg-white">
          <div className="p-3">
            <button
              type="button"
              onClick={onNewTemplate}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white py-2.5 text-sm font-medium text-blue-900 shadow-sm transition hover:bg-slate-50"
            >
              <span className="text-lg leading-none font-normal text-slate-900">+</span> New Template
            </button>
          </div>
          <div className="px-3 pb-2">
            <div className="flex items-center gap-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <IconFolder className="h-3.5 w-3.5 text-slate-400" aria-hidden />
              <span>Templates</span>
            </div>
            <ul className="mt-2 space-y-0.5">
              {builtinTemplates.map((t) => {
                const isSel = selectedTemplateId === t.id && !activeRecentId;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => onSelectTemplate(t.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition ${
                        isSel ? 'bg-blue-50 font-medium text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <IconFileText className={`shrink-0 ${isSel ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className="leading-snug">{t.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {customTemplates.length > 0 && (
              <>
                <p className="mt-4 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Your templates</p>
                <ul className="mt-2 space-y-0.5">
                  {customTemplates.map((t) => {
                    const isSel = selectedTemplateId === t.id && !activeRecentId;
                    return (
                      <li key={t.id}>
                        <div
                          className={`group flex w-full items-center gap-1 rounded-lg px-1 py-1 text-left text-sm transition ${
                            isSel ? 'bg-blue-50 font-medium text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onSelectTemplate(t.id)}
                            className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1.5 text-left"
                          >
                            <IconFolder className={`shrink-0 ${isSel ? 'text-blue-600' : 'text-slate-400'}`} />
                            <span className="truncate leading-snug">{t.label}</span>
                          </button>
                          {onEditCustomTemplate ? (
                            <button
                              type="button"
                              title="Edit template"
                              className={`shrink-0 rounded px-1.5 py-1 text-[10px] font-medium text-slate-500 hover:bg-slate-200/80 hover:text-blue-700 ${
                                isSel ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditCustomTemplate(t.id);
                              }}
                            >
                              Edit
                            </button>
                          ) : null}
                          {onDeleteCustomTemplate ? (
                            <button
                              type="button"
                              title="Delete template"
                              className={`shrink-0 rounded px-1.5 py-1 text-[10px] font-medium text-slate-500 hover:bg-red-50 hover:text-red-700 ${
                                isSel ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteCustomTemplate(t.id);
                              }}
                            >
                              Del
                            </button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
          {recentDocs.length > 0 && (
            <div className="mt-auto border-t border-slate-100 px-3 py-3">
              <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Recent</p>
              <ul className="mt-2 space-y-0.5">
                {recentDocs.map((r) => {
                  const isActive = activeRecentId === r.id;
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => onOpenRecent(r.id)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition ${
                          isActive ? 'bg-blue-50 font-medium text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <IconFileText className={`shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span className="line-clamp-2 leading-snug">{r.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          </aside>
        )}

        <main className="min-w-0 flex-1 overflow-auto bg-white">{children}</main>
      </div>

      <button
        type="button"
        className="fixed bottom-6 right-6 z-20 flex items-center gap-2 rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-600"
      >
        <IconBot />
        <span className="text-sm">AI Assistant</span>
        <span className="text-white/80">&lt;</span>
      </button>
    </div>
  );
}
