import {
  makeFacultySlotKey,
  makeRoomSlotKey,
  makeDivisionSlotKey,
  isFacultyAvailableForSlot,
  isRoomAvailableForSlot,
} from './helpers.js';

/**
 * Validates whether assigning a task to a given slot, faculty, and room satisfies all hard constraints.
 *
 * @param {Object} params
 * @param {Object} params.task - The task being scheduled (contains subject, duration, etc.)
 * @param {string} params.day - Target day
 * @param {number} params.startPeriod - Target starting periodNumber
 * @param {Object} params.faculty - Selected faculty member
 * @param {Object} params.room - Selected classroom
 * @param {Object} params.division - Target division
 * @param {Set<string>} params.divisionOccupied - Set of `${divisionId}_${day}_${period}`
 * @param {Set<string>} params.facultyOccupied - Set of `${facultyId}_${day}_${period}`
 * @param {Set<string>} params.roomOccupied - Set of `${roomId}_${day}_${period}`
 * @param {Map<string, Object>} params.timeSlotsByDayPeriod - Map of `${day}_${period}` -> slot info
 * @param {number} [params.maxPeriodPerDay=6] - Max periods configured for the day
 * @returns {{ valid: boolean, reason?: string, constraint?: string }}
 */
export const canAssignSlot = ({
  task,
  day,
  startPeriod,
  faculty,
  room,
  division,
  divisionOccupied,
  facultyOccupied,
  roomOccupied,
  timeSlotsByDayPeriod,
  maxPeriodPerDay = 6,
}) => {
  const duration = task.duration || 1;
  const divisionId = (division._id || division).toString();
  const facultyId = (faculty._id || faculty).toString();
  const roomId = (room._id || room).toString();

  // 1. Room Capacity Constraint
  if (room.capacity < division.studentCount) {
    return {
      valid: false,
      constraint: 'ROOM_CAPACITY',
      reason: `Room ${room.name || room.roomNumber} capacity (${room.capacity}) is less than division student count (${division.studentCount}).`,
    };
  }

  // 2. Lab Requirement Constraint
  if (task.requiresLab || task.subjectType === 'LAB') {
    if (room.type !== 'LAB') {
      return {
        valid: false,
        constraint: 'LAB_REQUIREMENT',
        reason: `Subject "${task.subjectName}" requires a laboratory, but "${room.name || room.roomNumber}" is a standard ${room.type}.`,
      };
    }
  }

  // Check each period in the block (for single or consecutive periods)
  for (let offset = 0; offset < duration; offset++) {
    const period = startPeriod + offset;

    // Check if slot exists in the timetable calendar
    const slotKey = `${day}_${period}`;
    const timeSlotObj = timeSlotsByDayPeriod.get(slotKey);
    if (!timeSlotObj) {
      return {
        valid: false,
        constraint: 'INVALID_SLOT',
        reason: `Period ${period} on ${day} does not exist in the configured time slots.`,
      };
    }

    if (timeSlotObj.isBreak) {
      return {
        valid: false,
        constraint: 'BREAK_SLOT',
        reason: `Period ${period} on ${day} is designated as a break (${timeSlotObj.label || 'Recess/Lunch'}).`,
      };
    }

    // 3. Division Conflict Constraint
    const divKey = makeDivisionSlotKey(divisionId, day, period);
    if (divisionOccupied.has(divKey)) {
      return {
        valid: false,
        constraint: 'DIVISION_CONFLICT',
        reason: `Division ${division.name} is already scheduled with another subject at ${day} Period ${period}.`,
      };
    }

    // 4. Faculty Conflict Constraint
    const facKey = makeFacultySlotKey(facultyId, day, period);
    if (facultyOccupied.has(facKey)) {
      return {
        valid: false,
        constraint: 'FACULTY_CONFLICT',
        reason: `Faculty ${faculty.name} is already scheduled to teach another class at ${day} Period ${period}.`,
      };
    }

    // 5. Room Conflict Constraint
    const rmKey = makeRoomSlotKey(roomId, day, period);
    if (roomOccupied.has(rmKey)) {
      return {
        valid: false,
        constraint: 'ROOM_CONFLICT',
        reason: `Classroom ${room.name || room.roomNumber} is already occupied at ${day} Period ${period}.`,
      };
    }

    // 6. Faculty Availability Constraint
    if (!isFacultyAvailableForSlot(faculty, day, period)) {
      return {
        valid: false,
        constraint: 'FACULTY_UNAVAILABLE',
        reason: `Faculty ${faculty.name} is marked unavailable at ${day} Period ${period}.`,
      };
    }

    // 7. Room Availability Constraint
    if (!isRoomAvailableForSlot(room, day, period)) {
      return {
        valid: false,
        constraint: 'ROOM_UNAVAILABLE',
        reason: `Classroom ${room.name || room.roomNumber} is marked unavailable at ${day} Period ${period}.`,
      };
    }
  }

  return { valid: true };
};

