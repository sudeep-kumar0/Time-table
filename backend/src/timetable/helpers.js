/**
 * Helper utilities for the Timetable Generation Engine
 */

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

/**
 * Format a slot key for quick Set lookups
 */
export const makeSlotKey = (day, period) => `${day}_${period}`;
export const makeFacultySlotKey = (facultyId, day, period) => `${facultyId}_${day}_${period}`;
export const makeRoomSlotKey = (roomId, day, period) => `${roomId}_${day}_${period}`;
export const makeDivisionSlotKey = (divisionId, day, period) => `${divisionId}_${day}_${period}`;

/**
 * Check if two time slot intervals overlap or are consecutive
 */
export const arePeriodsConsecutive = (p1, p2) => Math.abs(p1 - p2) === 1;

/**
 * Check if a faculty member is marked available for a specific day and period
 */
export const isFacultyAvailableForSlot = (faculty, day, periodNumber) => {
  if (!faculty) return false;
  if (!faculty.availability || faculty.availability.length === 0) {
    // If no explicit availability array is provided, assume available by default
    return true;
  }
  const slot = faculty.availability.find(
    (a) => a.day === day && Number(a.periodNumber) === Number(periodNumber)
  );
  // If explicitly defined, check isAvailable; default to true if slot is omitted
  return slot !== undefined ? Boolean(slot.isAvailable) : true;
};

/**
 * Check if a classroom is marked available for a specific day and period
 */
export const isRoomAvailableForSlot = (room, day, periodNumber) => {
  if (!room) return false;
  if (!room.availability || room.availability.length === 0) {
    return true;
  }
  const slot = room.availability.find(
    (a) => a.day === day && Number(a.periodNumber) === Number(periodNumber)
  );
  return slot !== undefined ? Boolean(slot.isAvailable) : true;
};

/**
 * Determine if a classroom satisfies capacity and type requirements
 */
export const isRoomSuitableForSubject = (room, subject, studentCount) => {
  if (!room || !subject) return false;
  if (room.capacity < studentCount) {
    return false;
  }
  if (subject.requiresLab || subject.type === 'LAB') {
    return room.type === 'LAB';
  }
  // Normal theory can be in CLASSROOM or LAB (if classroom preferred, CLASSROOM first)
  return true;
};

/**
 * Split subject weekly periods into discrete scheduling tasks.
 * Labs are grouped into blocks of 2 (or preferred consecutive periods).
 * Theory is typically 1 period blocks.
 */
export const createSchedulingTasks = (subjects, studentCount, rooms, facultyList) => {
  const tasks = [];

  for (const subject of subjects) {
    const isLab = Boolean(subject.requiresLab || subject.type === 'LAB');
    const consecutive = isLab ? (subject.preferredConsecutivePeriods || 2) : 1;
    let remainingPeriods = subject.weeklyPeriods;

    // Eligible faculty for this subject
    const eligibleFaculty = facultyList.filter((f) => {
      // Check both subject.facultyEligible and faculty.subjects
      const hasSubject = f.subjects && f.subjects.some((s) => (s._id || s).toString() === subject._id.toString());
      const isEligible = subject.facultyEligible && subject.facultyEligible.some((fe) => (fe._id || fe).toString() === f._id.toString());
      return hasSubject || isEligible;
    });

    // Qualifying rooms for this subject & division
    const eligibleRooms = rooms.filter((r) => isRoomSuitableForSubject(r, subject, studentCount));

    while (remainingPeriods > 0) {
      const duration = remainingPeriods >= consecutive ? consecutive : remainingPeriods;
      remainingPeriods -= duration;

      tasks.push({
        id: `${subject._id}_task_${tasks.length + 1}`,
        subjectId: subject._id.toString(),
        subjectName: subject.name,
        subjectCode: subject.code,
        subjectType: subject.type,
        requiresLab: isLab,
        duration,
        eligibleFaculty,
        eligibleRooms,
        subjectRef: subject,
      });
    }
  }

  return tasks;
};

/**
 * Sort tasks using Difficult-First (MRV / Degree Heuristic):
 * 1. Labs (duration > 1) first: they need consecutive periods in specialized rooms.
 * 2. Tasks with fewest eligible rooms.
 * 3. Tasks with fewest eligible faculty.
 * 4. Tasks from subjects with highest total weekly periods.
 */
export const sortTasksDifficultFirst = (tasks) => {
  return [...tasks].sort((a, b) => {
    // 1. Multi-period / Lab tasks first
    if (a.duration !== b.duration) {
      return b.duration - a.duration;
    }

    // 2. Minimum Remaining Values (MRV) on Rooms
    const roomDiff = a.eligibleRooms.length - b.eligibleRooms.length;
    if (roomDiff !== 0) return roomDiff;

    // 3. Minimum Remaining Values (MRV) on Faculty
    const facultyDiff = a.eligibleFaculty.length - b.eligibleFaculty.length;
    if (facultyDiff !== 0) return facultyDiff;

    // 4. Prefer subjects with higher weekly periods
    const aWeekly = a.subjectRef.weeklyPeriods || 0;
    const bWeekly = b.subjectRef.weeklyPeriods || 0;
    return bWeekly - aWeekly;
  });
};
