import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { reportService } from '../services/dataService.js';
import { BarChart3, GraduationCap, DoorOpen, Users2, ShieldCheck, CheckCircle } from 'lucide-react';

export const Reports = () => {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('FACULTY'); // 'FACULTY', 'ROOMS', 'DIVISIONS', 'CONSTRAINTS'
  const toast = useToast();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await reportService.getReports();
      setReports(data || null);
    } catch (err) {
      toast.error('Failed to load analytical reports.');
    } finally {
      setLoading(false);
    }
  };

  const facultyWorkload = reports?.facultyWorkload || [];
  const classroomUtil = reports?.classroomUtilization || [];
  const divisionSchedules = reports?.divisionSchedules || [];
  const constraintSummary = reports?.constraintSummary || null;

  return (
    <div className="space-y-6">
      <Navbar
        title="College Scheduling Reports"
        subtitle="Analytical insights into teaching workload, facility utilization rates, and constraint compliance"
      />

      {/* Report Navigation Tabs */}
      <div className="flex rounded-2xl bg-white p-1.5 border border-slate-200 text-xs font-bold shadow-xs">
        <button
          onClick={() => setActiveTab('FACULTY')}
          className={`flex-1 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'FACULTY' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Faculty Teaching Workload
        </button>
        <button
          onClick={() => setActiveTab('ROOMS')}
          className={`flex-1 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'ROOMS' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <DoorOpen className="w-4 h-4" />
          Classroom Utilization %
        </button>
        <button
          onClick={() => setActiveTab('DIVISIONS')}
          className={`flex-1 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'DIVISIONS' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users2 className="w-4 h-4" />
          Division Schedules Summary
        </button>
        <button
          onClick={() => setActiveTab('CONSTRAINTS')}
          className={`flex-1 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'CONSTRAINTS' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Constraint Compliance Summary
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading reports...</div>
      ) : (
        <>
          {/* TAB 1: FACULTY WORKLOAD */}
          {activeTab === 'FACULTY' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-900 text-sm">Faculty Workload & Period Distribution</h3>
                <p className="text-xs text-slate-500">Track assigned teaching hours vs available free periods across all active timetables.</p>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Faculty Member</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Distinct Classes</th>
                    <th className="py-3 px-4">Total Assigned Periods</th>
                    <th className="py-3 px-4">Free Periods</th>
                    <th className="py-3 px-4">Workload %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {facultyWorkload.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {f.name}
                        <span className="ml-2 font-mono text-[10px] text-slate-400">({f.employeeId})</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{f.department}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{f.totalClasses} courses</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{f.totalPeriods} periods / week</td>
                      <td className="py-3.5 px-4 text-slate-500 font-semibold">{f.freePeriods} periods</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden max-w-[100px]">
                            <div
                              className="bg-brand-600 h-full rounded-full"
                              style={{ width: `${Math.min(100, f.workloadPercentage)}%` }}
                            />
                          </div>
                          <span className="font-bold text-[11px] text-slate-800">{f.workloadPercentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: CLASSROOM UTILIZATION */}
          {activeTab === 'ROOMS' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-900 text-sm">Classroom & Laboratory Utilization</h3>
                <p className="text-xs text-slate-500">Utilization percentages computed against total active weekly time slots.</p>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Room Number / Name</th>
                    <th className="py-3 px-4">Facility Type</th>
                    <th className="py-3 px-4">Seating Capacity</th>
                    <th className="py-3 px-4">Building</th>
                    <th className="py-3 px-4">Assigned Periods</th>
                    <th className="py-3 px-4">Utilization %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classroomUtil.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {r.roomNumber} — <span className="font-normal text-slate-600">{r.name}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          r.type === 'LAB'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {r.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{r.capacity} seats</td>
                      <td className="py-3.5 px-4 text-slate-500">{r.building}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{r.assignedPeriods} periods / week</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden max-w-[120px]">
                            <div
                              className={`h-full rounded-full ${
                                r.utilizationPercentage > 75
                                  ? 'bg-amber-500'
                                  : r.utilizationPercentage > 40
                                  ? 'bg-emerald-500'
                                  : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(100, r.utilizationPercentage)}%` }}
                            />
                          </div>
                          <span className="font-bold text-[11px] text-slate-800">{r.utilizationPercentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: DIVISION SCHEDULES */}
          {activeTab === 'DIVISIONS' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-900 text-sm">Division Schedule Compliance</h3>
                <p className="text-xs text-slate-500">Summary of all active cohort timetables, total periods, and soft score.</p>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Division</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Semester</th>
                    <th className="py-3 px-4">Academic Year</th>
                    <th className="py-3 px-4">Weekly Sessions</th>
                    <th className="py-3 px-4">Hard Violations</th>
                    <th className="py-3 px-4">Soft Penalty Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {divisionSchedules.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">No active division timetables.</td>
                    </tr>
                  ) : (
                    divisionSchedules.map((div) => (
                      <tr key={div.timetableId} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-bold text-brand-700">{div.division}</td>
                        <td className="py-3.5 px-4 text-slate-700">{div.department}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">Sem {div.semester}</td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">{div.academicYear}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{div.totalSessions} periods</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600">{div.hardViolationsCount} violations</td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{div.softConstraintScore}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: CONSTRAINT SUMMARY */}
          {activeTab === 'CONSTRAINTS' && constraintSummary && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Constraint System Compliance Summary</h3>
                  <p className="text-xs text-slate-500">Summary of all validated hard rules and soft-preference penalty scores.</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                  constraintSummary.totalHardViolations === 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {constraintSummary.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> Hard Constraints (Strict 0 Violations)
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {constraintSummary.hardConstraintsChecked.map((hc, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-[10px]">✓</span>
                        <span>{hc}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2 border-t border-emerald-200 text-xs font-bold text-emerald-900">
                    Total Hard Constraint Violations across all active timetables: {constraintSummary.totalHardViolations}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-brand-600" /> Soft Optimization Metrics
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-500">Total System Soft Penalty Score:</span>
                      <p className="text-xl font-extrabold text-slate-900">{constraintSummary.totalSoftPenalty}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Average Penalty per Timetable:</span>
                      <p className="text-base font-bold text-slate-800">{constraintSummary.averagePenaltyPerTimetable}</p>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Lower penalty score represents tighter cohesion with fewer teacher gaps, fewer student idle hours, and even weekday subject distributions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
