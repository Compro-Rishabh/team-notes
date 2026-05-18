import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronsUpDown, Copy, Expand, Shrink } from 'lucide-react';
import { useStore } from '@/store';
import { useKeyboardShortcuts } from '@/hooks';
import { StandupCard } from '@/components/StandupCard';
import { DatePicker } from '@/components/DatePicker';
import { ProgressBar } from '@/components/ProgressBar';
import { TeamManagement } from '@/components/TeamManagement';
import { SaveIndicator } from '@/components/SaveIndicator';
import { EmptyState } from '@/components/EmptyState';
import { StandupCardSkeleton } from '@/components/Skeleton';
import { Button } from '@/components/Button';
import { formatDisplayDate } from '@/utils';
import { staggerContainer } from '@/animations';

export function DashboardPage() {
  const {
    members,
    standups,
    standupsLoading,
    membersLoading,
    selectedDate,
    searchQuery,
    setSearchQuery,
    fetchMembers,
    fetchStandups,
    expandAll,
    collapseAll,
    duplicatePreviousDay,
    isDuplicating,
  } = useStore();

  useKeyboardShortcuts();

  useEffect(() => {
    fetchMembers().then(() => fetchStandups());
  }, []);

  const q = searchQuery.trim().toLowerCase();
  const filteredStandups = standups.filter((s) => {
    if (!q) return true;

    const inMember =
      s.memberName.toLowerCase().includes(q) ||
      s.memberEmail.toLowerCase().includes(q);

    if (inMember) return true;

    const allBullets = [...s.yesterday, ...s.today, ...s.blockers, ...s.notes];
    return allBullets.some((b) => b.text.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Daily Standup</h1>
          <p className="text-sm text-slate-500 mt-1">
            {formatDisplayDate(selectedDate)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SaveIndicator />
          <TeamManagement />
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 card-shadow">
        <DatePicker />
        <div className="flex-1" />
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={<Expand className="w-3.5 h-3.5" />}
            onClick={expandAll}
            title="Expand all (Ctrl+Shift+E)"
          >
            <span className="hidden lg:inline">Expand</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Shrink className="w-3.5 h-3.5" />}
            onClick={collapseAll}
            title="Collapse all (Ctrl+Shift+C)"
          >
            <span className="hidden lg:inline">Collapse</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Copy className="w-3.5 h-3.5" />}
            onClick={duplicatePreviousDay}
            loading={isDuplicating}
          >
            <span className="hidden lg:inline">Duplicate Yesterday</span>
            <span className="lg:hidden">Duplicate</span>
          </Button>
        </div>
      </div>

      {/* Progress Stats */}
      {!standupsLoading && standups.length > 0 && <ProgressBar />}

      {/* Standup Cards */}
      {standupsLoading || membersLoading ? (
        <div className="space-y-4">
          <StandupCardSkeleton />
          <StandupCardSkeleton />
          <StandupCardSkeleton />
        </div>
      ) : filteredStandups.length === 0 ? (
        <EmptyState />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          {filteredStandups.map((standup) => (
            <StandupCard key={standup.memberId} standup={standup} />
          ))}
        </motion.div>
      )}

      {/* Keyboard Shortcuts Footer */}
      <div className="hidden md:flex items-center justify-center gap-4 pt-4 text-xs text-slate-400">
        <span><kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 font-mono">Ctrl+S</kbd> Save</span>
        <span><kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 font-mono">Ctrl+Shift+E</kbd> Expand all</span>
        <span><kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 font-mono">Ctrl+Shift+C</kbd> Collapse all</span>
      </div>
    </div>
  );
}
