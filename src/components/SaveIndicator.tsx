import { useStore } from '@/store';
import { useAutoSave } from '@/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Cloud, CloudOff } from 'lucide-react';

export function SaveIndicator() {
  const { hasUnsavedChanges, saveNow } = useAutoSave();

  return (
    <AnimatePresence mode="wait">
      {hasUnsavedChanges ? (
        <motion.button
          key="unsaved"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={saveNow}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors"
        >
          <CloudOff className="w-3.5 h-3.5" />
          <span>Unsaved changes</span>
        </motion.button>
      ) : (
        <motion.div
          key="saved"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium"
        >
          <Cloud className="w-3.5 h-3.5" />
          <span>Saved</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
