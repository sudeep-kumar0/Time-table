import React from 'react';
import { Check, X, Sparkles } from 'lucide-react';

export const AvailabilityMatrix = ({
  availability = [],
  onChange,
  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  periods = [1, 2, 3, 4, 5, 6],
}) => {
  // Check if a slot is available
  const isSlotAvailable = (day, periodNumber) => {
    const found = availability.find(
      (a) => a.day === day && Number(a.periodNumber) === Number(periodNumber)
    );
    return found !== undefined ? Boolean(found.isAvailable) : true;
  };

  const toggleSlot = (day, periodNumber) => {
    const current = isSlotAvailable(day, periodNumber);
    const updated = availability.filter(
      (a) => !(a.day === day && Number(a.periodNumber) === Number(periodNumber))
    );
    // If it was available, we now mark it explicitly false
    // If it was false, we mark it true (or remove it to default true)
    if (current) {
      updated.push({ day, periodNumber: Number(periodNumber), isAvailable: false });
    } else {
      updated.push({ day, periodNumber: Number(periodNumber), isAvailable: true });
    }
    onChange(updated);
  };

  const setAllAvailability = (status) => {
    const newAvail = [];
    if (!status) {
      // mark all unavailable
      for (const day of days) {
        for (const p of periods) {
          newAvail.push({ day, periodNumber: p, isAvailable: false });
        }
      }
    }
    onChange(newAvail);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Click any cell to toggle availability for that period.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAllAvailability(true)}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200"
          >
            Mark All Available
          </button>
          <button
            type="button"
            onClick={() => setAllAvailability(false)}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border border-rose-200"
          >
            Mark All Unavailable
          </button>
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <th className="py-2.5 px-3 text-left w-28 border-r border-slate-200">Day</th>
              {periods.map((p) => (
                <th key={p} className="py-2.5 px-2 border-r border-slate-200 last:border-r-0">
                  P{p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {days.map((day) => (
              <tr key={day} className="hover:bg-slate-50/50">
                <td className="py-2.5 px-3 text-left font-semibold text-slate-800 border-r border-slate-200 bg-slate-50/70">
                  {day}
                </td>
                {periods.map((p) => {
                  const available = isSlotAvailable(day, p);
                  return (
                    <td
                      key={p}
                      onClick={() => toggleSlot(day, p)}
                      className={`py-2 px-2 border-r border-slate-200 last:border-r-0 cursor-pointer select-none transition-all duration-150 ${
                        available
                          ? 'bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-700 font-medium'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {available ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-[11px]">Free</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3.5 h-3.5 text-rose-500" />
                            <span className="text-[11px] font-semibold">Busy</span>
                          </>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
