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

/**
 * Detect error/failure content in synthesis text (JSON error objects, failure keywords).
 */
export function isErrorContent(text: string): boolean {
  if (!text || typeof text !== 'string') return false
  const lower = text.trim().toLowerCase()
  // JSON error objects
  if (/^\s*\{/.test(text) && /"error"/i.test(text)) return true
  // Common failure patterns
  if (lower.startsWith('error:') || lower.startsWith('failed to')) return true
  if (/synthesis (failed|unavailable|error)/i.test(text)) return true
  return false
}

/**
 * Strip all markdown formatting for plain-text contexts (previews, summaries).
 * Removes headings, bold, italic, links, images, list markers, and collapses whitespace.
 */
export function stripMarkdown(md: string): string {
  if (!md || typeof md !== 'string') return ''
  return md
    // Remove images ![alt](url)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    // Convert links [text](url) to text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    // Remove heading markers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic markers
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
    // Remove strikethrough
    .replace(/~~([^~]+)~~/g, '$1')
    // Remove inline code backticks
    .replace(/`([^`]+)`/g, '$1')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove list markers (-, *, +, 1.)
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Collapse newlines to spaces
    .replace(/\n+/g, ' ')
    // Collapse multiple spaces
    .replace(/\s{2,}/g, ' ')
    .trim()
}
