import { getSupabaseClient } from '../../lib/supabase';

const STORAGE_KEY = 'aiper-user-templates-v1';
const LEGACY_MIGRATION_KEY = 'aiper-user-templates-migrated-v1';
const TABLE_NAME = 'user_templates';

export interface UserTemplateRecord {
  id: string;
  name: string;
  /** One of the five built-in template ids (test_procedure, test_log, …). */
  baseTypeId: string;
  outline: string[];
  sourceFileName?: string;
  createdAt: string;
}

function loadLocalTemplates(): UserTemplateRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is UserTemplateRecord =>
        typeof x === 'object' &&
        x !== null &&
        typeof (x as UserTemplateRecord).id === 'string' &&
        typeof (x as UserTemplateRecord).name === 'string' &&
        typeof (x as UserTemplateRecord).baseTypeId === 'string' &&
        Array.isArray((x as UserTemplateRecord).outline),
    );
  } catch {
    return [];
  }
}

function persistLocalTemplates(list: UserTemplateRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

async function getCurrentUserId() {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const auth = await sb.auth.getUser();
  return auth.data.user?.id ?? null;
}

async function migrateLegacyTemplatesIfNeeded(userId: string) {
  const marker = `${LEGACY_MIGRATION_KEY}:${userId}`;
  if (localStorage.getItem(marker) === '1') return;
  const legacy = loadLocalTemplates();
  if (!legacy.length) {
    localStorage.setItem(marker, '1');
    return;
  }
  const sb = getSupabaseClient();
  if (!sb) return;

  const payload = legacy.map((item) => ({
    id: item.id,
    user_id: userId,
    name: item.name,
    base_type_id: item.baseTypeId,
    outline: item.outline,
    source_file_name: item.sourceFileName ?? null,
    created_at: item.createdAt,
  }));
  await sb.from(TABLE_NAME).upsert(payload);
  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(marker, '1');
}

export async function loadUserTemplates(): Promise<UserTemplateRecord[]> {
  const sb = getSupabaseClient();
  const userId = await getCurrentUserId();
  if (!sb || !userId) return loadLocalTemplates();

  await migrateLegacyTemplatesIfNeeded(userId);

  const { data, error } = await sb
    .from(TABLE_NAME)
    .select('id, name, base_type_id, outline, source_file_name, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    baseTypeId: row.base_type_id,
    outline: Array.isArray(row.outline) ? row.outline.map((x) => String(x)) : [],
    sourceFileName: row.source_file_name ?? undefined,
    createdAt: row.created_at,
  }));
}

export async function addUserTemplate(record: Omit<UserTemplateRecord, 'id' | 'createdAt'>): Promise<UserTemplateRecord> {
  const sb = getSupabaseClient();
  const userId = await getCurrentUserId();
  const full: UserTemplateRecord = {
    ...record,
    id: `custom-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
  };
  if (!sb || !userId) {
    const list = loadLocalTemplates();
    persistLocalTemplates([full, ...list]);
    return full;
  }
  const { error } = await sb.from(TABLE_NAME).insert({
    id: full.id,
    user_id: userId,
    name: full.name,
    base_type_id: full.baseTypeId,
    outline: full.outline,
    source_file_name: full.sourceFileName ?? null,
    created_at: full.createdAt,
  });
  if (error) throw new Error(error.message || 'Failed to save template');
  return full;
}

export async function updateUserTemplate(
  id: string,
  patch: Partial<Pick<UserTemplateRecord, 'name' | 'baseTypeId' | 'outline' | 'sourceFileName'>>,
): Promise<UserTemplateRecord | null> {
  const sb = getSupabaseClient();
  const userId = await getCurrentUserId();
  if (!sb || !userId) {
    const list = loadLocalTemplates();
    const idx = list.findIndex((t) => t.id === id);
    if (idx < 0) return null;
    const prev = list[idx];
    const next: UserTemplateRecord = { ...prev, ...patch };
    list[idx] = next;
    persistLocalTemplates(list);
    return next;
  }

  const { data: current, error: currentErr } = await sb
    .from(TABLE_NAME)
    .select('id, name, base_type_id, outline, source_file_name, created_at')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (currentErr || !current) return null;

  const { error } = await sb
    .from(TABLE_NAME)
    .update({
      name: patch.name ?? current.name,
      base_type_id: patch.baseTypeId ?? current.base_type_id,
      outline: patch.outline ?? current.outline,
      source_file_name: patch.sourceFileName ?? current.source_file_name,
    })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw new Error(error.message || 'Failed to update template');

  return {
    id: current.id,
    name: patch.name ?? current.name,
    baseTypeId: patch.baseTypeId ?? current.base_type_id,
    outline: (patch.outline ?? current.outline) as string[],
    sourceFileName: patch.sourceFileName ?? current.source_file_name ?? undefined,
    createdAt: current.created_at,
  };
}

export async function deleteUserTemplate(id: string): Promise<void> {
  const sb = getSupabaseClient();
  const userId = await getCurrentUserId();
  if (!sb || !userId) {
    const list = loadLocalTemplates().filter((t) => t.id !== id);
    persistLocalTemplates(list);
    return;
  }
  const { error } = await sb.from(TABLE_NAME).delete().eq('id', id).eq('user_id', userId);
  if (error) throw new Error(error.message || 'Failed to delete template');
}

export function persistUserTemplatesForTestingOnly(list: UserTemplateRecord[]) {
  persistLocalTemplates(list);
}
