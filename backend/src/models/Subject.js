import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Subject code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required'],
    },
    type: {
      type: String,
      enum: ['THEORY', 'LAB', 'TUTORIAL'],
      default: 'THEORY',
    },
    weeklyPeriods: {
      type: Number,
      required: [true, 'Weekly periods required'],
      min: 1,
      max: 15,
    },
    requiresLab: {
      type: Boolean,
      default: function () {
        return this.type === 'LAB';
      },
    },
    preferredConsecutivePeriods: {
      type: Number,
      default: function () {
        return this.type === 'LAB' ? 2 : 1;
      },
      min: 1,
      max: 4,
    },
    facultyEligible: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Subject = mongoose.model('Subject', subjectSchema);
