import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar.jsx';
import { TimetableGrid } from '../components/TimetableGrid.jsx';
import { WhyThisTimetableModal } from '../components/WhyThisTimetableModal.jsx';
import { Modal } from '../components/Modal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  timetableService,
  divisionService,
  facultyService,
  classroomService,
} from '../services/dataService.js';
import {
  Sparkles,
  ShieldCheck,
  TrendingDown,
  RefreshCw,
  HelpCircle,
  Calendar,
  Layers,
  Trash2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export const Timetables = () => {
  const { isAdmin, isFaculty, user } = useAuth();
  const [timetables, setTimetables] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState('');
  const [activeTimetable, setActiveTimetable] = useState(null);
  const [loading, setLoading] = useState(true);

  // Optimization Modal & State
  const [isOptimizeLoading, setIsOptimizeLoading] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);

  // Validation Modal & State
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);

  // Why this timetable modal
  const [isWhyModalOpen, setIsWhyModalOpen] = useState(false);

  const toast = useToast();

  useEffect(() => {
    loadAuxData();
  }, []);

  useEffect(() => {
    if (selectedTimetableId) {
      loadTimetableDetails(selectedTimetableId);
    }
  }, [selectedTimetableId]);

  const loadAuxData = async () => {
    try {
      setLoading(true);
      const [tts, divs, facs, rms] = await Promise.all([
        timetableService.getAll({ status: 'ACTIVE' }),
        divisionService.getAll(),
        facultyService.getAll(),
        classroomService.getAll(),
      ]);

      setTimetables(tts || []);
      setDivisions(divs || []);
      setFacultyList(facs || []);
      setClassrooms(rms || []);

      if (tts && tts.length > 0) {
        setSelectedTimetableId(tts[0]._id);
      }
    } catch (err) {
      toast.error('Failed to load timetables.');
    } finally {
      setLoading(false);
    }
  };

  const loadTimetableDetails = async (id) => {
    try {
      const data = await timetableService.getById(id);
      setActiveTimetable(data);
    } catch (err) {
      toast.error('Failed to fetch timetable details.');
    }
  };

  // 16. VALIDATE TIMETABLE
  const handleValidate = async () => {
    if (!activeTimetable) return;
    try {
      setIsValidating(true);
      const res = await timetableService.validate({
        timetableId: activeTimetable._id,
      });
      setValidationResult(res);
      setIsValidationModalOpen(true);
      if (res.isValid) {
        toast.success('Validation Passed: All hard constraints satisfied!');
      } else {
        toast.warning(`Validation detected ${res.hardViolationsCount} hard violation(s).`);
      }
    } catch (err) {
      toast.error('Error validating timetable.');
    } finally {
      setIsValidating(false);
    }
  };

  // 18. OPTIMIZE TIMETABLE
  const handleOptimize = async () => {
    if (!activeTimetable) return;
    try {
      setIsOptimizeLoading(true);
      const res = await timetableService.optimize(activeTimetable._id);
      setOptimizationResult(res);
      setActiveTimetable(res.timetable);
      toast.success(
        `Optimized! Soft penalty score reduced from ${res.before.softScore} to ${res.after.softScore}.`
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error running optimization search.');
    } finally {
      setIsOptimizeLoading(false);
    }
  };

  // 17. REGENERATE TIMETABLE
  const handleRegenerate = async () => {
    if (!activeTimetable) return;
    if (!window.confirm('Regenerate this timetable? The engine will find an alternative conflict-free solution.')) return;
    try {
      setLoading(true);
      const res = await timetableService.generate({
        divisionId: activeTimetable.division._id,
        academicYear: activeTimetable.academicYear,
        semester: activeTimetable.semester,
      });
      if (res.success) {
        toast.success('Timetable regenerated successfully.');
        loadAuxData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error regenerating timetable.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!activeTimetable) return;
    if (!window.confirm('Are you sure you want to delete this timetable?')) return;
    try {
      await timetableService.delete(activeTimetable._id);
      toast.success('Timetable deleted.');
      setActiveTimetable(null);
      loadAuxData();
    } catch (err) {
      toast.error('Failed to delete timetable.');
    }
  };

  return (
    <div className="space-y-6">
      <Navbar
        title="College Timetables"
        subtitle="View, validate, optimize, and audit division schedules across faculties and classrooms"
        actions={
          activeTimetable && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsWhyModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5 text-brand-600" />
                Why This Timetable?
              </button>

              {isAdmin && (
                <>
                  <button
                    onClick={handleValidate}
                    disabled={isValidating}
                    className="flex items-center gap-1.5 px-3 py-2 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {isValidating ? 'Validating...' : 'Validate Constraints'}
                  </button>

                  <button
                    onClick={handleOptimize}
                    disabled={isOptimizeLoading}
                    className="flex items-center gap-1.5 px-3 py-2 border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
                  >
                    <TrendingDown className="w-3.5 h-3.5 text-purple-600" />
                    {isOptimizeLoading ? 'Optimizing...' : 'Optimize Soft Score'}
                  </button>

                  <button
                    onClick={handleRegenerate}
                    className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    Regenerate
                  </button>

                  <button
                    onClick={handleDelete}
                    className="p-2 border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-xl transition-colors"
                    title="Delete Timetable"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )
        }
      />

      {/* Timetable Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-brand-600" /> Select Timetable:
          </label>
          <select
            value={selectedTimetableId}
            onChange={(e) => setSelectedTimetableId(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 text-slate-800 font-bold focus:outline-brand-500 min-w-[240px]"
          >
            {timetables.length === 0 ? (
              <option value="">No Active Timetables</option>
            ) : (
              timetables.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.division?.name || 'Division'} — Sem {t.semester} ({t.academicYear})
                </option>
              ))
            )}
          </select>
        </div>

        {activeTimetable && (
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Soft Score:</span>{' '}
              <span className="font-extrabold text-slate-800">
                {activeTimetable.generationStats?.softConstraintScore ?? 0}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Hard Violations:</span>{' '}
              <span className="font-extrabold text-emerald-600">
                {activeTimetable.generationStats?.hardConstraintViolations ?? 0}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Generated:</span>{' '}
              <span className="font-medium text-slate-600">
                {new Date(activeTimetable.generatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Optimization Before/After Display if freshly run */}
      {optimizationResult && (
        <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-between text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              ⚡
            </div>
            <div>
              <h4 className="font-bold text-purple-950">Neighborhood Local Search Optimization Complete</h4>
              <p className="text-purple-800">
                Performed {optimizationResult.improvementsMade} improvements in {optimizationResult.optimizationDurationMs}ms.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 font-mono font-bold">
            <div>
              <span className="text-purple-600 font-normal">Before Score: </span>
              <span className="line-through text-slate-500">{optimizationResult.before.softScore}</span>
            </div>
            <div className="text-sm">
              <span className="text-purple-600 font-normal">After Score: </span>
              <span className="text-emerald-700 font-extrabold text-base">{optimizationResult.after.softScore}</span>
            </div>
            <div>
              <span className="text-purple-600 font-normal">Hard Violations: </span>
              <span className="text-emerald-700">0 → 0</span>
            </div>
          </div>
        </div>
      )}

      {/* Timetable Display Grid */}
      {activeTimetable ? (
        <TimetableGrid
          timetable={activeTimetable}
          divisionName={activeTimetable.division?.name}
          facultyList={facultyList}
          classrooms={classrooms}
        />
      ) : (
        <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No Timetable Selected</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Choose an existing timetable from the dropdown above, or generate a new timetable from the generator page.
          </p>
        </div>
      )}

      {/* Validation Result Modal (Requirement 16) */}
      <Modal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        title="Timetable Hard Constraint Validation"
        subtitle={`Validation results for ${activeTimetable?.division?.name || 'Class Schedule'}`}
        maxWidth="max-w-xl"
      >
        {validationResult && (
          <div className="space-y-4 text-xs">
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                validationResult.isValid
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {validationResult.isValid ? (
                <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-bold text-sm">
                  {validationResult.isValid
                    ? 'All Hard Constraints Satisfied!'
                    : `Validation Failed (${validationResult.hardViolationsCount} Violations)`}
                </h4>
                <p className="mt-0.5 leading-relaxed">{validationResult.message}</p>
              </div>
            </div>

            {validationResult.violations && validationResult.violations.length > 0 && (
              <div className="space-y-2 mt-4">
                <h5 className="font-bold uppercase tracking-wider text-slate-700">Detailed Violations:</h5>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {validationResult.violations.map((v, i) => (
                    <div key={i} className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{v.type}</span>
                        {v.day && v.period && <span>{v.day} Period {v.period}</span>}
                      </div>
                      <p className="text-slate-600">{v.explanation}</p>
                      {v.suggestedAction && (
                        <p className="text-brand-700 font-semibold text-[11px]">Action: {v.suggestedAction}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 flex justify-end">
              <button
                onClick={() => setIsValidationModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Why This Timetable Modal (Requirement 20) */}
      <WhyThisTimetableModal
        isOpen={isWhyModalOpen}
        onClose={() => setIsWhyModalOpen(false)}
        timetable={activeTimetable}
      />
    </div>
  );
};
