import { Faculty } from '../models/Faculty.js';
import { Classroom } from '../models/Classroom.js';
import { Division } from '../models/Division.js';
import { Timetable } from '../models/Timetable.js';
import { TimeSlot } from '../models/TimeSlot.js';
import { sendSuccess } from '../utils/response.js';

export const getReports = async (req, res, next) => {
  try {
    const { academicYear = '2025-2026' } = req.query;

    const timetables = await Timetable.find({
      academicYear,
      status: 'ACTIVE',
    })
      .populate('division')
      .populate('entries.subject')
      .populate('entries.faculty')
      .populate('entries.classroom');

    const totalActiveSlots = await TimeSlot.countDocuments({ isBreak: false });
    const facultyList = await Faculty.find().populate('department');
    const classrooms = await Classroom.find();
    const divisions = await Division.find().populate('department');

    // 1. Faculty Workload Calculation
    const facultyWorkloadMap = new Map();
    for (const fac of facultyList) {
      facultyWorkloadMap.set(fac._id.toString(), {
        id: fac._id,
        name: fac.name,
        employeeId: fac.employeeId,
        department: fac.department?.name || 'General',
        totalPeriods: 0,
        maxWeeklyHours: fac.maxWeeklyHours || 20,
        assignedClasses: new Set(),
      });
    }

    for (const tt of timetables) {
      for (const entry of tt.entries || []) {
        const facId = (entry.faculty?._id || entry.faculty)?.toString();
        if (facId && facultyWorkloadMap.has(facId)) {
          const item = facultyWorkloadMap.get(facId);
          item.totalPeriods++;
          if (entry.subject?.name) {
            item.assignedClasses.add(entry.subject.name);
          }
        }
      }
    }

    const facultyWorkload = Array.from(facultyWorkloadMap.values()).map((f) => ({
      id: f.id,
      name: f.name,
      employeeId: f.employeeId,
      department: f.department,
      totalPeriods: f.totalPeriods,
      totalClasses: f.assignedClasses.size,
      maxWeeklyHours: f.maxWeeklyHours,
      freePeriods: Math.max(0, (totalActiveSlots || 30) - f.totalPeriods),
      workloadPercentage: f.maxWeeklyHours > 0 ? Math.min(100, Math.round((f.totalPeriods / f.maxWeeklyHours) * 100)) : 0,
    }));

    // 2. Classroom Utilization Calculation
    const roomUtilizationMap = new Map();
    for (const rm of classrooms) {
      roomUtilizationMap.set(rm._id.toString(), {
        id: rm._id,
        name: rm.name,
        roomNumber: rm.roomNumber,
        type: rm.type,
        capacity: rm.capacity,
        building: rm.building,
        assignedPeriods: 0,
      });
    }

    for (const tt of timetables) {
      for (const entry of tt.entries || []) {
        const rmId = (entry.classroom?._id || entry.classroom)?.toString();
        if (rmId && roomUtilizationMap.has(rmId)) {
          roomUtilizationMap.get(rmId).assignedPeriods++;
        }
      }
    }

    const classroomUtilization = Array.from(roomUtilizationMap.values()).map((r) => {
      const totalSlots = totalActiveSlots || 30;
      const utilPct = totalSlots > 0 ? Math.round((r.assignedPeriods / totalSlots) * 100) : 0;
      return {
        ...r,
        totalAvailableSlots: totalSlots,
        utilizationPercentage: utilPct,
      };
    });

    // 3. Division Schedule Summaries
    const divisionSchedules = timetables.map((tt) => ({
      timetableId: tt._id,
      division: tt.division?.name || 'Unknown',
      department: tt.division?.department?.name || 'General',
      semester: tt.semester,
      academicYear: tt.academicYear,
      totalSessions: tt.entries?.length || 0,
      softConstraintScore: tt.generationStats?.softConstraintScore || 0,
      hardViolationsCount: tt.generationStats?.hardConstraintViolations || 0,
      generatedAt: tt.generatedAt,
    }));

    // 4. Constraint Summary
    let totalHardViolations = 0;
    let totalSoftPenalty = 0;
    for (const tt of timetables) {
      totalHardViolations += tt.generationStats?.hardConstraintViolations || 0;
      totalSoftPenalty += tt.generationStats?.softConstraintScore || 0;
    }

    const constraintSummary = {
      hardConstraintsChecked: [
        'Faculty Conflict (No double-booking across divisions)',
        'Classroom Conflict (No simultaneous classroom sharing)',
        'Division Conflict (One subject per division at any time)',
        'Classroom Capacity (Room capacity >= division strength)',
        'Lab Requirement (Designated laboratory for practicals)',
        'Faculty Availability Matrix (Personal unavailable slots respected)',
        'Room Availability Matrix (Reserved room slots respected)',
        'Curriculum Quota (Exact required weekly periods satisfied)',
      ],
      totalHardViolations,
      status: totalHardViolations === 0 ? 'COMPLIANT' : 'VIOLATIONS_DETECTED',
      totalSoftPenalty,
      averagePenaltyPerTimetable: timetables.length > 0 ? Math.round(totalSoftPenalty / timetables.length) : 0,
    };

    return sendSuccess(res, {
      facultyWorkload,
      classroomUtilization,
      divisionSchedules,
      constraintSummary,
    });
  } catch (error) {
    next(error);
  }
};
