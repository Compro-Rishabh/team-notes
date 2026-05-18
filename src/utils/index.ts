import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getYesterday(dateStr: string): string {
  return getPreviousBusinessDay(dateStr);
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function toBusinessDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  while (isWeekend(date)) {
    date.setDate(date.getDate() + 1);
  }
  return formatDate(date);
}

export function shiftBusinessDays(dateStr: string, delta: number): string {
  const date = new Date(dateStr + 'T00:00:00');
  const direction = delta >= 0 ? 1 : -1;
  let remaining = Math.abs(delta);

  while (remaining > 0) {
    date.setDate(date.getDate() + direction);
    if (!isWeekend(date)) {
      remaining -= 1;
    }
  }

  return formatDate(date);
}

export function getPreviousBusinessDay(dateStr: string): string {
  return shiftBusinessDays(dateStr, -1);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
