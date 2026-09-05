import { format, formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return format(new Date(value), 'd MMM yyyy', { locale: nl });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return format(new Date(value), 'd MMM yyyy HH:mm', { locale: nl });
}

export function formatRelative(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return formatDistanceToNow(new Date(value), { locale: nl, addSuffix: true });
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}
