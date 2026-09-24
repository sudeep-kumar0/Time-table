import { TimeSlot } from '../models/TimeSlot.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getAllTimeSlots = async (req, res, next) => {
  try {
    const { day } = req.query;
    let query = {};
    if (day) {
      query.day = day;
    }

    const slots = await TimeSlot.find(query).sort({ day: 1, periodNumber: 1 });
    return sendSuccess(res, slots);
  } catch (error) {
    next(error);
  }
};

export const createTimeSlot = async (req, res, next) => {
  try {
    const { day, periodNumber, startTime, endTime, isBreak, label } = req.body;

    if (!day || !periodNumber || !startTime || !endTime) {
      return sendError(res, 'Day, periodNumber, startTime, and endTime are required.', 400);
    }

    const existing = await TimeSlot.findOne({ day, periodNumber: Number(periodNumber) });
    if (existing) {
      return sendError(res, `Slot for ${day} Period ${periodNumber} already exists.`, 409);
    }

    const slot = await TimeSlot.create({
      day,
      periodNumber: Number(periodNumber),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      isBreak: Boolean(isBreak),
      label: label || '',
    });

    return sendSuccess(res, slot, 'Time slot created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateTimeSlot = async (req, res, next) => {
  try {
    const { startTime, endTime, isBreak, label } = req.body;
    const slot = await TimeSlot.findById(req.params.id);

    if (!slot) {
      return sendError(res, 'Time slot not found.', 404);
    }

    if (startTime) slot.startTime = startTime.trim();
    if (endTime) slot.endTime = endTime.trim();
    if (isBreak !== undefined) slot.isBreak = Boolean(isBreak);
    if (label !== undefined) slot.label = label;

    await slot.save();
    return sendSuccess(res, slot, 'Time slot updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteTimeSlot = async (req, res, next) => {
  try {
    const deleted = await TimeSlot.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return sendError(res, 'Time slot not found.', 404);
    }
    return sendSuccess(res, null, 'Time slot deleted successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk generate or reset standard Mon-Fri (6 periods/day) slots
 */
export const initializeDefaultTimeSlots = async (req, res, next) => {
  try {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const periodsTemplate = [
      { periodNumber: 1, startTime: '09:00', endTime: '10:00', isBreak: false, label: 'Period 1' },
      { periodNumber: 2, startTime: '10:00', endTime: '11:00', isBreak: false, label: 'Period 2' },
      { periodNumber: 3, startTime: '11:15', endTime: '12:15', isBreak: false, label: 'Period 3' },
      { periodNumber: 4, startTime: '12:15', endTime: '13:15', isBreak: false, label: 'Period 4' },
      { periodNumber: 5, startTime: '14:00', endTime: '15:00', isBreak: false, label: 'Period 5' },
      { periodNumber: 6, startTime: '15:00', endTime: '16:00', isBreak: false, label: 'Period 6' },
    ];

    const slotsToInsert = [];
    for (const day of days) {
      for (const p of periodsTemplate) {
        slotsToInsert.push({
          day,
          ...p,
        });
      }
    }

    // Upsert to avoid duplicate keys
    for (const item of slotsToInsert) {
      await TimeSlot.findOneAndUpdate(
        { day: item.day, periodNumber: item.periodNumber },
        item,
        { upsert: true, new: true }
      );
    }

    const allSlots = await TimeSlot.find().sort({ day: 1, periodNumber: 1 });
    return sendSuccess(res, allSlots, 'Default time slots initialized (Mon-Fri, 6 periods/day).');
  } catch (error) {
    next(error);
  }
};
