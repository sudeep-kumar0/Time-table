/**
 * Soft Constraint Scoring & Objective Evaluation
 * Lower penalty = Better timetable quality.
 */

export const DEFAULT_WEIGHTS = {
  facultyGaps: 4,               // Penalty per idle hour between classes for a faculty member on same day
  studentGaps: 5,               // Penalty per idle period for students in the middle of the day
  excessiveConsecutive: 6,      // Penalty for > 3 consecutive periods without a break
  subjectClustering: 8,         // Penalty for having multiple non-lab periods of same subject on the same day
  morningLabPenalty: 3,         // Penalty for scheduling labs in late afternoon periods
  excessiveRoomShuffling: 2,    // Penalty for switching regular classrooms too frequently in a single day
};

/**
 * Calculates soft constraint penalty score for a timetable.
 *
 * @param {Array<Object>} entries - Array of scheduled entries
 * @param {Object} [options] - Weight preferences configured by admin
 * @returns {{ totalScore: number, breakdown: Object, details: Array<string> }}
 */
export const calculateSoftScore = (entries = [], options = {}) => {
  const weights = { ...DEFAULT_WEIGHTS, ...options };

  let facultyGapsPenalty = 0;
  let studentGapsPenalty = 0;
  let excessiveConsecutivePenalty = 0;
  let subjectClusteringPenalty = 0;
  let morningLabPenalty = 0;
  let roomShufflingPenalty = 0;

  const details = [];

  // Group entries by day
  const entriesByDay = new Map();
  for (const entry of entries) {
    if (!entriesByDay.has(entry.day)) {
      entriesByDay.set(entry.day, []);
    }
    entriesByDay.get(entry.day).push(entry);
  }

  // 1. Division Schedule Analysis (Student gaps, consecutive periods, room shuffling)
  for (const [day, dayEntries] of entriesByDay.entries()) {
    // Sort chronologically by period
    const sorted = [...dayEntries].sort((a, b) => Number(a.period) - Number(b.period));
    const periods = sorted.map((e) => Number(e.period));

    if (periods.length > 1) {
      const minPeriod = periods[0];
      const maxPeriod = periods[periods.length - 1];

      // Student gaps: any unassigned period between the first and last period of the day
      const scheduledSet = new Set(periods);
      let dayStudentGaps = 0;
      for (let p = minPeriod; p <= maxPeriod; p++) {
        if (!scheduledSet.has(p)) {
          dayStudentGaps++;
        }
      }
      if (dayStudentGaps > 0) {
        studentGapsPenalty += dayStudentGaps * weights.studentGaps;
        details.push(`${day}: ${dayStudentGaps} student gap period(s) detected.`);
      }

      // Excessive consecutive periods (> 3 without a gap)
      let consecutiveCount = 1;
      for (let i = 1; i < periods.length; i++) {
        if (periods[i] === periods[i - 1] + 1) {
          consecutiveCount++;
          if (consecutiveCount > 3) {
            excessiveConsecutivePenalty += weights.excessiveConsecutive;
            details.push(`${day}: Students have ${consecutiveCount} consecutive periods without break.`);
          }
        } else {
          consecutiveCount = 1;
        }
      }

      // Room shuffling penalty: switching standard classrooms more than necessary
      const theoryRooms = sorted
        .filter((e) => !e.requiresLab && e.subjectType !== 'LAB')
        .map((e) => (e.classroom?._id || e.classroom)?.toString());
      const uniqueTheoryRooms = new Set(theoryRooms);
      if (uniqueTheoryRooms.size > 2) {
        roomShufflingPenalty += (uniqueTheoryRooms.size - 2) * weights.excessiveRoomShuffling;
      }
    }

    // Subject clustering on same day: multiple theory periods of same subject
    const subjectCountsThisDay = new Map();
    for (const entry of sorted) {
      const subId = (entry.subject?._id || entry.subject)?.toString();
      const isLab = entry.requiresLab || entry.subjectType === 'LAB';
      if (!isLab && subId) {
        subjectCountsThisDay.set(subId, (subjectCountsThisDay.get(subId) || 0) + 1);
      }
    }
    for (const [subId, count] of subjectCountsThisDay.entries()) {
      if (count > 1) {
        subjectClusteringPenalty += (count - 1) * weights.subjectClustering;
        details.push(`${day}: Subject assigned ${count} theory periods on the same day.`);
      }
    }

    // Morning lab preference: labs scheduled in period >= 4 incur penalty
    for (const entry of sorted) {
      const isLab = entry.requiresLab || entry.subjectType === 'LAB';
      if (isLab && Number(entry.period) >= 4) {
        morningLabPenalty += weights.morningLabPenalty;
        details.push(`${day} Period ${entry.period}: Lab scheduled in afternoon.`);
      }
    }
  }

  // 2. Faculty Schedule Analysis (Faculty gaps & consecutive teaching)
  const facultyEntriesByDay = new Map(); // `${facId}_${day}` -> array of periods
  for (const entry of entries) {
    const facId = (entry.faculty?._id || entry.faculty)?.toString();
    if (!facId) continue;
    const key = `${facId}_${entry.day}`;
    if (!facultyEntriesByDay.has(key)) {
      facultyEntriesByDay.set(key, []);
    }
    facultyEntriesByDay.get(key).push(Number(entry.period));
  }

  for (const [key, rawPeriods] of facultyEntriesByDay.entries()) {
    const sortedPeriods = [...rawPeriods].sort((a, b) => a - b);
    if (sortedPeriods.length > 1) {
      const minP = sortedPeriods[0];
      const maxP = sortedPeriods[sortedPeriods.length - 1];
      const setP = new Set(sortedPeriods);
      let gaps = 0;
      for (let p = minP; p <= maxP; p++) {
        if (!setP.has(p)) {
          gaps++;
        }
      }
      if (gaps > 0) {
        facultyGapsPenalty += gaps * weights.facultyGaps;
      }

      // Consecutive teaching load > 3
      let facConsecutive = 1;
      for (let i = 1; i < sortedPeriods.length; i++) {
        if (sortedPeriods[i] === sortedPeriods[i - 1] + 1) {
          facConsecutive++;
          if (facConsecutive > 3) {
            excessiveConsecutivePenalty += weights.excessiveConsecutive;
          }
        } else {
          facConsecutive = 1;
        }
      }
    }
  }

  const totalScore =
    facultyGapsPenalty +
    studentGapsPenalty +
    excessiveConsecutivePenalty +
    subjectClusteringPenalty +
    morningLabPenalty +
    roomShufflingPenalty;

  return {
    totalScore,
    breakdown: {
      facultyGaps: facultyGapsPenalty,
      studentGaps: studentGapsPenalty,
      excessiveConsecutiveClasses: excessiveConsecutivePenalty,
      subjectClustering: subjectClusteringPenalty,
      morningLabPenalty,
      roomShufflingPenalty,
    },
    details,
  };
};
