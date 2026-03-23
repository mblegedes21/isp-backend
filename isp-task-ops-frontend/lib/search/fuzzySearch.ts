import Fuse from "fuse.js";

interface FuzzySearchOptions {
  threshold?: number;
  minMatchCharLength?: number;
}

export function fuzzySearch<T>(
  items: T[],
  query: string,
  keys: string[],
  options?: FuzzySearchOptions
): T[] {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return items;
  if (items.length === 0 || keys.length === 0) return items;

  const fuse = new Fuse(items, {
    keys,
    includeScore: true,
    ignoreLocation: true,
    threshold: options?.threshold ?? 0.35,
    minMatchCharLength: options?.minMatchCharLength ?? 1
  });

  return fuse.search(normalizedQuery).map((result) => result.item);
}
