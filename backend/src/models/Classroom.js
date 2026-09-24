import mongoose from 'mongoose';

const availabilitySlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true,
    },
    periodNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const classroomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Classroom name is required'],
      trim: true,
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['CLASSROOM', 'LAB'],
      default: 'CLASSROOM',
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: 1,
    },
    building: {
      type: String,
      default: 'Main Block',
      trim: true,
    },
    floor: {
      type: Number,
      default: 1,
    },
    availability: [availabilitySlotSchema],
  },
  {
    timestamps: true,
  }
);

export const Classroom = mongoose.model('Classroom', classroomSchema);
