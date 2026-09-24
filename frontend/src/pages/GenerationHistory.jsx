import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { historyService } from '../services/dataService.js';
import { History, CheckCircle2, XCircle, Clock, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const GenerationHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await historyService.getLogs();
      setLogs(data || []);
    } catch (err) {
      toast.error('Failed to load generation audit history.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Navbar
        title="Generation History & Audit Logs"
        subtitle="Historical audit trail of all backtracking solver runs, execution durations, and failure diagnoses"
      />

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4">Initiated By</th>
              <th className="py-3 px-4">Division</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Duration</th>
              <th className="py-3 px-4">Soft Score</th>
              <th className="py-3 px-4">Details & Diagnostics</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-400">Loading audit logs...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-400">
                  <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">No generation attempts recorded yet.</p>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {new Date(log.requestedAt).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">
                    {log.requestedBy?.name || 'Admin'}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {log.division?.name || 'Division'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                      log.success
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {log.success ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Success
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-rose-600" /> Unsatisfiable
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                    {log.generationTime} ms
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {log.success ? log.softConstraintScore : '—'}
                  </td>
                  <td className="py-3.5 px-4 max-w-sm">
                    {log.success ? (
                      <span className="text-emerald-700 font-medium">{log.explanation}</span>
                    ) : (
                      <div className="space-y-0.5">
                        <p className="font-bold text-rose-700">{log.failedReason}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{log.explanation}</p>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
