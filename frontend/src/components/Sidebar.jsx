import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users2,
  GraduationCap,
  BookOpen,
  DoorOpen,
  Clock,
  Sparkles,
  CalendarDays,
  AlertOctagon,
  BarChart3,
  History,
  Settings,
  LogOut,
  CalendarCheck2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const Sidebar = () => {
  const { user, isAdmin, isFaculty, logout } = useAuth();

  const adminNav = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Departments', path: '/departments', icon: Building2 },
    { label: 'Divisions', path: '/divisions', icon: Users2 },
    { label: 'Faculty', path: '/faculty', icon: GraduationCap },
    { label: 'Subjects', path: '/subjects', icon: BookOpen },
    { label: 'Classrooms', path: '/classrooms', icon: DoorOpen },
    { label: 'Time Slots', path: '/timeslots', icon: Clock },
    { label: 'Generate Timetable', path: '/generate', icon: Sparkles, highlight: true },
    { label: 'Timetables', path: '/timetables', icon: CalendarDays },
    { label: 'Conflict Center', path: '/conflicts', icon: AlertOctagon },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Generation History', path: '/history', icon: History },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const facultyNav = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Timetable', path: '/timetables', icon: CalendarDays },
    { label: 'My Availability', path: '/faculty-availability', icon: CalendarCheck2 },
    { label: 'College Reports', path: '/reports', icon: BarChart3 },
  ];

  const navItems = isAdmin ? adminNav : facultyNav;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 min-h-screen border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-sky-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
          <CalendarCheck2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base tracking-tight leading-tight">SmartSchedule</h1>
          <p className="text-xs text-brand-400 font-medium tracking-wide">Intelligent CSP Engine</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {isAdmin ? 'Administration & Engine' : 'Faculty Portal'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? item.highlight
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                      : 'bg-slate-800 text-white font-semibold'
                    : item.highlight
                    ? 'text-brand-300 hover:bg-slate-800/80 hover:text-white'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
              {item.highlight && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 uppercase font-bold tracking-wider">
                  AI
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 text-xs flex-shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
              <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mt-0.5 ${
                isAdmin ? 'bg-amber-500/20 text-amber-300' : 'bg-sky-500/20 text-sky-300'
              }`}>
                {user?.role || 'Guest'}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
