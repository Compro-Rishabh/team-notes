import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store';
import { debounce } from '@/utils';

export function useAutoSave(delay = 3000) {
  const { hasUnsavedChanges, editVersion, saveStandups } = useStore();
  const debouncedSave = useRef(debounce(saveStandups, delay));

  useEffect(() => {
    if (hasUnsavedChanges) {
      debouncedSave.current();
    }
  }, [hasUnsavedChanges, editVersion]);

  return { hasUnsavedChanges, saveNow: saveStandups };
}

export function useKeyboardShortcuts() {
  const { saveStandups, expandAll, collapseAll } = useStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveStandups();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        expandAll();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        collapseAll();
      }
    };

    globalThis.addEventListener('keydown', handler);
    return () => globalThis.removeEventListener('keydown', handler);
  }, [saveStandups, expandAll, collapseAll]);
}

export function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
