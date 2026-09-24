import React, { useState } from 'react';
import { Download, Printer, Filter, Info, Eye, Layers, User, Home } from 'lucide-react';

const SUBJECT_COLORS = [
  'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100',
  'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100',
  'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100',
  'bg-purple-50 border-purple-200 text-purple-900 hover:bg-purple-100',
  'bg-rose-50 border-rose-200 text-rose-900 hover:bg-rose-100',
  'bg-cyan-50 border-cyan-200 text-cyan-900 hover:bg-cyan-100',
  'bg-indigo-50 border-indigo-200 text-indigo-900 hover:bg-indigo-100',
  'bg-teal-50 border-teal-200 text-teal-900 hover:bg-teal-100',
  'bg-violet-50 border-violet-200 text-violet-900 hover:bg-violet-100',
];

export const TimetableGrid = ({
  timetable,
  divisionName,
  facultyList = [],
  classrooms = [],
}) => {
  const [viewMode, setViewMode] = useState('DIVISION'); // 'DIVISION', 'FACULTY', 'ROOM'
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);

  if (!timetable || !timetable.entries || timetable.entries.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
        <p className="font-semibold text-slate-700">No timetable entries available to display.</p>
        <p className="text-xs text-slate-400 mt-1">Generate a timetable to view the weekly schedule grid.</p>
      </div>
    );
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [1, 2, 3, 4, 5, 6];

  // Distinct color hash for each subject
  const colorMap = new Map();
  let colorIdx = 0;
  for (const entry of timetable.entries) {
    const subName = entry.subject?.name || 'Subject';
    if (!colorMap.has(subName)) {
      colorMap.set(subName, SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length]);
      colorIdx++;
    }
  }

  // Filter entries based on active view mode
  const filteredEntries = timetable.entries.filter((entry) => {
    if (viewMode === 'FACULTY' && selectedFacultyId) {
      const facId = (entry.faculty?._id || entry.faculty)?.toString();
      return facId === selectedFacultyId;
    }
    if (viewMode === 'ROOM' && selectedRoomId) {
      const rmId = (entry.classroom?._id || entry.classroom)?.toString();
      return rmId === selectedRoomId;
    }
    return true;
  });

  // Fast cell lookup map: `${day}_${period}` -> entry
  const cellMap = new Map();
  for (const entry of filteredEntries) {
    cellMap.set(`${entry.day}_${entry.period}`, entry);
  }

  // Export to CSV helper
  const exportToCSV = () => {
    const headers = ['Period', 'Time', ...days];
    const rows = periods.map((p) => {
      const firstEntryThisP = timetable.entries.find((e) => e.period === p);
      const timeStr = firstEntryThisP ? `${firstEntryThisP.startTime} - ${firstEntryThisP.endTime}` : `P${p}`;
      const dayCols = days.map((d) => {
        const item = cellMap.get(`${d}_${p}`);
        if (!item) return 'FREE';
        return `"${item.subject?.name || 'Sub'} (${item.faculty?.name || 'Fac'}) [${item.classroom?.roomNumber || 'Room'}]"`;
      });
      return [`Period ${p}`, `"${timeStr}"`, ...dayCols].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Timetable_${divisionName || 'Division'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 no-print shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Layers className="w-3.5 h-3.5" /> View Mode:
          </span>
          <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('DIVISION')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'DIVISION' ? 'bg-white text-brand-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Division View
            </button>
            <button
              onClick={() => setViewMode('FACULTY')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'FACULTY' ? 'bg-white text-brand-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Faculty View
            </button>
            <button
              onClick={() => setViewMode('ROOM')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'ROOM' ? 'bg-white text-brand-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Classroom View
            </button>
          </div>
        </div>

        {/* View Specific Selectors */}
        <div className="flex items-center gap-3">
          {viewMode === 'FACULTY' && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <select
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 font-medium focus:outline-brand-500"
              >
                <option value="">All Faculty</option>
                {facultyList.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name} ({f.employeeId})
                  </option>
                ))}
              </select>
            </div>
          )}

          {viewMode === 'ROOM' && (
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-slate-400" />
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 font-medium focus:outline-brand-500"
              >
                <option value="">All Classrooms</option>
                {classrooms.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.roomNumber} ({r.type} - Cap: {r.capacity})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            CSV Export
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Timetable
          </button>
        </div>
      </div>

      {/* The Master Timetable Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print-full">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">
              Weekly Timetable Grid — {divisionName || timetable.division?.name || 'Class Schedule'}
            </h3>
            <p className="text-xs text-slate-500">
              Academic Year: {timetable.academicYear} | Semester: {timetable.semester} | Total Sessions: {timetable.entries.length}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Practical Lab
            </span>
            <span className="flex items-center gap-1 ml-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Theory Session
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[850px]">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="w-28 p-3 text-center border-r border-slate-200">Time / Period</th>
                {days.map((day) => (
                  <th key={day} className="p-3 text-center border-r border-slate-200 last:border-r-0">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {periods.map((period) => {
                // Find period time string
                const sampleEntry = timetable.entries.find((e) => e.period === period);
                const timeString = sampleEntry ? `${sampleEntry.startTime} - ${sampleEntry.endTime}` : `Period ${period}`;

                return (
                  <tr key={period} className="hover:bg-slate-50/30">
                    {/* Period Row Header */}
                    <td className="p-3 text-center border-r border-slate-200 bg-slate-50/80 font-semibold text-slate-800">
                      <div className="font-bold text-slate-900">Period {period}</div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5">{timeString}</div>
                    </td>

                    {/* Day Cells */}
                    {days.map((day) => {
                      const entry = cellMap.get(`${day}_${period}`);
                      if (!entry) {
                        return (
                          <td
                            key={day}
                            className="p-2 border-r border-slate-200 last:border-r-0 bg-slate-50/20 text-center"
                          >
                            <span className="text-[11px] text-slate-300 font-medium tracking-wide">
                              — FREE —
                            </span>
                          </td>
                        );
                      }

                      const isLab = entry.subject?.requiresLab || entry.subject?.type === 'LAB' || entry.requiresLab;
                      const colorClass = colorMap.get(entry.subject?.name) || 'bg-slate-50 border-slate-200 text-slate-800';

                      return (
                        <td
                          key={day}
                          onClick={() => setSelectedEntry(entry)}
                          className="p-1.5 border-r border-slate-200 last:border-r-0 cursor-pointer"
                        >
                          <div
                            className={`p-2.5 rounded-xl border transition-all duration-150 shadow-xs flex flex-col justify-between h-[86px] ${colorClass}`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-bold text-xs leading-tight line-clamp-1">
                                {entry.subject?.name || 'Subject'}
                              </span>
                              {isLab && (
                                <span className="flex-shrink-0 text-[9px] px-1 py-0.2 rounded font-extrabold bg-purple-600 text-white uppercase tracking-wider">
                                  LAB
                                </span>
                              )}
                            </div>

                            <div className="mt-1 space-y-0.5 text-[11px]">
                              <div className="flex items-center justify-between text-slate-600 font-medium">
                                <span className="truncate">{entry.faculty?.name || 'Faculty'}</span>
                              </div>
                              <div className="flex items-center justify-between font-bold text-slate-700">
                                <span>{entry.classroom?.roomNumber || 'Room'}</span>
                                {entry.division?.name && viewMode !== 'DIVISION' && (
                                  <span className="text-slate-500 font-normal">{entry.division.name}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Details Modal for Clicked Entry */}
      {selectedEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-base text-slate-900">Session Details</h4>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Subject</span>
                <p className="font-bold text-slate-900">{selectedEntry.subject?.name}</p>
                <p className="text-xs text-slate-500">Code: {selectedEntry.subject?.code} ({selectedEntry.subject?.type})</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Day & Period</span>
                  <p className="font-medium text-slate-800">{selectedEntry.day}, Period {selectedEntry.period}</p>
                  <p className="text-xs text-slate-500">{selectedEntry.startTime} - {selectedEntry.endTime}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Classroom</span>
                  <p className="font-medium text-slate-800">{selectedEntry.classroom?.roomNumber || 'Room'}</p>
                  <p className="text-xs text-slate-500">Cap: {selectedEntry.classroom?.capacity} ({selectedEntry.classroom?.type})</p>
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Faculty In-Charge</span>
                <p className="font-medium text-slate-800">{selectedEntry.faculty?.name}</p>
                <p className="text-xs text-slate-500">ID: {selectedEntry.faculty?.employeeId}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
