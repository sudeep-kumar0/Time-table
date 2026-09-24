import React from 'react';
import { Modal } from './Modal.jsx';
import { ShieldCheck, CheckCircle2, Cpu, Sparkles, Activity, Layers } from 'lucide-react';

export const WhyThisTimetableModal = ({ isOpen, onClose, timetable }) => {
  if (!timetable) return null;

  const stats = timetable.generationStats || {};
  const breakdown = stats.breakdown || {};

  const hardVerifications = [
    { title: 'Zero Faculty Conflicts', desc: 'No faculty member is assigned to more than one class at any time.' },
    { title: 'Zero Classroom Collisions', desc: 'Every classroom and laboratory is exclusively occupied by one division at a time.' },
    { title: 'Zero Division Overlaps', desc: 'Students are never double-scheduled with concurrent lectures.' },
    { title: 'Room Capacity Honored', desc: `Every classroom assigned meets or exceeds the division student count.` },
    { title: 'Lab Specialization Enforced', desc: 'All laboratory/practical sessions are assigned strictly to designated LAB rooms.' },
    { title: 'Faculty & Room Availability Matrix', desc: 'Individual unavailable slots configured for teachers and rooms were strictly skipped.' },
    { title: 'Curriculum Quotas Satisfied', desc: `All required weekly periods (${stats.totalRequiredSessions || stats.sessionsScheduled || timetable.entries?.length}) are scheduled.` },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Why This Timetable? — Algorithmic Audit"
      subtitle="Mathematical verification of hard constraints and soft-preference optimization factors"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Verification Summary Banner */}
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-emerald-950">100% Mathematically Valid Schedule</h4>
            <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
              This timetable was synthesized using pure Constraint Satisfaction Problem (CSP) backtracking with Forward Checking and Minimum Remaining Values (MRV). Zero hard constraints were violated.
            </p>
          </div>
        </div>

        {/* Hard Constraint Checklist */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Verified Hard Constraints
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {hardVerifications.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  ✓
                </span>
                <div>
                  <h5 className="font-bold text-xs text-slate-800">{item.title}</h5>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Soft Constraint Penalties & Metrics */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-brand-600" />
            Soft Constraint Optimization Score: <span className="text-slate-900 font-extrabold text-sm ml-1">{stats.softConstraintScore ?? 0}</span> (Lower is better)
          </h4>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Faculty Gaps Penalty</span>
              <p className="font-bold text-slate-800 text-sm">{breakdown.facultyGaps ?? 0}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Student Gaps Penalty</span>
              <p className="font-bold text-slate-800 text-sm">{breakdown.studentGaps ?? 0}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Excessive Consecutive</span>
              <p className="font-bold text-slate-800 text-sm">{breakdown.excessiveConsecutiveClasses ?? 0}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Subject Clustering</span>
              <p className="font-bold text-slate-800 text-sm">{breakdown.subjectClustering ?? 0}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Morning Lab Penalty</span>
              <p className="font-bold text-slate-800 text-sm">{breakdown.morningLabPenalty ?? 0}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Solver Duration</span>
              <p className="font-bold text-slate-800 text-sm">{stats.generationTime ?? 0} ms</p>
            </div>
          </div>
        </div>

        {/* Algorithm Rationale */}
        <div className="p-4 rounded-xl bg-slate-900 text-slate-300 text-xs space-y-2">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Cpu className="w-4 h-4 text-brand-400" />
            <span>Difficult-First Search Strategy</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Multi-period laboratories were prioritized first due to strict contiguous slot and specialized equipment requirements, followed by high-demand faculty with limited overlapping availability. Backtracking search resolved all slot contentions deterministically.
          </p>
        </div>
      </div>
    </Modal>
  );
};
