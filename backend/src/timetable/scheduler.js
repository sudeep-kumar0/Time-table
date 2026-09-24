import {
  makeSlotKey,
  makeDivisionSlotKey,
  makeFacultySlotKey,
  makeRoomSlotKey,
  sortTasksDifficultFirst,
} from './helpers.js';
import { canAssignSlot } from './constraintChecker.js';
import { calculateSoftScore } from './scoring.js';

const MAX_SEARCH_STEPS = 60000;
const MAX_SEARCH_TIME_MS = 12000;

/**
 * Intelligent Backtracking Constraint Satisfaction Solver.
 *
 * @param {Object} params
 * @param {Array<Object>} params.tasks - Scheduling tasks created by createSchedulingTasks
 * @param {Object} params.division - Division object
 * @param {Array<Object>} params.timeSlots - Available time slots in system
 * @param {Array<Object>} params.rooms - Available classrooms & labs
 * @param {Array<Object>} params.facultyList - Available faculty members
 * @param {Object} params.externalOccupied - External commitments from other divisions
 * @param {Object} [params.preferences] - Soft constraint preferences
 * @returns {{ success: boolean, entries?: Array<Object>, stepsCount: number, errorDetails?: Object }}
 */
export const runBacktrackingScheduler = ({
  tasks,
  division,
  timeSlots,
  rooms,
  facultyList,
  externalOccupied = { faculty: new Set(), rooms: new Set(), divisions: new Set() },
  preferences = {},
}) => {
  const startTime = Date.now();
  let stepCount = 0;

  // Build quick lookup maps
  const timeSlotsByDayPeriod = new Map();
  const daysList = [];
  const dayPeriodMap = new Map(); // day -> array of period numbers sorted

  for (const slot of timeSlots) {
    if (slot.isBreak) continue;
    const key = makeSlotKey(slot.day, slot.periodNumber);
    timeSlotsByDayPeriod.set(key, slot);

    if (!dayPeriodMap.has(slot.day)) {
      dayPeriodMap.set(slot.day, []);
      daysList.push(slot.day);
    }
    dayPeriodMap.get(slot.day).push(Number(slot.periodNumber));
  }

  // Sort period numbers for each day
  for (const [day, periods] of dayPeriodMap.entries()) {
    dayPeriodMap.set(day, periods.sort((a, b) => a - b));
  }

  // Sort tasks using Difficult-First heuristic (MRV / Labs first)
  const orderedTasks = sortTasksDifficultFirst(tasks);

  // State sets
  const divisionId = (division._id || division).toString();
  const divisionOccupied = new Set(externalOccupied.divisions || []);
  const facultyOccupied = new Set(externalOccupied.faculty || []);
  const roomOccupied = new Set(externalOccupied.rooms || []);

  // Track subject day distribution for soft heuristic scoring during branch exploration
  const subjectAssignedDays = new Map(); // subjectId -> Map<day, count>
  for (const t of orderedTasks) {
    if (!subjectAssignedDays.has(t.subjectId)) {
      subjectAssignedDays.set(t.subjectId, new Map());
    }
  }

  const assignedEntries = [];

  /**
   * Generates candidate (day, period, faculty, room) combinations for a given task,
   * sorted by soft constraint heuristic preference.
   */
  const getCandidateOptions = (task) => {
    const candidates = [];
    const isLab = task.requiresLab || task.subjectType === 'LAB';
    const dayCounts = subjectAssignedDays.get(task.subjectId) || new Map();

    for (const day of daysList) {
      const periods = dayPeriodMap.get(day) || [];

      for (let pIdx = 0; pIdx < periods.length; pIdx++) {
        const startPeriod = periods[pIdx];

        // If multi-period (e.g. lab), ensure consecutive period exists in sequence
        if (task.duration > 1) {
          const expectedEndPeriod = startPeriod + task.duration - 1;
          const hasConsecutive = periods.includes(expectedEndPeriod);
          if (!hasConsecutive) continue;
        }

        for (const faculty of task.eligibleFaculty) {
          for (const room of task.eligibleRooms) {
            // Quick check hard constraints
            const check = canAssignSlot({
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
            });

            if (check.valid) {
              // Calculate candidate heuristic score (lower is better)
              let heuristicScore = 0;

              // Heuristic 1: Spread subjects across days
              const timesThisDay = dayCounts.get(day) || 0;
              if (!isLab && timesThisDay > 0) {
                heuristicScore += 50 * timesThisDay; // Heavy penalty for repeating subject on same day
              }

              // Heuristic 2: Morning lab preference
              if (isLab) {
                if (preferences.preferMorningLabs !== false) {
                  heuristicScore += startPeriod * 10; // Earlier periods preferred for labs
                }
              }

              // Heuristic 3: Classroom reuse for theory
              if (!isLab && room.type === 'CLASSROOM') {
                heuristicScore -= 5; // Prefer standard classroom over taking lab room
              }

              candidates.push({
                day,
                startPeriod,
                faculty,
                room,
                heuristicScore,
              });
            }
          }
        }
      }
    }

    // Sort candidates so the most promising branch is explored first
    return candidates.sort((a, b) => a.heuristicScore - b.heuristicScore);
  };

  /**
   * Core recursive backtracking search.
   */
  const backtrack = (taskIndex) => {
    stepCount++;

    // Safeguard check
    if (stepCount > MAX_SEARCH_STEPS) {
      return { exhausted: true, reason: 'Search step limit exceeded.' };
    }
    if (Date.now() - startTime > MAX_SEARCH_TIME_MS) {
      return { exhausted: true, reason: 'Search time limit exceeded.' };
    }

    // Base Case: All tasks scheduled successfully
    if (taskIndex >= orderedTasks.length) {
      return { success: true };
    }

    const currentTask = orderedTasks[taskIndex];
    const candidateOptions = getCandidateOptions(currentTask);

    if (candidateOptions.length === 0) {
      // Dead end - must backtrack to previous task
      return { success: false, bottleneckTask: currentTask };
    }

    for (const option of candidateOptions) {
      const { day, startPeriod, faculty, room } = option;
      const duration = currentTask.duration;
      const facultyId = (faculty._id || faculty).toString();
      const roomId = (room._id || room).toString();

      // Apply Assignment
      const addedEntries = [];
      for (let offset = 0; offset < duration; offset++) {
        const period = startPeriod + offset;
        const slotKey = makeSlotKey(day, period);
        const slotObj = timeSlotsByDayPeriod.get(slotKey);

        divisionOccupied.add(makeDivisionSlotKey(divisionId, day, period));
        facultyOccupied.add(makeFacultySlotKey(facultyId, day, period));
        roomOccupied.add(makeRoomSlotKey(roomId, day, period));

        const entry = {
          day,
          period,
          startTime: slotObj?.startTime || '',
          endTime: slotObj?.endTime || '',
          subject: currentTask.subjectRef,
          faculty,
          classroom: room,
          division: division._id || division,
          requiresLab: currentTask.requiresLab,
          subjectType: currentTask.subjectType,
        };

        assignedEntries.push(entry);
        addedEntries.push(entry);
      }

      // Update subject-day tracking
      const subDayMap = subjectAssignedDays.get(currentTask.subjectId);
      subDayMap.set(day, (subDayMap.get(day) || 0) + 1);

      // Recurse to next task
      const result = backtrack(taskIndex + 1);
      if (result.success) {
        return { success: true };
      }

      // If search timeout, bubble up immediately
      if (result.exhausted) {
        return result;
      }

      // Undo Assignment (Backtrack)
      for (let offset = 0; offset < duration; offset++) {
        const period = startPeriod + offset;
        divisionOccupied.delete(makeDivisionSlotKey(divisionId, day, period));
        facultyOccupied.delete(makeFacultySlotKey(facultyId, day, period));
        roomOccupied.delete(makeRoomSlotKey(roomId, day, period));
        assignedEntries.pop();
      }

      subDayMap.set(day, (subDayMap.get(day) || 1) - 1);
      if (subDayMap.get(day) <= 0) {
        subDayMap.delete(day);
      }
    }

    // All candidates for this task failed
    return { success: false, bottleneckTask: currentTask };
  };

  const searchResult = backtrack(0);

  if (searchResult.success) {
    return {
      success: true,
      entries: assignedEntries,
      stepsCount: stepCount,
      durationMs: Date.now() - startTime,
    };
  }

  return {
    success: false,
    stepsCount: stepCount,
    durationMs: Date.now() - startTime,
    reason: searchResult.reason || 'Backtracking exhausted all candidate states.',
    bottleneckTask: searchResult.bottleneckTask,
  };
};

