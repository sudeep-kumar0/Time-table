import mongoose from 'mongoose';

const timeSlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: [true, 'Day is required'],
    },
    periodNumber: {
      type: Number,
      required: [true, 'Period number is required'],
      min: 1,
      max: 12,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required (e.g. 09:00)'],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (e.g. 10:00)'],
      trim: true,
    },
    isBreak: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness per day and periodNumber
timeSlotSchema.index({ day: 1, periodNumber: 1 }, { unique: true });

export const TimeSlot = mongoose.model('TimeSlot', timeSlotSchema);
