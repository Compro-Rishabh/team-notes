import { useStore } from '@/store';
import { formatDate, shiftBusinessDays, toBusinessDate } from '@/utils';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export function DatePicker() {
  const { selectedDate, setSelectedDate } = useStore();

  const todayBusiness = toBusinessDate(formatDate(new Date()));
  const isToday = selectedDate === todayBusiness;

  const navigateDate = (direction: -1 | 1) => {
    const next = shiftBusinessDays(selectedDate, direction);
    if (next > todayBusiness) return;
    setSelectedDate(next);
  };

  const handleDateChange = (value: string) => {
    const business = toBusinessDate(value);
    if (business > todayBusiness) return;
    setSelectedDate(business);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigateDate(-1)}
        className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <ChevronLeft className="w-4 h-4 text-slate-600" />
      </button>

      <div className="relative">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 shadow-sm">
          <Calendar className="w-4 h-4 text-indigo-500" />
          <input
            type="date"
            value={selectedDate}
            max={todayBusiness}
            onChange={(e) => handleDateChange(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 cursor-pointer"
          />
        </div>
      </div>

      <button
        onClick={() => navigateDate(1)}
        disabled={isToday}
        className="p-2 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-4 h-4 text-slate-600" />
      </button>

      {!isToday && (
        <button
          onClick={() => setSelectedDate(todayBusiness)}
          className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          Today
        </button>
      )}
    </div>
  );
}
