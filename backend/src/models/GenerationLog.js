import mongoose from 'mongoose';

const generationLogSchema = new mongoose.Schema(
  {
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    division: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Division',
      required: true,
    },
    success: {
      type: Boolean,
      required: true,
    },
    hardConstraintViolations: {
      type: Array,
      default: [],
    },
    softConstraintViolations: {
      type: Array,
      default: [],
    },
    softConstraintScore: {
      type: Number,
      default: 0,
    },
    generationTime: {
      type: Number,
      required: true,
    },
    explanation: {
      type: String,
      default: '',
    },
    failedReason: {
      type: String,
      default: '',
    },
    diagnostics: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    suggestedActions: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

generationLogSchema.index({ division: 1, requestedAt: -1 });

export const GenerationLog = mongoose.model('GenerationLog', generationLogSchema);
