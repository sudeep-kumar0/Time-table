import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  createSchedulingTasks,
  sortTasksDifficultFirst,
  makeSlotKey,
} from '../src/timetable/helpers.js';
import { canAssignSlot, validateTimetable } from '../src/timetable/constraintChecker.js';
import { calculateSoftScore } from '../src/timetable/scoring.js';
import { runBacktrackingScheduler, optimizeTimetableEntries } from '../src/timetable/scheduler.js';
import { generateTimetable, diagnoseSchedulingFailure } from '../src/timetable/generator.js';

// --- MOCK TEST FIXTURES ---
const mockDepartment = { _id: 'dept_01', name: 'Information Science', code: 'ISE' };

const mockDivision = {
  _id: 'div_01',
  name: 'ISE-A',
  department: mockDepartment._id,
  semester: 5,
  academicYear: '2025-2026',
  studentCount: 60,
};

const mockFaculty = [
  {
    _id: 'fac_01',
    name: 'Dr. Ramesh Kumar',
    employeeId: 'FAC001',
    department: mockDepartment._id,
    subjects: ['sub_dbms', 'sub_dbms_lab'],
    availability: [], // available all periods
  },
  {
    _id: 'fac_02',
    name: 'Prof. Priya Sharma',
    employeeId: 'FAC002',
    department: mockDepartment._id,
    subjects: ['sub_java'],
    availability: [
      { day: 'Monday', periodNumber: 1, isAvailable: false }, // explicitly unavailable Monday P1
    ],
  },
  {
    _id: 'fac_03',
    name: 'Prof. Amit Patel',
    employeeId: 'FAC003',
    department: mockDepartment._id,
    subjects: ['sub_os'],
    availability: [],
  },
];

const mockRooms = [
  {
    _id: 'room_101',
    name: 'Lecture Hall 101',
    roomNumber: 'LH-101',
    type: 'CLASSROOM',
    capacity: 70,
    availability: [],
  },
  {
    _id: 'room_102',
    name: 'Classroom 102',
    roomNumber: 'CR-102',
    type: 'CLASSROOM',
    capacity: 50, // Capacity 50 < Division studentCount 60!
    availability: [],
  },
  {
    _id: 'room_lab1',
    name: 'Database Systems Lab',
    roomNumber: 'LAB-01',
    type: 'LAB',
    capacity: 65,
    availability: [
      { day: 'Friday', periodNumber: 5, isAvailable: false }, // unavailable Friday P5
    ],
  },
];

const mockSubjects = [
  {
    _id: 'sub_dbms',
    name: 'Database Management Systems',
    code: 'CS501',
    department: mockDepartment._id,
    type: 'THEORY',
    weeklyPeriods: 3,
    requiresLab: false,
    facultyEligible: ['fac_01'],
  },
  {
    _id: 'sub_java',
    name: 'Java Programming',
    code: 'CS502',
    department: mockDepartment._id,
    type: 'THEORY',
    weeklyPeriods: 3,
    requiresLab: false,
    facultyEligible: ['fac_02'],
  },
  {
    _id: 'sub_os',
    name: 'Operating Systems',
    code: 'CS503',
    department: mockDepartment._id,
    type: 'THEORY',
    weeklyPeriods: 3,
    requiresLab: false,
    facultyEligible: ['fac_03'],
  },
  {
    _id: 'sub_dbms_lab',
    name: 'DBMS Lab',
    code: 'CS504L',
    department: mockDepartment._id,
    type: 'LAB',
    weeklyPeriods: 2,
    requiresLab: true,
    preferredConsecutivePeriods: 2,
    facultyEligible: ['fac_01'],
  },
];

// 5 days x 5 periods = 25 slots
const mockTimeSlots = [];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
for (const day of days) {
  for (let p = 1; p <= 5; p++) {
    mockTimeSlots.push({
      _id: `slot_${day}_${p}`,
      day,
      periodNumber: p,
      startTime: `0${8 + p}:00`,
      endTime: `0${9 + p}:00`,
      isBreak: false,
    });
  }
}

