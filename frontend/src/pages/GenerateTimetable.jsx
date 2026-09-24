import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { divisionService, departmentService, timetableService } from '../services/dataService.js';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  Sliders,
  Calendar,
  Layers,
  Building,
  Users2,
  AlertOctagon,
  HelpCircle,
} from 'lucide-react';

export const GenerateTimetable = () => {
  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [semester, setSemester] = useState(5);

  // Soft constraint preference toggles
  const [preferences, setPreferences] = useState({
    minimizeFacultyGaps: true,
    minimizeStudentGaps: true,
    spreadSubjectsAcrossDays: true,
    preferMorningLabs: true,
    avoidExcessiveConsecutive: true,
  });

  const [loading, setLoading] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [failureDiagnosis, setFailureDiagnosis] = useState(null);

  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [depts, divs] = await Promise.all([
        departmentService.getAll(),
        divisionService.getAll(),
      ]);
      setDepartments(depts || []);
      setDivisions(divs || []);

      if (depts && depts.length > 0) {
        setSelectedDept(depts[0]._id);
      }
      if (divs && divs.length > 0) {
        setSelectedDivision(divs[0]._id);
        if (divs[0].semester) setSemester(divs[0].semester);
        if (divs[0].academicYear) setAcademicYear(divs[0].academicYear);
      }
    } catch (err) {
      toast.error('Failed to load departments and divisions.');
    }
  };

  const handleDeptChange = (deptId) => {
    setSelectedDept(deptId);
    const filteredDivs = divisions.filter((d) => (d.department?._id || d.department) === deptId);
    if (filteredDivs.length > 0) {
      setSelectedDivision(filteredDivs[0]._id);
      setSemester(filteredDivs[0].semester);
    } else {
      setSelectedDivision('');
    }
  };

  const handleDivisionChange = (divId) => {
    setSelectedDivision(divId);
    const divObj = divisions.find((d) => d._id === divId);
    if (divObj) {
      if (divObj.semester) setSemester(divObj.semester);
      if (divObj.academicYear) setAcademicYear(divObj.academicYear);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedDivision) {
      toast.warning('Please select a student division.');
      return;
    }

    try {
      setLoading(true);
      setGenerationResult(null);
      setFailureDiagnosis(null);

      const response = await timetableService.generate({
        divisionId: selectedDivision,
        academicYear,
        semester: Number(semester),
        preferences,
      });

      if (response.success) {
        setGenerationResult(response.data);
        toast.success('Timetable generated successfully with 0 hard constraint violations!');
      }
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData && errorData.problem) {
        setFailureDiagnosis(errorData);
        toast.error('Timetable could not be generated due to conflicting constraints.');
      } else {
        toast.error(errorData?.message || 'Server error while generating timetable.');
      }
    } finally {
      setLoading(false);
    }
  };

  const currentDivObj = divisions.find((d) => d._id === selectedDivision);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Navbar
        title="Generate Timetable"
        subtitle="Intelligent Constraint-Based Timetable Generator Engine (CSP with Backtracking)"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration & Preferences Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brand-600" />
              Generation Parameters
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select academic division target and configure soft optimization preferences.
            </p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Department
              </label>
              <select
                value={selectedDept}
                onChange={(e) => handleDeptChange(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              >
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Target Division *
              </label>
              <select
                required
                value={selectedDivision}
                onChange={(e) => handleDivisionChange(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold text-brand-900"
              >
                {divisions.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} (Sem {d.semester} • {d.studentCount} Students)
                  </option>
                ))}
              </select>
              {currentDivObj && (
                <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                  <Users2 className="w-3 h-3 text-slate-400" />
                  Cohort Strength: <span className="font-bold text-slate-700">{currentDivObj.studentCount} students</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Semester
                </label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>
            </div>

            {/* Soft Constraints Preferences Checkboxes */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                Soft Constraint Heuristics
              </label>
              <div className="space-y-2">
                {[
                  { key: 'minimizeFacultyGaps', label: 'Minimize faculty idle gaps' },
                  { key: 'minimizeStudentGaps', label: 'Minimize student idle periods' },
                  { key: 'spreadSubjectsAcrossDays', label: 'Spread subjects across days' },
                  { key: 'preferMorningLabs', label: 'Prefer morning practical labs' },
                  { key: 'avoidExcessiveConsecutive', label: 'Avoid excessive consecutive periods' },
                ].map((pref) => (
                  <label key={pref.key} className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={preferences[pref.key]}
                      onChange={(e) =>
                        setPreferences({ ...preferences, [pref.key]: e.target.checked })
                      }
                      className="w-4 h-4 text-brand-600 rounded border-slate-300 mt-0.5"
                    />
                    <span className="text-xs text-slate-600 font-medium leading-snug">{pref.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedDivision}
              className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing Timetable...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Timetable</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results / Live Feedback Canvas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Generation Loading Screen */}
          {loading && (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm animate-pulse">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Constraint Satisfaction Engine Running</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Applying Minimum Remaining Values (MRV) heuristic, pruning conflicting slots, and backtracking through candidate search space...
                </p>
              </div>
              <div className="flex justify-center gap-2 text-xs font-semibold text-slate-400">
                <span>Checking Room Capacity</span> • <span>Checking Lab Requirements</span> • <span>Verifying Faculty Availability</span>
              </div>
            </div>
          )}

          {/* Success Panel */}
          {generationResult && !loading && (
            <div className="bg-white rounded-3xl border border-emerald-200 p-6 shadow-sm space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Timetable Generated Successfully!
                    </h3>
                    <p className="text-xs text-emerald-700 font-medium mt-0.5">
                      100% hard constraints satisfied with 0 violations.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/timetables`)}
                  className="flex items-center gap-1 text-xs font-bold text-white bg-slate-900 px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
                >
                  View Timetable Grid <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Generation Duration</span>
                  <p className="font-extrabold text-slate-900 text-sm">{generationResult.stats?.generationTime || 0} ms</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Sessions Scheduled</span>
                  <p className="font-extrabold text-slate-900 text-sm">{generationResult.stats?.sessionsScheduled || 0} Periods</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Soft Penalty Score</span>
                  <p className="font-extrabold text-emerald-600 text-sm">{generationResult.stats?.softConstraintScore ?? 0}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Resources Utilized</span>
                  <p className="font-extrabold text-slate-900 text-sm">
                    {generationResult.stats?.roomsUsed?.length || 0} Rooms • {generationResult.stats?.facultyUsed?.length || 0} Faculty
                  </p>
                </div>
              </div>

              {/* Grounded Explanations */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Algorithmic Verification Proofs:
                </h4>
                <div className="space-y-1.5">
                  {(generationResult.whyExplanations || []).map((exp, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-[10px] flex-shrink-0">
                        ✓
                      </span>
                      <span>{exp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* IMPOSSIBLE TIMETABLE DIAGNOSIS PANEL (Requirement 13) */}
          {failureDiagnosis && !loading && (
            <div className="bg-white rounded-3xl border border-rose-300 p-6 shadow-md space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase tracking-wider">
                    Unsatisfiable Constraint Detected
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-base mt-1">
                    Timetable Could Not Be Generated
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    The solver encountered mathematical contention where no valid permutation satisfies all hard constraints simultaneously.
                  </p>
                </div>
              </div>

              {/* Structured Diagnostic Cards */}
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 text-xs space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Identified Problem</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{failureDiagnosis.problem}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-rose-200/60">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Affected Division</span>
                    <p className="font-bold text-slate-800">{failureDiagnosis.affectedDivision || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Subject</span>
                    <p className="font-bold text-slate-800">{failureDiagnosis.diagnostics?.subject || 'All Subjects'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Required Facility</span>
                    <p className="font-bold text-slate-800">{failureDiagnosis.diagnostics?.requiredRoom || 'Classroom/Lab'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Solver Duration</span>
                    <p className="font-bold text-slate-800">{failureDiagnosis.generationTimeMs} ms</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-rose-200/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Underlying Reason</span>
                  <p className="text-slate-700 mt-0.5 leading-relaxed">{failureDiagnosis.reason}</p>
                </div>
              </div>

              {/* Actionable Suggested Resolutions */}
              {failureDiagnosis.suggestedActions && failureDiagnosis.suggestedActions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-brand-600" />
                    Recommended Actions to Resolve Conflict:
                  </h4>
                  <ul className="space-y-1.5">
                    {failureDiagnosis.suggestedActions.map((action, i) => (
                      <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                        <span className="w-5 h-5 rounded-md bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-snug">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Idle Placeholder */}
          {!loading && !generationResult && !failureDiagnosis && (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Ready for Timetable Synthesis</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select your student division and click "Generate Timetable" to initiate the backtracking constraint solver.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
