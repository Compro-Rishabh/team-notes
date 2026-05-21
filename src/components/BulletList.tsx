import { useRef, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, GripVertical, Plus } from 'lucide-react';
import { ChecklistItem } from '@/types';
import { generateId } from '@/utils';

interface BulletListProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  placeholder?: string;
}

export function BulletList({ items, onChange, placeholder }: Readonly<BulletListProps>) {
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const addBullet = (afterIndex: number) => {
    const newItem: ChecklistItem = { id: generateId(), text: '', order: afterIndex + 1, done: false };
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
      onChange([{ ...items[0], text: '', done: false }]);
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

  const toggleDone = (index: number) => {
    const newItems = items.map((item, i) =>
      i === index ? { ...item, done: !item.done } : item
    );
    onChange(newItems);
  };

  const clearCompleted = () => {
    const active = items.filter((item) => !(item.done && item.text.trim() !== ''));
    if (active.length === 0) {
      onChange([{ id: generateId(), text: '', order: 0, done: false }]);
      return;
    }

    onChange(active.map((item, index) => ({ ...item, order: index })));
  };

  const completedCount = items.filter((item) => item.done && item.text.trim() !== '').length;

  return (
    <div className="border-l-2 border-indigo-400 pl-4 py-2">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Team Todo Checklist
        </div>
        {completedCount > 0 && (
          <button
            onClick={clearCompleted}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Clear done ({completedCount})
          </button>
        )}
      </div>
      <div className="space-y-1">
        <AnimatePresence>
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
              <button
                type="button"
                onClick={() => toggleDone(index)}
                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                  item.done
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-slate-300 hover:border-indigo-400'
                }`}
              >
                {item.done && <Check className="w-3 h-3" />}
              </button>
              <input
                ref={(el) => {
                  if (el) inputRefs.current.set(item.id, el);
                }}
                type="text"
                value={item.text}
                onChange={(e) => updateText(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                placeholder={index === 0 ? placeholder || 'Type here...' : ''}
                className={`flex-1 bg-transparent border-none outline-none text-sm placeholder:text-slate-300 py-1 ${
                  item.done ? 'text-slate-400 line-through' : 'text-slate-700'
                }`}
              />
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
