import React from 'react';
import { Outlet } from 'react-router-dom';
import { CalendarCheck2 } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex flex-col justify-center items-center p-4">
      {/* Brand logo */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/25">
          <CalendarCheck2 className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">SmartSchedule</h1>
          <p className="text-xs text-brand-400 font-medium tracking-wide">Intelligent Timetable Generator</p>
        </div>
      </div>

      <div className="w-full max-w-md">
        <Outlet />
      </div>

      <p className="text-xs text-slate-500 mt-8 text-center">
        Powered by Backtracking Constraint Satisfaction & Optimization
      </p>
    </div>
  );
};
