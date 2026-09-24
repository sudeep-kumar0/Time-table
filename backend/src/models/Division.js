import mongoose from 'mongoose';

const divisionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Division name is required'],
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required'],
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 8,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      default: '2025-2026',
    },
    studentCount: {
      type: Number,
      required: [true, 'Student count is required'],
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness within academic year and semester
divisionSchema.index({ name: 1, department: 1, semester: 1, academicYear: 1 }, { unique: true });

export const Division = mongoose.model('Division', divisionSchema);
