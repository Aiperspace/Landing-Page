const STORAGE_KEY = 'aiper-user-templates-v1';

export interface UserTemplateRecord {
  id: string;
  name: string;
  /** One of the five built-in template ids (test_procedure, test_log, …). */
  baseTypeId: string;
  outline: string[];
  sourceFileName?: string;
  createdAt: string;
}

export function loadUserTemplates(): UserTemplateRecord[] {
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

export function persistUserTemplates(list: UserTemplateRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addUserTemplate(record: Omit<UserTemplateRecord, 'id' | 'createdAt'>): UserTemplateRecord {
  const list = loadUserTemplates();
  const full: UserTemplateRecord = {
    ...record,
    id: `custom-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
  };
  persistUserTemplates([full, ...list]);
  return full;
}

export function updateUserTemplate(
  id: string,
  patch: Partial<Pick<UserTemplateRecord, 'name' | 'baseTypeId' | 'outline' | 'sourceFileName'>>,
): UserTemplateRecord | null {
  const list = loadUserTemplates();
  const idx = list.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  const prev = list[idx];
  const next: UserTemplateRecord = { ...prev, ...patch };
  list[idx] = next;
  persistUserTemplates(list);
  return next;
}

export function deleteUserTemplate(id: string) {
  const list = loadUserTemplates().filter((t) => t.id !== id);
  persistUserTemplates(list);
}