/**
 * Optimizes an existing valid timetable using iterative local search / neighborhood swap.
 * Guarantees zero hard constraint violations while minimizing soft constraint penalties.
 *
 * @param {Array<Object>} entries - Current valid timetable entries
 * @param {Object} options - Configuration, rooms, facultyList, division, preferences
 * @returns {{ optimizedEntries: Array<Object>, initialScore: number, finalScore: number, improvementsMade: number, timeMs: number }}
 */
export const optimizeTimetableEntries = (entries, {
  division,
  timeSlots,
  rooms,
  facultyList,
  externalOccupied = { faculty: new Set(), rooms: new Set(), divisions: new Set() },
  preferences = {},
  maxIterations = 50,
} = {}) => {
  const startOptTime = Date.now();
  let currentEntries = [...entries.map((e) => ({ ...e }))];
  let initialScoreObj = calculateSoftScore(currentEntries, preferences);
  let currentScore = initialScoreObj.totalScore;
  let improvementsMade = 0;

  const timeSlotsByDayPeriod = new Map();
  for (const slot of timeSlots) {
    if (!slot.isBreak) {
      timeSlotsByDayPeriod.set(makeSlotKey(slot.day, slot.periodNumber), slot);
    }
  }

  // Iterate local improvement steps
  for (let iter = 0; iter < maxIterations; iter++) {
    let foundImprovementThisRound = false;

    // Try swapping pairs of single-period theory entries across different days
    for (let i = 0; i < currentEntries.length; i++) {
      const entryA = currentEntries[i];
      if (entryA.requiresLab || entryA.subjectType === 'LAB') continue; // Preserve lab blocks

      for (let j = i + 1; j < currentEntries.length; j++) {
        const entryB = currentEntries[j];
        if (entryB.requiresLab || entryB.subjectType === 'LAB') continue;
        if (entryA.day === entryB.day && entryA.period === entryB.period) continue;

        // Candidate swap: exchange (day, period, startTime, endTime) of entryA and entryB
        const facAId = (entryA.faculty?._id || entryA.faculty)?.toString();
        const facBId = (entryB.faculty?._id || entryB.faculty)?.toString();
        const rmAId = (entryA.classroom?._id || entryA.classroom)?.toString();
        const rmBId = (entryB.classroom?._id || entryB.classroom)?.toString();

        // Check if facA and rmA are free at B's slot (excluding external)
        const facAConflictAtB = externalOccupied.faculty.has(`${facAId}_${entryB.day}_${entryB.period}`);
        const rmAConflictAtB = externalOccupied.rooms.has(`${rmAId}_${entryB.day}_${entryB.period}`);
        const facBConflictAtA = externalOccupied.faculty.has(`${facBId}_${entryA.day}_${entryA.period}`);
        const rmBConflictAtA = externalOccupied.rooms.has(`${rmBId}_${entryA.day}_${entryA.period}`);

        if (facAConflictAtB || rmAConflictAtB || facBConflictAtA || rmBConflictAtA) {
          continue;
        }

        // Create trial state
        const trialEntries = currentEntries.map((e, idx) => {
          if (idx === i) {
            return {
              ...e,
              day: entryB.day,
              period: entryB.period,
              startTime: entryB.startTime,
              endTime: entryB.endTime,
            };
          }
          if (idx === j) {
            return {
              ...e,
              day: entryA.day,
              period: entryA.period,
              startTime: entryA.startTime,
              endTime: entryA.endTime,
            };
          }
          return e;
        });

        // Evaluate candidate penalty
        const trialScoreObj = calculateSoftScore(trialEntries, preferences);
        if (trialScoreObj.totalScore < currentScore) {
          currentScore = trialScoreObj.totalScore;
          currentEntries = trialEntries;
          improvementsMade++;
          foundImprovementThisRound = true;
          break; // restart outer loop with improved state
        }
      }

      if (foundImprovementThisRound) break;
    }

    if (!foundImprovementThisRound) {
      // Reached local optimum
      break;
    }
  }

  const finalScoreObj = calculateSoftScore(currentEntries, preferences);

  return {
    optimizedEntries: currentEntries,
    initialScore: initialScoreObj.totalScore,
    finalScore: finalScoreObj.totalScore,
    breakdown: finalScoreObj.breakdown,
    improvementsMade,
    timeMs: Date.now() - startOptTime,
  };
};
