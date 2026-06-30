import { formatDistanceToNow, format, isPast, isToday, isTomorrow } from 'date-fns';

// ─────────────────────────────────────────────────────────────
// Date formatting
// ─────────────────────────────────────────────────────────────

export function formatDeadline(dateStr: string | null): string {
  if (!dateStr) return 'No deadline';
  try {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Due today';
    if (isTomorrow(date)) return 'Due tomorrow';
    if (isPast(date)) return `Overdue by ${formatDistanceToNow(date)}`;
    return `Due ${formatDistanceToNow(date, { addSuffix: true })}`;
  } catch {
    return 'Invalid date';
  }
}

export function formatDeadlineDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'MMM d, yyyy');
  } catch {
    return '—';
  }
}

export function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  try {
    return isPast(new Date(dateStr));
  } catch {
    return false;
  }
}

export function formatCreatedAt(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return '—';
  }
}

// ─────────────────────────────────────────────────────────────
// Duration formatting
// ─────────────────────────────────────────────────────────────

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatHours(hours: number | null): string {
  if (hours === null) return '—';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return hours === 1 ? '1 hour' : `${hours} hours`;
}

// ─────────────────────────────────────────────────────────────
// Priority helpers
// ─────────────────────────────────────────────────────────────

export function getPriorityLabel(priority: number | null): string {
  if (priority === null) return 'Unscored';
  if (priority >= 9) return 'Critical';
  if (priority >= 7) return 'High';
  if (priority >= 5) return 'Moderate';
  if (priority >= 3) return 'Low';
  return 'Minimal';
}

export function getPriorityCardBorder(priority: number | null): string {
  if (priority === null) return 'border-l-slate-700';
  if (priority >= 9) return 'border-l-red-500';
  if (priority >= 7) return 'border-l-orange-500';
  if (priority >= 5) return 'border-l-violet-500';
  if (priority >= 3) return 'border-l-blue-500';
  return 'border-l-emerald-500';
}

// ─────────────────────────────────────────────────────────────
// Tag parsing
// ─────────────────────────────────────────────────────────────

export function parseTags(rawTags: string): string[] {
  return rawTags
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .slice(0, 10);
}

// ─────────────────────────────────────────────────────────────
// Truncate
// ─────────────────────────────────────────────────────────────

export function truncate(str: string | null, maxLen: number): string {
  if (!str) return '';
  return str.length <= maxLen ? str : `${str.slice(0, maxLen)}…`;
}
