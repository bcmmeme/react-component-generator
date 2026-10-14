import type { GeneratedComponent } from '../types';

export const STORAGE_KEY = 'rcg:components';

type ReadableStorage = Pick<Storage, 'getItem'>;
type WritableStorage = Pick<Storage, 'setItem'>;

function parseComponent(value: unknown): GeneratedComponent | null {
  if (typeof value !== 'object' || value === null) return null;
  const { id, prompt, code, createdAt } = value as Record<string, unknown>;
  if (typeof id !== 'string' || typeof prompt !== 'string' || typeof code !== 'string') return null;
  if (typeof createdAt !== 'string') return null;

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;

  return { id, prompt, code, createdAt: date };
}

export function loadComponents(storage: ReadableStorage): GeneratedComponent[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((item) => parseComponent(item) ?? []);
  } catch {
    return [];
  }
}

export function saveComponents(components: GeneratedComponent[], storage: WritableStorage): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(components));
    return true;
  } catch {
    return false;
  }
}
