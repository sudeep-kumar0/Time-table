import mongoose from 'mongoose';

const timetableEntrySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true,
    },
    period: {
      type: Number,
      required: true,
      min: 1,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true,
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      required: true,
    },
    division: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Division',
      required: true,
    },
  },
  { _id: true }
);

const timetableSchema = new mongoose.Schema(
  {
    academicYear: {
      type: String,
      required: true,
      default: '2025-2026',
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    division: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Division',
      required: true,
    },
    entries: [timetableEntrySchema],
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    generationStats: {
      generationTime: { type: Number, default: 0 },
      softConstraintScore: { type: Number, default: 0 },
      hardConstraintViolations: { type: Number, default: 0 },
      sessionsScheduled: { type: Number, default: 0 },
      totalRequiredSessions: { type: Number, default: 0 },
      roomsUsed: [{ type: String }],
      facultyUsed: [{ type: String }],
      breakdown: {
        facultyGaps: { type: Number, default: 0 },
        studentGaps: { type: Number, default: 0 },
        excessiveConsecutiveClasses: { type: Number, default: 0 },
        subjectClustering: { type: Number, default: 0 },
        morningLabPenalty: { type: Number, default: 0 },
      },
    },
    optimizationHistory: [
      {
        optimizedAt: { type: Date, default: Date.now },
        previousScore: Number,
        newScore: Number,
        hardConstraintViolations: Number,
        details: String,
      },
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup
timetableSchema.index({ division: 1, academicYear: 1, semester: 1 });

export const Timetable = mongoose.model('Timetable', timetableSchema);
