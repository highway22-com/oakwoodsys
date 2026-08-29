/** Turns a URL slug into a title-cased label (e.g. "data-ai-solutions" -> "Data Ai Solutions"). */
export function humanizeSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
