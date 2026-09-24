import { Classroom } from '../models/Classroom.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getAllClassrooms = async (req, res, next) => {
  try {
    const { type, minCapacity, search } = req.query;
    let query = {};

    if (type) {
      query.type = type.toUpperCase();
    }
    if (minCapacity) {
      query.capacity = { $gte: Number(minCapacity) };
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { roomNumber: { $regex: search, $options: 'i' } },
        { building: { $regex: search, $options: 'i' } },
      ];
    }

    const classrooms = await Classroom.find(query).sort({ roomNumber: 1 });
    return sendSuccess(res, classrooms);
  } catch (error) {
    next(error);
  }
};

export const getClassroomById = async (req, res, next) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return sendError(res, 'Classroom not found.', 404);
    }
    return sendSuccess(res, classroom);
  } catch (error) {
    next(error);
  }
};

export const createClassroom = async (req, res, next) => {
  try {
    const { name, roomNumber, type = 'CLASSROOM', capacity, building, floor, availability = [] } = req.body;

    if (!name || !roomNumber || !capacity) {
      return sendError(res, 'Name, room number, and capacity are required.', 400);
    }

    const existing = await Classroom.findOne({ roomNumber: roomNumber.trim().toUpperCase() });
    if (existing) {
      return sendError(res, `Classroom with room number '${roomNumber}' already exists.`, 409);
    }

    const classroom = await Classroom.create({
      name: name.trim(),
      roomNumber: roomNumber.trim().toUpperCase(),
      type: type.toUpperCase(),
      capacity: Number(capacity),
      building: building || 'Main Block',
      floor: floor || 1,
      availability,
    });

    return sendSuccess(res, classroom, 'Classroom created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateClassroom = async (req, res, next) => {
  try {
    const { name, roomNumber, type, capacity, building, floor, availability } = req.body;
    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return sendError(res, 'Classroom not found.', 404);
    }

    if (name) classroom.name = name.trim();
    if (roomNumber) classroom.roomNumber = roomNumber.trim().toUpperCase();
    if (type) classroom.type = type.toUpperCase();
    if (capacity !== undefined) classroom.capacity = Number(capacity);
    if (building !== undefined) classroom.building = building;
    if (floor !== undefined) classroom.floor = Number(floor);
    if (availability !== undefined) classroom.availability = availability;

    await classroom.save();
    return sendSuccess(res, classroom, 'Classroom updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const updateClassroomAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body;
    if (!Array.isArray(availability)) {
      return sendError(res, 'Availability must be an array of slots.', 400);
    }

    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return sendError(res, 'Classroom not found.', 404);
    }

    classroom.availability = availability;
    await classroom.save();

    return sendSuccess(res, classroom.availability, 'Classroom availability updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteClassroom = async (req, res, next) => {
  try {
    const deleted = await Classroom.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return sendError(res, 'Classroom not found.', 404);
    }
    return sendSuccess(res, null, 'Classroom deleted successfully.');
  } catch (error) {
    next(error);
  }
};
