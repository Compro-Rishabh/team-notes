import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Clock } from 'lucide-react';
import { MemberStandup, StandupSection, BulletItem } from '@/types';
import { useStore } from '@/store';
import { Avatar } from './Avatar';
import { BulletList } from './BulletList';
import { cn } from '@/utils';

interface StandupCardProps {
  standup: MemberStandup;
}

export function StandupCard({ standup }: StandupCardProps) {
  const { expandedMembers, toggleMember, updateStandup } = useStore();
  const isExpanded = expandedMembers.has(standup.memberId);

  const hasContent = [...standup.yesterday, ...standup.today, ...standup.blockers, ...standup.notes].some(
    (b) => b.text.trim() !== ''
  );

  const totalBullets = [
    ...standup.yesterday,
    ...standup.today,
    ...standup.blockers,
    ...standup.notes,
  ].filter((b) => b.text.trim()).length;

  const handleSectionChange = (section: StandupSection) => (items: BulletItem[]) => {
    updateStandup(standup.memberId, { [section]: items });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-white rounded-xl border transition-all duration-200',
        isExpanded ? 'card-shadow-hover border-slate-200' : 'card-shadow border-slate-100 hover:border-slate-200'
      )}
    >
      {/* Header */}
      <button
        onClick={() => toggleMember(standup.memberId)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50/50 rounded-xl transition-colors"
      >
        <Avatar name={standup.memberName} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-slate-900 truncate">{standup.memberName}</h3>
            {hasContent && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                {totalBullets} items
              </span>
            )}
            {!hasContent && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600">
                No updates
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 truncate">{standup.memberEmail}</p>
        </div>
        {standup.updatedAt && (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            <span>{new Date(standup.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 pt-1 space-y-4 ml-13">
              <BulletList
                section="yesterday"
                items={standup.yesterday}
                onChange={handleSectionChange('yesterday')}
                placeholder="What did you work on yesterday?"
              />
              <BulletList
                section="today"
                items={standup.today}
                onChange={handleSectionChange('today')}
                placeholder="What will you work on today?"
              />
              <BulletList
                section="blockers"
                items={standup.blockers}
                onChange={handleSectionChange('blockers')}
                placeholder="Any blockers?"
              />
              <BulletList
                section="notes"
                items={standup.notes}
                onChange={handleSectionChange('notes')}
                placeholder="Additional notes..."
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
