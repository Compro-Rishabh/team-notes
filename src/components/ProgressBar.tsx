import { useStore } from '@/store';
import { Users, BarChart3, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function ProgressBar() {
  const { standups, members } = useStore();

  const activeMembers = members.filter((m) => m.active);
  const membersWithUpdates = standups.filter((s) =>
    [...s.yesterday, ...s.today, ...s.blockers, ...s.notes].some((b) => b.text.trim())
  ).length;

  const completionRate = activeMembers.length > 0
    ? Math.round((membersWithUpdates / activeMembers.length) * 100)
    : 0;

  const totalBlockers = standups.reduce(
    (acc, s) => acc + s.blockers.filter((b) => b.text.trim()).length,
    0
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        icon={<Users className="w-4 h-4" />}
        label="Team Size"
        value={activeMembers.length}
        color="indigo"
      />
      <StatCard
        icon={<CheckCircle2 className="w-4 h-4" />}
        label="Completed"
        value={`${membersWithUpdates}/${activeMembers.length}`}
        color="emerald"
      />
      <StatCard
        icon={<BarChart3 className="w-4 h-4" />}
        label="Progress"
        value={`${completionRate}%`}
        color="violet"
        progress={completionRate}
      />
      <StatCard
        icon={<AlertTriangle className="w-4 h-4" />}
        label="Blockers"
        value={totalBlockers}
        color="amber"
      />
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  progress?: number;
}

function StatCard({ icon, label, value, color, progress }: StatCardProps) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  const progressColor: Record<string, string> = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    violet: 'bg-violet-500',
    amber: 'bg-amber-500',
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-xl border border-slate-100 p-4 card-shadow"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${colorMap[color]}`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-slate-400">{label}</span>
      </div>
      <div className="text-xl font-bold text-slate-900">{value}</div>
      {progress !== undefined && (
        <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${progressColor[color]}`}
          />
        </div>
      )}
    </motion.div>
  );
}
