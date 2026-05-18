import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { BulletItem, StandupSection } from '@/types';
import { generateId } from '@/utils';

interface BulletListProps {
  section: StandupSection;
  items: BulletItem[];
  onChange: (items: BulletItem[]) => void;
  placeholder?: string;
}

const sectionLabels: Record<StandupSection, string> = {
  yesterday: 'Yesterday',
  today: 'Today',
  blockers: 'Blockers',
  notes: 'Additional Notes',
};

const sectionColors: Record<StandupSection, string> = {
  yesterday: 'border-l-slate-300',
  today: 'border-l-indigo-400',
  blockers: 'border-l-red-400',
  notes: 'border-l-amber-400',
};

export function BulletList({ section, items, onChange, placeholder }: BulletListProps) {
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const addBullet = (afterIndex: number) => {
    const newItem: BulletItem = { id: generateId(), text: '', order: afterIndex + 1 };
    const newItems = [...items];
    newItems.splice(afterIndex + 1, 0, newItem);
    // Reorder
    const reordered = newItems.map((item, i) => ({ ...item, order: i }));
    onChange(reordered);
    // Focus new item
    setTimeout(() => {
      inputRefs.current.get(newItem.id)?.focus();
    }, 50);
  };

  const removeBullet = (index: number) => {
    if (items.length <= 1) {
      // Don't remove last bullet, just clear it
      onChange([{ ...items[0], text: '' }]);
      return;
    }
    const newItems = items.filter((_, i) => i !== index);
    const reordered = newItems.map((item, i) => ({ ...item, order: i }));
    onChange(reordered);
    // Focus previous item
    if (index > 0) {
      const prevItem = reordered[index - 1];
      setTimeout(() => {
        const input = inputRefs.current.get(prevItem.id);
        if (input) {
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }, 50);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBullet(index);
    }
    if (e.key === 'Backspace' && items[index].text === '' && items.length > 1) {
      e.preventDefault();
      removeBullet(index);
    }
    if (e.key === 'ArrowDown' && index < items.length - 1) {
      e.preventDefault();
      const nextItem = items[index + 1];
      inputRefs.current.get(nextItem.id)?.focus();
    }
    if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      const prevItem = items[index - 1];
      inputRefs.current.get(prevItem.id)?.focus();
    }
  };

  const updateText = (index: number, text: string) => {
    const newItems = items.map((item, i) =>
      i === index ? { ...item, text } : item
    );
    onChange(newItems);
  };

  return (
    <div className={`border-l-2 ${sectionColors[section]} pl-4 py-2`}>
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        {sectionLabels[section]}
      </div>
      <div className="space-y-1">
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="group flex items-center gap-1"
            >
              <GripVertical className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab flex-shrink-0" />
              <span className="text-slate-400 text-sm flex-shrink-0">•</span>
              <input
                ref={(el) => {
                  if (el) inputRefs.current.set(item.id, el);
                }}
                type="text"
                value={item.text}
                onChange={(e) => updateText(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onFocus={() => setFocusedId(item.id)}
                onBlur={() => setFocusedId(null)}
                placeholder={index === 0 ? placeholder || 'Type here...' : ''}
                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-300 py-1"
              />
              {items.length > 1 && (
                <button
                  onClick={() => removeBullet(index)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 transition-all"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <button
          onClick={() => addBullet(items.length - 1)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-500 transition-colors pl-4 py-1"
        >
          <Plus className="w-3 h-3" />
          <span>Add item</span>
        </button>
      </div>
    </div>
  );
}
