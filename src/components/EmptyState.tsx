import { motion } from 'framer-motion';
import { ClipboardList } from 'lucide-react';

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
        <ClipboardList className="w-8 h-8 text-indigo-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">No checklist items yet</h3>
      <p className="text-sm text-slate-400 text-center max-w-md">
        Start by adding team members and creating todo items.
        Unfinished items automatically carry forward to the next business day.
      </p>
    </motion.div>
  );
}
