/**
 * Simplify markdown for cleaner display: reduce heading levels, compact lists, trim noise.
 * Does not alter the stored content.
 */
export function cleanMarkdownForDisplay(md: string): string {
  if (!md || typeof md !== 'string') return ''
  let out = md
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Collapse 3+ newlines to 2
    .replace(/\n{3,}/g, '\n\n')
    // Reduce ## and ### to bold (## Title -> **Title**)
    .replace(/^#{1,3}\s+(.+)$/gm, '**$1**')
    // Reduce #### and more to bold
    .replace(/^#{4,6}\s+(.+)$/gm, '**$1**')
    // Unify list markers to simple -
    .replace(/^[\*\+]\s+/gm, '- ')
    .replace(/^\d+\.\s+/gm, '- ')
    .trim()
  return out
}
