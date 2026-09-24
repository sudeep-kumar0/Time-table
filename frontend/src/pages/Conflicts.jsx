import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { conflictService } from '../services/dataService.js';
import { AlertOctagon, CheckCircle2, Filter, RefreshCw, ShieldAlert, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Conflicts = () => {
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const toast = useToast();

  useEffect(() => {
    loadConflicts();
  }, []);

  const loadConflicts = async () => {
    try {
      setLoading(true);
      const data = await conflictService.getConflicts();
      setConflicts(data?.conflicts || []);
    } catch (err) {
      toast.error('Failed to load system conflicts.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = conflicts.filter((c) => {
    if (severityFilter && c.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <Navbar
        title="Conflict Center"
        subtitle="Real-time detection of cross-division faculty double-booking, room collisions, and capacity violations"
        actions={
          <button
            onClick={loadConflicts}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Refresh Conflicts
          </button>
        }
      />

      {/* Overview Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Active Conflicts</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{conflicts.length}</p>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
            conflicts.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
          }`}>
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Critical Clashes</span>
            <p className="text-2xl font-extrabold text-rose-600 mt-1">
              {conflicts.filter((c) => c.severity === 'CRITICAL').length}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Capacity & Room Warnings</span>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">
              {conflicts.filter((c) => c.severity === 'HIGH' || c.severity === 'MEDIUM').length}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Filter className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filter by Severity:</span>
          <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setSeverityFilter('')}
              className={`px-3 py-1 rounded-md transition-colors ${
                severityFilter === '' ? 'bg-white text-brand-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Severities
            </button>
            <button
              onClick={() => setSeverityFilter('CRITICAL')}
              className={`px-3 py-1 rounded-md transition-colors ${
                severityFilter === 'CRITICAL' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setSeverityFilter('HIGH')}
              className={`px-3 py-1 rounded-md transition-colors ${
                severityFilter === 'HIGH' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              High
            </button>
            <button
              onClick={() => setSeverityFilter('MEDIUM')}
              className={`px-3 py-1 rounded-md transition-colors ${
                severityFilter === 'MEDIUM' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Medium
            </button>
          </div>
        </div>

        <span className="text-xs text-slate-500 font-semibold">{filtered.length} Conflict Record(s)</span>
      </div>

      {/* Conflicts Detailed Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Conflict Type</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Subject(s)</th>
              <th className="py-3 px-4">Division(s)</th>
              <th className="py-3 px-4">Faculty</th>
              <th className="py-3 px-4">Room</th>
              <th className="py-3 px-4">Day & Period</th>
              <th className="py-3 px-4">Explanation & Suggested Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="8" className="py-8 text-center text-slate-400">Inspecting timetables for conflicts...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    <p className="font-bold text-slate-700 text-sm">No Active Resource Conflicts Detected!</p>
                    <p className="text-xs text-slate-400 max-w-sm">
                      All published timetables satisfy mutual exclusivity across teachers, classrooms, and divisions.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const isCrit = c.severity === 'CRITICAL';
                const isHigh = c.severity === 'HIGH';

                return (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {c.type}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] uppercase tracking-wider border ${
                        isCrit
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : isHigh
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {c.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {c.subject}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-brand-700">
                      {c.division}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {c.faculty || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      {c.room || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                      <div className="font-bold">{c.day} P{c.period}</div>
                      <div className="text-[10px] text-slate-400">{c.time}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="space-y-1">
                        <p className="text-slate-700 leading-tight">{c.explanation}</p>
                        {c.suggestedAction && (
                          <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50/80 p-1.5 rounded-lg border border-emerald-100">
                            💡 <span className="font-bold">Suggested Action:</span> {c.suggestedAction}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
