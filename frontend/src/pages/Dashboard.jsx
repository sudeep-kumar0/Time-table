import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar.jsx';
import { StatsCard } from '../components/StatsCard.jsx';
import {
  Building2,
  Users2,
  GraduationCap,
  BookOpen,
  DoorOpen,
  FlaskConical,
  CalendarDays,
  AlertOctagon,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import {
  departmentService,
  divisionService,
  facultyService,
  subjectService,
  classroomService,
  timetableService,
  conflictService,
  historyService,
} from '../services/dataService.js';
import { useAuth } from '../context/AuthContext.jsx';

export const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    departments: 0,
    divisions: 0,
    faculty: 0,
    subjects: 0,
    classrooms: 0,
    labs: 0,
    timetables: 0,
    conflicts: 0,
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [activeConflictsList, setActiveConflictsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [
        depts,
        divs,
        facs,
        subs,
        rooms,
        tts,
        conflictsData,
        logs,
      ] = await Promise.allSettled([
        departmentService.getAll(),
        divisionService.getAll(),
        facultyService.getAll(),
        subjectService.getAll(),
        classroomService.getAll(),
        timetableService.getAll(),
        conflictService.getConflicts(),
        historyService.getLogs(),
      ]);

      const deptsCount = depts.status === 'fulfilled' ? depts.value?.length || 0 : 0;
      const divsCount = divs.status === 'fulfilled' ? divs.value?.length || 0 : 0;
      const facsCount = facs.status === 'fulfilled' ? facs.value?.length || 0 : 0;
      const subsCount = subs.status === 'fulfilled' ? subs.value?.length || 0 : 0;
      const allRooms = rooms.status === 'fulfilled' ? rooms.value || [] : [];
      const classroomsCount = allRooms.filter((r) => r.type === 'CLASSROOM').length;
      const labsCount = allRooms.filter((r) => r.type === 'LAB').length;
      const ttsCount = tts.status === 'fulfilled' ? tts.value?.length || 0 : 0;
      const conflicts = conflictsData.status === 'fulfilled' ? conflictsData.value?.conflicts || [] : [];
      const historyLogs = logs.status === 'fulfilled' ? logs.value?.slice(0, 5) || [] : [];

      setStats({
        departments: deptsCount,
        divisions: divsCount,
        faculty: facsCount,
        subjects: subsCount,
        classrooms: classroomsCount,
        labs: labsCount,
        timetables: ttsCount,
        conflicts: conflicts.length,
      });

      setActiveConflictsList(conflicts.slice(0, 3));
      setRecentLogs(historyLogs);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Navbar
        title="Institutional Dashboard"
        subtitle={`Welcome, ${user?.name || 'Administrator'} — College Scheduling & Engine Overview`}
        actions={
          isAdmin && (
            <button
              onClick={() => navigate('/generate')}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-600/20 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Generate Timetable
            </button>
          )
        }
      />

      {/* Conflict Alert Banner if Active Conflicts Exist */}
      {stats.conflicts > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-rose-950">
                {stats.conflicts} Active Scheduling Conflict(s) Detected!
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                Resource double-booking or room capacity violations require administrator attention.
              </p>
            </div>
          </div>
          <Link
            to="/conflicts"
            className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-white border border-rose-200 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors"
          >
            Review in Conflict Center <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 8 Primary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Departments"
          value={stats.departments}
          icon={Building2}
          color="blue"
          subtext="Academic units"
          onClick={() => navigate('/departments')}
        />
        <StatsCard
          title="Divisions"
          value={stats.divisions}
          icon={Users2}
          color="indigo"
          subtext="Active student cohorts"
          onClick={() => navigate('/divisions')}
        />
        <StatsCard
          title="Faculty Members"
          value={stats.faculty}
          icon={GraduationCap}
          color="emerald"
          subtext="Teaching staff"
          onClick={() => navigate('/faculty')}
        />
        <StatsCard
          title="Total Subjects"
          value={stats.subjects}
          icon={BookOpen}
          color="purple"
          subtext="Curriculum courses"
          onClick={() => navigate('/subjects')}
        />
        <StatsCard
          title="Classrooms"
          value={stats.classrooms}
          icon={DoorOpen}
          color="cyan"
          subtext="Lecture halls"
          onClick={() => navigate('/classrooms')}
        />
        <StatsCard
          title="Specialized Labs"
          value={stats.labs}
          icon={FlaskConical}
          color="teal"
          subtext="Practical laboratories"
          onClick={() => navigate('/classrooms')}
        />
        <StatsCard
          title="Active Timetables"
          value={stats.timetables}
          icon={CalendarDays}
          color="blue"
          subtext="Published schedules"
          onClick={() => navigate('/timetables')}
        />
        <StatsCard
          title="Active Conflicts"
          value={stats.conflicts}
          icon={AlertOctagon}
          color={stats.conflicts > 0 ? 'rose' : 'emerald'}
          subtext={stats.conflicts > 0 ? 'Attention required' : 'All clear'}
          onClick={() => navigate('/conflicts')}
        />
      </div>

      {/* Quick Launch & Engine Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow Showcase */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Constraint Satisfaction Scheduling Engine</h3>
              <p className="text-xs text-slate-500">How SmartSchedule synthesizes conflict-free college timetables</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold">
              Pure CSP / Backtracking
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                1
              </div>
              <h4 className="font-bold text-xs text-slate-800">Resource Ingestion</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Loads division cohort strength, subject period requirements, eligible teachers, and classroom availability matrices.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xs">
                2
              </div>
              <h4 className="font-bold text-xs text-slate-800">MRV & Backtracking</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Prioritizes difficult multi-period laboratory blocks first, testing candidate time slots and backtracking upon dead ends.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs">
                3
              </div>
              <h4 className="font-bold text-xs text-slate-800">Soft Optimization</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Performs local neighborhood swaps to minimize student/faculty idle gaps and evenly distribute subjects across the week.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Zero hard-constraint violations guaranteed on generated outputs</span>
            </div>
            {isAdmin && (
              <button
                onClick={() => navigate('/generate')}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                Launch Generator <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Recent Generation Logs */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">Recent Runs</h3>
              <Link to="/history" className="text-xs font-semibold text-brand-600 hover:underline">
                View All
              </Link>
            </div>

            {recentLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No timetable generation attempts logged yet.
              </div>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div
                    key={log._id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800">
                        {log.division?.name || 'Division'}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {new Date(log.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {log.generationTime}ms
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        log.success
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {log.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <Link
              to="/reports"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center justify-between"
            >
              <span>View Faculty & Room Utilization Reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
