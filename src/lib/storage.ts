/**
 * Safe localStorage for structured preferences. Every value is stored as
 * `{ v: schemaVersion, data }`; a missing, unparsable, wrong-version or invalid entry reads as
 * null so callers fall back to their defaults. Storage can be absent or throw (private mode,
 * blocked site data), so every access is guarded. Read only after hydration.
 */
export function readStore<T>(
  key: string,
  schemaVersion: number,
  validate: (data: unknown) => data is T,
): T | null {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { v, data } = parsed as { v?: unknown; data?: unknown };
    return v === schemaVersion && validate(data) ? data : null;
  } catch {
    return null;
  }
}

export function writeStore<T>(key: string, schemaVersion: number, data: T): void {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify({ v: schemaVersion, data }));
  } catch {
    /* quota or blocked storage: the value lives for this page view only */
  }
}
