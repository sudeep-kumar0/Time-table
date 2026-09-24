import React from 'react';

export const StatsCard = ({ title, value, icon: Icon, color = 'blue', subtext, onClick }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  };

  const activeColor = colorMap[color] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-brand-300' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${activeColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</span>
        {subtext && <span className="text-xs text-slate-500 font-medium">{subtext}</span>}
      </div>
    </div>
  );
};