/**
 * Validate an entire timetable document against all hard constraints.
 * Used for POST /api/timetables/validate and verifying generated schedules.
 *
 * @param {Object} timetable - Timetable document or object with entries
 * @param {Object} options - Division, subjects, classrooms, faculty, externalOccupiedSlots
 * @returns {Object} { isValid, violations: Array<Object>, summary: string }
 */
export const validateTimetable = (timetable, {
  division,
  subjects = [],
  classrooms = [],
  facultyList = [],
  externalOccupiedSlots = { faculty: new Set(), rooms: new Set(), divisions: new Set() }
} = {}) => {
  const violations = [];
  const entries = timetable.entries || [];

  const facultyMap = new Map(facultyList.map((f) => [f._id.toString(), f]));
  const roomMap = new Map(classrooms.map((r) => [r._id.toString(), r]));
  const subjectMap = new Map(subjects.map((s) => [s._id.toString(), s]));

  // Tracking occupied slots within this timetable
  const localDivSlots = new Map(); // `${day}_${period}` -> entry
  const localFacSlots = new Map(); // `${facultyId}_${day}_${period}` -> entry
  const localRoomSlots = new Map(); // `${roomId}_${day}_${period}` -> entry
  const subjectPeriodCounts = new Map(); // subjectId -> count

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const day = entry.day;
    const period = Number(entry.period);
    const subId = (entry.subject?._id || entry.subject)?.toString();
    const facId = (entry.faculty?._id || entry.faculty)?.toString();
    const rmId = (entry.classroom?._id || entry.classroom)?.toString();
    const divId = (entry.division?._id || entry.division || division?._id || division)?.toString();

    const subjectObj = subjectMap.get(subId) || entry.subject;
    const facultyObj = facultyMap.get(facId) || entry.faculty;
    const roomObj = roomMap.get(rmId) || entry.classroom;

    // Track weekly periods
    if (subId) {
      subjectPeriodCounts.set(subId, (subjectPeriodCounts.get(subId) || 0) + 1);
    }

    // 1. Division Conflict
    const divKey = `${day}_${period}`;
    if (localDivSlots.has(divKey)) {
      const prev = localDivSlots.get(divKey);
      violations.push({
        type: 'DIVISION_CONFLICT',
        severity: 'CRITICAL',
        day,
        period,
        subject: subjectObj?.name || 'Unknown',
        division: division?.name || 'Current Division',
        faculty: facultyObj?.name || 'Unknown',
        room: roomObj?.roomNumber || 'Unknown',
        explanation: `Division has two overlapping classes at ${day} Period ${period} (${subjectObj?.name} and ${prev.subjectName}).`,
        suggestedAction: 'Reschedule one of the conflicting subjects to an unallocated period.',
      });
    } else {
      localDivSlots.set(divKey, { subjectName: subjectObj?.name });
    }

    // 2. Faculty Conflict (Internal & External)
    const facKey = `${facId}_${day}_${period}`;
    if (localFacSlots.has(facKey)) {
      const prev = localFacSlots.get(facKey);
      violations.push({
        type: 'FACULTY_CONFLICT',
        severity: 'CRITICAL',
        day,
        period,
        subject: subjectObj?.name || 'Unknown',
        faculty: facultyObj?.name || 'Unknown',
        room: roomObj?.roomNumber || 'Unknown',
        explanation: `Faculty ${facultyObj?.name} is assigned to multiple classes at ${day} Period ${period}.`,
        suggestedAction: 'Assign a different eligible faculty or shift session to a free slot.',
      });
    } else {
      localFacSlots.set(facKey, { subjectName: subjectObj?.name });
    }

    if (externalOccupiedSlots.faculty.has(facKey)) {
      violations.push({
        type: 'FACULTY_CONFLICT',
        severity: 'CRITICAL',
        day,
        period,
        subject: subjectObj?.name || 'Unknown',
        faculty: facultyObj?.name || 'Unknown',
        room: roomObj?.roomNumber || 'Unknown',
        explanation: `Faculty ${facultyObj?.name} is already committed to another division at ${day} Period ${period}.`,
        suggestedAction: 'Adjust schedule to respect faculty availability across other divisions.',
      });
    }

    // 3. Room Conflict (Internal & External)
    const rmKey = `${rmId}_${day}_${period}`;
    if (localRoomSlots.has(rmKey)) {
      violations.push({
        type: 'ROOM_CONFLICT',
        severity: 'CRITICAL',
        day,
        period,
        subject: subjectObj?.name || 'Unknown',
        faculty: facultyObj?.name || 'Unknown',
        room: roomObj?.roomNumber || 'Unknown',
        explanation: `Classroom ${roomObj?.roomNumber || roomObj?.name} is booked multiple times at ${day} Period ${period}.`,
        suggestedAction: 'Reassign one session to another available classroom.',
      });
    } else {
      localRoomSlots.set(rmKey, { subjectName: subjectObj?.name });
    }

    if (externalOccupiedSlots.rooms.has(rmKey)) {
      violations.push({
        type: 'ROOM_CONFLICT',
        severity: 'CRITICAL',
        day,
        period,
        subject: subjectObj?.name || 'Unknown',
        faculty: facultyObj?.name || 'Unknown',
        room: roomObj?.roomNumber || 'Unknown',
        explanation: `Classroom ${roomObj?.roomNumber || roomObj?.name} is occupied by another division at ${day} Period ${period}.`,
        suggestedAction: 'Select a different room with adequate capacity.',
      });
    }

    // 4. Room Capacity Constraint
    const studentCount = division?.studentCount || 0;
    if (roomObj && roomObj.capacity < studentCount) {
      violations.push({
        type: 'ROOM_CAPACITY_VIOLATION',
        severity: 'CRITICAL',
        day,
        period,
        subject: subjectObj?.name || 'Unknown',
        room: roomObj?.roomNumber || 'Unknown',
        explanation: `Room capacity (${roomObj.capacity}) is lower than division student strength (${studentCount}).`,
        suggestedAction: 'Assign a larger classroom or auditorium.',
      });
    }

    // 5. Lab Requirement Constraint
    if (subjectObj && (subjectObj.requiresLab || subjectObj.type === 'LAB')) {
      if (roomObj && roomObj.type !== 'LAB') {
        violations.push({
          type: 'LAB_REQUIREMENT_VIOLATION',
          severity: 'CRITICAL',
          day,
          period,
          subject: subjectObj?.name,
          room: roomObj?.roomNumber,
          explanation: `Subject "${subjectObj.name}" requires a specialized laboratory, but "${roomObj.roomNumber}" is type ${roomObj.type}.`,
          suggestedAction: 'Assign a designated laboratory.',
        });
      }
    }

    // 6. Faculty Availability Constraint
    if (facultyObj && !isFacultyAvailableForSlot(facultyObj, day, period)) {
      violations.push({
        type: 'FACULTY_AVAILABILITY_VIOLATION',
        severity: 'CRITICAL',
        day,
        period,
        subject: subjectObj?.name,
        faculty: facultyObj?.name,
        explanation: `Faculty ${facultyObj.name} is marked as UNAVAILABLE on ${day} Period ${period}.`,
        suggestedAction: 'Shift to a period when the faculty is available, or adjust faculty availability settings.',
      });
    }

    // 7. Room Availability Constraint
    if (roomObj && !isRoomAvailableForSlot(roomObj, day, period)) {
      violations.push({
        type: 'ROOM_AVAILABILITY_VIOLATION',
        severity: 'CRITICAL',
        day,
        period,
        room: roomObj?.roomNumber,
        explanation: `Classroom ${roomObj.roomNumber} is marked as UNAVAILABLE on ${day} Period ${period}.`,
        suggestedAction: 'Reschedule to an available period or enable room availability.',
      });
    }
  }

  // 8. Required Weekly Periods Constraint
  for (const subject of subjects) {
    const subId = subject._id.toString();
    const scheduledCount = subjectPeriodCounts.get(subId) || 0;
    const requiredCount = subject.weeklyPeriods || 0;

    if (scheduledCount < requiredCount) {
      violations.push({
        type: 'INSUFFICIENT_PERIODS',
        severity: 'CRITICAL',
        subject: subject.name,
        explanation: `Subject "${subject.name}" requires ${requiredCount} weekly periods, but only ${scheduledCount} were scheduled.`,
        suggestedAction: `Schedule ${requiredCount - scheduledCount} additional period(s) for this subject.`,
      });
    } else if (scheduledCount > requiredCount) {
      violations.push({
        type: 'EXCESSIVE_PERIODS',
        severity: 'WARNING',
        subject: subject.name,
        explanation: `Subject "${subject.name}" has ${scheduledCount} periods scheduled, exceeding requirement of ${requiredCount}.`,
        suggestedAction: 'Remove extraneous sessions to meet curriculum limits.',
      });
    }
  }

  const isValid = violations.length === 0;

  return {
    isValid,
    violations,
    violationsCount: violations.length,
    message: isValid
      ? 'All hard constraints satisfied. Timetable is mathematically valid.'
      : `Found ${violations.length} hard constraint violation(s).`,
  };
};
