import { Timetable } from '../models/Timetable.js';
import { Division } from '../models/Division.js';
import { Subject } from '../models/Subject.js';
import { Faculty } from '../models/Faculty.js';
import { Classroom } from '../models/Classroom.js';
import { TimeSlot } from '../models/TimeSlot.js';
import { GenerationLog } from '../models/GenerationLog.js';
import { generateTimetable } from '../timetable/generator.js';
import { validateTimetable } from '../timetable/constraintChecker.js';
import { optimizeTimetableEntries } from '../timetable/scheduler.js';
import { calculateSoftScore } from '../timetable/scoring.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const generate = async (req, res, next) => {
  const startTime = Date.now();
  try {
    const { divisionId, academicYear, semester, preferences = {} } = req.body;

    if (!divisionId) {
      return sendError(res, 'Division ID is required.', 400);
    }

    const division = await Division.findById(divisionId).populate('department');
    if (!division) {
      return sendError(res, 'Division not found.', 404);
    }

    const targetYear = academicYear || division.academicYear || '2025-2026';
    const targetSem = Number(semester || division.semester || 1);

    // 1. Fetch subjects for this division's department
    const subjects = await Subject.find({
      department: division.department._id || division.department,
    });

    if (subjects.length === 0) {
      return sendError(
        res,
        `No subjects found for department ${division.department.name || 'selected'}. Please add subjects first.`,
        400
      );
    }

    // 2. Fetch all classrooms, faculty, and timeslots
    const rooms = await Classroom.find();
    if (rooms.length === 0) {
      return sendError(res, 'No classrooms found in database. Please configure classrooms.', 400);
    }

    const facultyList = await Faculty.find().populate('subjects');
    if (facultyList.length === 0) {
      return sendError(res, 'No faculty members found in database. Please configure faculty.', 400);
    }

    let timeSlots = await TimeSlot.find({ isBreak: false }).sort({ day: 1, periodNumber: 1 });
    if (timeSlots.length === 0) {
      // Auto-initialize standard slots if empty
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      for (const day of days) {
        for (let p = 1; p <= 6; p++) {
          await TimeSlot.findOneAndUpdate(
            { day, periodNumber: p },
            {
              day,
              periodNumber: p,
              startTime: `0${8 + p}:00`,
              endTime: `0${9 + p}:00`,
              isBreak: false,
              label: `Period ${p}`,
            },
            { upsert: true }
          );
        }
      }
      timeSlots = await TimeSlot.find({ isBreak: false }).sort({ day: 1, periodNumber: 1 });
    }

    // 3. Fetch existing timetables of OTHER divisions to avoid resource clashes
    const existingTimetables = await Timetable.find({
      academicYear: targetYear,
      status: 'ACTIVE',
      division: { $ne: division._id },
    });

    // 4. Run the Intelligent Generator
    const generationResult = await generateTimetable({
      division,
      subjects,
      rooms,
      facultyList,
      timeSlots,
      existingTimetables,
      preferences,
      userId: req.user?._id,
    });

    const duration = Date.now() - startTime;

    if (!generationResult.success) {
      // Save audit log of failure
      await GenerationLog.create({
        requestedAt: new Date(),
        requestedBy: req.user?._id || null,
        division: division._id,
        success: false,
        hardConstraintViolations: generationResult.hardConstraintViolations || [],
        softConstraintViolations: [],
        generationTime: duration,
        explanation: generationResult.reason,
        failedReason: generationResult.problem,
        diagnostics: generationResult.diagnostics || {},
        suggestedActions: generationResult.suggestedActions || [],
      });

      return res.status(422).json({
        success: false,
        message: 'Timetable could not be generated due to conflicting constraints.',
        problem: generationResult.problem,
        reason: generationResult.reason,
        affectedDivision: division.name,
        suggestedActions: generationResult.suggestedActions,
        diagnostics: generationResult.diagnostics,
        generationTimeMs: duration,
      });
    }

    // 5. Successful generation - Save to Database
    // Archive any previous active timetable for this division & semester
    await Timetable.updateMany(
      { division: division._id, academicYear: targetYear, semester: targetSem },
      { status: 'ARCHIVED' }
    );

    const newTimetable = await Timetable.create({
      academicYear: targetYear,
      semester: targetSem,
      division: division._id,
      entries: generationResult.entries.map((e) => ({
        day: e.day,
        period: e.period,
        startTime: e.startTime,
        endTime: e.endTime,
        subject: e.subject._id || e.subject,
        faculty: e.faculty._id || e.faculty,
        classroom: e.classroom._id || e.classroom,
        division: division._id,
      })),
      generatedAt: new Date(),
      generatedBy: req.user?._id || null,
      generationStats: {
        generationTime: duration,
        softConstraintScore: generationResult.softConstraintScore,
        hardConstraintViolations: generationResult.hardViolationsCount,
        sessionsScheduled: generationResult.sessionsScheduled,
        totalRequiredSessions: generationResult.totalRequiredSessions,
        roomsUsed: generationResult.roomsUsed,
        facultyUsed: generationResult.facultyUsed,
        breakdown: generationResult.softScoreBreakdown,
      },
      status: 'ACTIVE',
    });

    // Save successful generation audit log
    await GenerationLog.create({
      requestedAt: new Date(),
      requestedBy: req.user?._id || null,
      division: division._id,
      success: true,
      hardConstraintViolations: [],
      softConstraintScore: generationResult.softConstraintScore,
      generationTime: duration,
      explanation: 'Timetable generated successfully with 0 hard constraint violations.',
      diagnostics: {
        sessionsScheduled: generationResult.sessionsScheduled,
        roomsUsed: generationResult.roomsUsed,
        facultyUsed: generationResult.facultyUsed,
      },
    });

    const populated = await Timetable.findById(newTimetable._id)
      .populate('division')
      .populate('entries.subject')
      .populate('entries.faculty')
      .populate('entries.classroom');

    return sendSuccess(
      res,
      {
        timetable: populated,
        stats: populated.generationStats,
        whyExplanations: generationResult.whyExplanations,
      },
      'Timetable generated successfully.',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const validate = async (req, res, next) => {
  try {
    const { timetableId, entries, divisionId } = req.body;

    let timetableEntries = entries;
    let targetDivisionId = divisionId;

    if (timetableId) {
      const existing = await Timetable.findById(timetableId)
        .populate('division')
        .populate('entries.subject')
        .populate('entries.faculty')
        .populate('entries.classroom');

      if (!existing) {
        return sendError(res, 'Timetable not found.', 404);
      }
      timetableEntries = existing.entries;
      targetDivisionId = existing.division._id;
    }

    if (!timetableEntries || !targetDivisionId) {
      return sendError(res, 'Timetable entries and division are required for validation.', 400);
    }

    const division = await Division.findById(targetDivisionId).populate('department');
    const subjects = await Subject.find({ department: division.department._id || division.department });
    const classrooms = await Classroom.find();
    const facultyList = await Faculty.find();

    const otherTimetables = await Timetable.find({
      status: 'ACTIVE',
      division: { $ne: division._id },
    });

    const externalOccupied = {
      faculty: new Set(),
      rooms: new Set(),
      divisions: new Set(),
    };
    for (const tt of otherTimetables) {
      for (const entry of tt.entries || []) {
        const facId = (entry.faculty?._id || entry.faculty)?.toString();
        const rmId = (entry.classroom?._id || entry.classroom)?.toString();
        if (facId) externalOccupied.faculty.add(`${facId}_${entry.day}_${entry.period}`);
        if (rmId) externalOccupied.rooms.add(`${rmId}_${entry.day}_${entry.period}`);
      }
    }

    const result = validateTimetable(
      { entries: timetableEntries },
      {
        division,
        subjects,
        classrooms,
        facultyList,
        externalOccupiedSlots: externalOccupied,
      }
    );

    const softScore = calculateSoftScore(timetableEntries);

    return sendSuccess(res, {
      isValid: result.isValid,
      hardViolationsCount: result.violationsCount,
      violations: result.violations,
      softScore: softScore.totalScore,
      softBreakdown: softScore.breakdown,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const optimize = async (req, res, next) => {
  const startOpt = Date.now();
  try {
    const { id } = req.params;
    const timetable = await Timetable.findById(id)
      .populate('division')
      .populate('entries.subject')
      .populate('entries.faculty')
      .populate('entries.classroom');

    if (!timetable) {
      return sendError(res, 'Timetable not found.', 404);
    }

    const division = timetable.division;
    const timeSlots = await TimeSlot.find({ isBreak: false });
    const rooms = await Classroom.find();
    const facultyList = await Faculty.find();

    const otherTimetables = await Timetable.find({
      _id: { $ne: timetable._id },
      academicYear: timetable.academicYear,
      status: 'ACTIVE',
    });

    const externalOccupied = {
      faculty: new Set(),
      rooms: new Set(),
      divisions: new Set(),
    };
    for (const tt of otherTimetables) {
      for (const entry of tt.entries || []) {
        const facId = (entry.faculty?._id || entry.faculty)?.toString();
        const rmId = (entry.classroom?._id || entry.classroom)?.toString();
        if (facId) externalOccupied.faculty.add(`${facId}_${entry.day}_${entry.period}`);
        if (rmId) externalOccupied.rooms.add(`${rmId}_${entry.day}_${entry.period}`);
      }
    }

    const previousScore = timetable.generationStats.softConstraintScore || 0;

    const optResult = optimizeTimetableEntries(timetable.entries, {
      division,
      timeSlots,
      rooms,
      facultyList,
      externalOccupied,
    });

    // Update timetable entries with optimized slots
    timetable.entries = optResult.optimizedEntries.map((e) => ({
      day: e.day,
      period: e.period,
      startTime: e.startTime,
      endTime: e.endTime,
      subject: e.subject._id || e.subject,
      faculty: e.faculty._id || e.faculty,
      classroom: e.classroom._id || e.classroom,
      division: division._id,
    }));

    timetable.generationStats.softConstraintScore = optResult.finalScore;
    timetable.generationStats.breakdown = optResult.breakdown;

    timetable.optimizationHistory.push({
      optimizedAt: new Date(),
      previousScore: optResult.initialScore,
      newScore: optResult.finalScore,
      hardConstraintViolations: 0,
      details: `Optimization performed ${optResult.improvementsMade} improvements in ${optResult.timeMs}ms.`,
    });

    await timetable.save();

    const populated = await Timetable.findById(timetable._id)
      .populate('division')
      .populate('entries.subject')
      .populate('entries.faculty')
      .populate('entries.classroom');

    return sendSuccess(res, {
      timetable: populated,
      before: {
        hardViolations: 0,
        softScore: optResult.initialScore,
      },
      after: {
        hardViolations: 0,
        softScore: optResult.finalScore,
      },
      improvementsMade: optResult.improvementsMade,
      optimizationDurationMs: Date.now() - startOpt,
    }, 'Timetable optimized successfully.');
  } catch (error) {
    next(error);
  }
};

export const getAllTimetables = async (req, res, next) => {
  try {
    const { division, academicYear, semester, status } = req.query;
    let query = {};

    if (division) query.division = division;
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = Number(semester);
    if (status) query.status = status;

    const timetables = await Timetable.find(query)
      .populate('division')
      .populate('generatedBy', 'name email')
      .sort({ generatedAt: -1 });

    return sendSuccess(res, timetables);
  } catch (error) {
    next(error);
  }
};

export const getTimetableById = async (req, res, next) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate('division')
      .populate('generatedBy', 'name email')
      .populate('entries.subject')
      .populate('entries.faculty')
      .populate('entries.classroom');

    if (!timetable) {
      return sendError(res, 'Timetable not found.', 404);
    }

    return sendSuccess(res, timetable);
  } catch (error) {
    next(error);
  }
};

export const deleteTimetable = async (req, res, next) => {
  try {
    const deleted = await Timetable.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return sendError(res, 'Timetable not found.', 404);
    }
    return sendSuccess(res, null, 'Timetable deleted successfully.');
  } catch (error) {
    next(error);
  }
};
