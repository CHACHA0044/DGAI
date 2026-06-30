/**
 * Prompt Utilities — Version 1.0.0
 * 
 * Shared functions to sanitize user-provided inputs to prevent prompt injection attacks
 * and ensure structural safety of generated prompts.
 */

/**
 * Sanitizes a string for safe embedding in an AI prompt template.
 * - Strips control characters
 * - Escapes characters that could break prompt structure (backticks, backslashes)
 * - Restricts length to prevent overflow/denial of service
 * - Blocks common prompt injection patterns
 */
export function sanitizeInput(raw: string | null | undefined, maxLength = 500): string {
  if (!raw) return 'Not provided';
  
  return raw
    .replace(/[\x00-\x1F\x7F]/g, ' ')          // Remove control characters
    .replace(/[`\\]/g, '')                        // Remove backticks and backslashes
    .replace(/\bignore\b.*\binstructions\b/gi, '') // Block common injection patterns
    .replace(/\bforget\b.*\bprevious\b/gi, '')
    .replace(/\bsystem prompt\b/gi, '')
    .replace(/\byou are now\b/gi, '')
    .substring(0, maxLength)
    .trim() || 'Not provided';
}

/**
 * Format a Date for embedding in prompts in a human-readable ISO format.
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'No deadline';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  } catch {
    return 'No deadline';
  }
}