describe('Timetable Engine Unit & Integration Tests', () => {

  describe('1. Task Creation & Difficult-First Ordering', () => {
    it('should create discrete scheduling tasks with lab blocks', () => {
      const tasks = createSchedulingTasks(mockSubjects, mockDivision.studentCount, mockRooms, mockFaculty);
      // Theory: 3 + 3 + 3 = 9 tasks (duration 1)
      // Lab: 2 periods = 1 task (duration 2)
      // Total tasks = 10
      assert.equal(tasks.length, 10);

      const labTasks = tasks.filter((t) => t.requiresLab);
      assert.equal(labTasks.length, 1);
      assert.equal(labTasks[0].duration, 2);
    });

    it('should sort difficult tasks first (Labs prioritized before single-period theory)', () => {
      const tasks = createSchedulingTasks(mockSubjects, mockDivision.studentCount, mockRooms, mockFaculty);
      const sorted = sortTasksDifficultFirst(tasks);

      // First task must be the 2-period lab
      assert.equal(sorted[0].requiresLab, true);
      assert.equal(sorted[0].duration, 2);
    });
  });

  describe('2. Hard Constraint Checks (canAssignSlot)', () => {
    const timeSlotsByDayPeriod = new Map(
      mockTimeSlots.map((s) => [makeSlotKey(s.day, s.periodNumber), s])
    );

    it('rejects room capacity violation when room capacity < division strength', () => {
      const smallRoom = mockRooms.find((r) => r.roomNumber === 'CR-102'); // cap 50 vs div 60
      const check = canAssignSlot({
        task: { subjectName: 'DBMS', duration: 1, requiresLab: false },
        day: 'Monday',
        startPeriod: 1,
        faculty: mockFaculty[0],
        room: smallRoom,
        division: mockDivision,
        divisionOccupied: new Set(),
        facultyOccupied: new Set(),
        roomOccupied: new Set(),
        timeSlotsByDayPeriod,
      });

      assert.equal(check.valid, false);
      assert.equal(check.constraint, 'ROOM_CAPACITY');
    });

    it('rejects assigning regular classroom to a subject requiring a laboratory', () => {
      const standardRoom = mockRooms.find((r) => r.type === 'CLASSROOM' && r.capacity >= 60);
      const check = canAssignSlot({
        task: { subjectName: 'DBMS Lab', duration: 2, requiresLab: true, subjectType: 'LAB' },
        day: 'Monday',
        startPeriod: 1,
        faculty: mockFaculty[0],
        room: standardRoom,
        division: mockDivision,
        divisionOccupied: new Set(),
        facultyOccupied: new Set(),
        roomOccupied: new Set(),
        timeSlotsByDayPeriod,
      });

      assert.equal(check.valid, false);
      assert.equal(check.constraint, 'LAB_REQUIREMENT');
    });

    it('rejects scheduling faculty during period marked unavailable', () => {
      const facPriya = mockFaculty.find((f) => f.employeeId === 'FAC002'); // unavailable Monday P1
      const qualifyingRoom = mockRooms.find((r) => r.type === 'CLASSROOM' && r.capacity >= 60);

      const check = canAssignSlot({
        task: { subjectName: 'Java', duration: 1, requiresLab: false },
        day: 'Monday',
        startPeriod: 1,
        faculty: facPriya,
        room: qualifyingRoom,
        division: mockDivision,
        divisionOccupied: new Set(),
        facultyOccupied: new Set(),
        roomOccupied: new Set(),
        timeSlotsByDayPeriod,
      });

      assert.equal(check.valid, false);
      assert.equal(check.constraint, 'FACULTY_UNAVAILABLE');
    });

    it('rejects scheduling classroom during period marked unavailable', () => {
      const labRoom = mockRooms.find((r) => r.roomNumber === 'LAB-01'); // unavailable Friday P5
      const check = canAssignSlot({
        task: { subjectName: 'DBMS Lab', duration: 1, requiresLab: true },
        day: 'Friday',
        startPeriod: 5,
        faculty: mockFaculty[0],
        room: labRoom,
        division: mockDivision,
        divisionOccupied: new Set(),
        facultyOccupied: new Set(),
        roomOccupied: new Set(),
        timeSlotsByDayPeriod,
      });

      assert.equal(check.valid, false);
      assert.equal(check.constraint, 'ROOM_UNAVAILABLE');
    });

    it('rejects faculty conflict when faculty is already booked', () => {
      const facultyOccupied = new Set(['fac_01_Monday_2']);
      const qualifyingRoom = mockRooms.find((r) => r.type === 'CLASSROOM' && r.capacity >= 60);

      const check = canAssignSlot({
        task: { subjectName: 'DBMS', duration: 1, requiresLab: false },
        day: 'Monday',
        startPeriod: 2,
        faculty: mockFaculty[0],
        room: qualifyingRoom,
        division: mockDivision,
        divisionOccupied: new Set(),
        facultyOccupied,
        roomOccupied: new Set(),
        timeSlotsByDayPeriod,
      });

      assert.equal(check.valid, false);
      assert.equal(check.constraint, 'FACULTY_CONFLICT');
    });

    it('rejects classroom conflict when classroom is already occupied', () => {
      const roomOccupied = new Set(['room_101_Tuesday_3']);
      const qualifyingRoom = mockRooms.find((r) => r._id === 'room_101');

      const check = canAssignSlot({
        task: { subjectName: 'DBMS', duration: 1, requiresLab: false },
        day: 'Tuesday',
        startPeriod: 3,
        faculty: mockFaculty[0],
        room: qualifyingRoom,
        division: mockDivision,
        divisionOccupied: new Set(),
        facultyOccupied: new Set(),
        roomOccupied,
        timeSlotsByDayPeriod,
      });

      assert.equal(check.valid, false);
      assert.equal(check.constraint, 'ROOM_CONFLICT');
    });

    it('rejects division conflict when division already has a class in that slot', () => {
      const divisionOccupied = new Set(['div_01_Wednesday_4']);
      const qualifyingRoom = mockRooms.find((r) => r.type === 'CLASSROOM' && r.capacity >= 60);

      const check = canAssignSlot({
        task: { subjectName: 'OS', duration: 1, requiresLab: false },
        day: 'Wednesday',
        startPeriod: 4,
        faculty: mockFaculty[2],
        room: qualifyingRoom,
        division: mockDivision,
        divisionOccupied,
        facultyOccupied: new Set(),
        roomOccupied: new Set(),
        timeSlotsByDayPeriod,
      });

      assert.equal(check.valid, false);
      assert.equal(check.constraint, 'DIVISION_CONFLICT');
    });
  });

  describe('3. End-to-End Generation & Backtracking', () => {
    it('successfully generates a timetable with zero hard constraint violations', async () => {
      const result = await generateTimetable({
        division: mockDivision,
        subjects: mockSubjects,
        rooms: mockRooms,
        facultyList: mockFaculty,
        timeSlots: mockTimeSlots,
        preferences: { preferMorningLabs: true },
      });

      assert.equal(result.success, true);
      assert.equal(result.hardViolationsCount, 0);
      assert.equal(result.entries.length, 11); // 3 + 3 + 3 + 2 = 11 periods total

      // Check lab placement
      const labEntries = result.entries.filter((e) => e.requiresLab || e.subjectType === 'LAB');
      assert.equal(labEntries.length, 2);
      assert.equal(labEntries[0].day, labEntries[1].day);
      assert.equal(Math.abs(labEntries[0].period - labEntries[1].period), 1);
      assert.equal(labEntries[0].classroom.type, 'LAB');
      assert.equal(labEntries[1].classroom.type, 'LAB');
    });

    it('respects external commitments from other division timetables', async () => {
      // Simulate another division (CSE-A) already occupying Prof. Ramesh Kumar on Monday Period 2
      const existingTimetables = [
        {
          division: { _id: 'div_cse' },
          entries: [
            {
              day: 'Monday',
              period: 2,
              faculty: { _id: 'fac_01' },
              classroom: { _id: 'room_101' },
            },
          ],
        },
      ];

      const result = await generateTimetable({
        division: mockDivision,
        subjects: mockSubjects,
        rooms: mockRooms,
        facultyList: mockFaculty,
        timeSlots: mockTimeSlots,
        existingTimetables,
      });

      assert.equal(result.success, true);
      // Verify Prof. Ramesh Kumar is never scheduled on Monday Period 2 in ISE-A
      const rameshMonP2 = result.entries.find(
        (e) => (e.faculty._id || e.faculty).toString() === 'fac_01' && e.day === 'Monday' && e.period === 2
      );
      assert.equal(rameshMonP2, undefined);
    });
  });

  describe('4. Impossible Constraint Diagnosis', () => {
    it('detects impossible scenario when laboratory capacity cannot fit division size', async () => {
      const largeDivision = {
        _id: 'div_large',
        name: 'ISE-Large',
        studentCount: 120, // 120 students, but max lab cap is 65!
      };

      const result = await generateTimetable({
        division: largeDivision,
        subjects: mockSubjects,
        rooms: mockRooms,
        facultyList: mockFaculty,
        timeSlots: mockTimeSlots,
      });

      assert.equal(result.success, false);
      assert.ok(result.diagnostics);
      assert.ok(result.problem.includes('laboratory'));
      assert.ok(result.suggestedActions.length > 0);
      assert.ok(result.reason.includes('120 students'));
    });

    it('detects impossible scenario when required periods exceed total available slots', async () => {
      // Create subjects requiring 40 periods when only 25 slots exist
      const heavySubjects = [
        {
          _id: 'sub_heavy',
          name: 'Heavy Computing',
          code: 'CS999',
          department: mockDepartment._id,
          type: 'THEORY',
          weeklyPeriods: 35, // 35 periods > 25 total slots!
          requiresLab: false,
          facultyEligible: ['fac_01'],
        },
      ];

      const result = await generateTimetable({
        division: mockDivision,
        subjects: heavySubjects,
        rooms: mockRooms,
        facultyList: mockFaculty,
        timeSlots: mockTimeSlots,
      });

      assert.equal(result.success, false);
      assert.ok(result.problem.includes('Total required periods'));
      assert.ok(result.suggestedActions.length > 0);
    });
  });

  describe('5. Independent Validation & Soft Scoring Optimization', () => {
    it('validates a clean timetable with zero errors', () => {
      const cleanTimetable = {
        entries: [
          {
            day: 'Monday',
            period: 1,
            subject: mockSubjects[0],
            faculty: mockFaculty[0],
            classroom: mockRooms[0],
            division: mockDivision,
          },
          {
            day: 'Tuesday',
            period: 1,
            subject: mockSubjects[1],
            faculty: mockFaculty[1],
            classroom: mockRooms[0],
            division: mockDivision,
          },
        ],
      };

      const res = validateTimetable(cleanTimetable, {
        division: mockDivision,
        subjects: [mockSubjects[0], mockSubjects[1]],
        classrooms: mockRooms,
        facultyList: mockFaculty,
      });

      // Both subjects have fewer periods than required here, so validation flags INSUFFICIENT_PERIODS
      assert.ok(res.violations.some((v) => v.type === 'INSUFFICIENT_PERIODS'));
    });

    it('calculates soft score penalties and performs local search optimization', () => {
      const generated = [
        {
          day: 'Monday',
          period: 1,
          subject: mockSubjects[0],
          faculty: mockFaculty[0],
          classroom: mockRooms[0],
        },
        {
          day: 'Monday',
          period: 3, // Gap at period 2!
          subject: mockSubjects[1],
          faculty: mockFaculty[1],
          classroom: mockRooms[0],
        },
      ];

      const initialScore = calculateSoftScore(generated);
      assert.ok(initialScore.totalScore > 0);
      assert.ok(initialScore.breakdown.studentGaps > 0);

      const opt = optimizeTimetableEntries(generated, {
        division: mockDivision,
        timeSlots: mockTimeSlots,
        rooms: mockRooms,
        facultyList: mockFaculty,
      });

      assert.ok(opt.finalScore <= opt.initialScore);
    });
  });

});
