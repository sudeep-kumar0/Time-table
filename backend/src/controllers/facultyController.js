import { Faculty } from '../models/Faculty.js';
import { Subject } from '../models/Subject.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getAllFaculty = async (req, res, next) => {
  try {
    const { department, search } = req.query;
    let query = {};

    if (department) {
      query.department = department;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    const faculty = await Faculty.find(query)
      .populate('department', 'name code')
      .populate('subjects', 'name code type')
      .sort({ name: 1 });

    return sendSuccess(res, faculty);
  } catch (error) {
    next(error);
  }
};

export const getFacultyById = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id)
      .populate('department')
      .populate('subjects');

    if (!faculty) {
      return sendError(res, 'Faculty member not found.', 404);
    }
    return sendSuccess(res, faculty);
  } catch (error) {
    next(error);
  }
};

export const createFaculty = async (req, res, next) => {
  try {
    const { name, employeeId, department, email, phone, subjects = [], availability = [], maxWeeklyHours = 20 } = req.body;

    if (!name || !employeeId || !department) {
      return sendError(res, 'Name, Employee ID, and Department are required.', 400);
    }

    const existing = await Faculty.findOne({ employeeId: employeeId.trim().toUpperCase() });
    if (existing) {
      return sendError(res, `Faculty with Employee ID '${employeeId}' already exists.`, 409);
    }

    const faculty = await Faculty.create({
      name: name.trim(),
      employeeId: employeeId.trim().toUpperCase(),
      department,
      email: email ? email.trim().toLowerCase() : '',
      phone: phone || '',
      subjects,
      availability,
      maxWeeklyHours: Number(maxWeeklyHours),
    });

    const populated = await Faculty.findById(faculty._id)
      .populate('department', 'name code')
      .populate('subjects', 'name code');

    return sendSuccess(res, populated, 'Faculty created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateFaculty = async (req, res, next) => {
  try {
    const { name, employeeId, department, email, phone, subjects, availability, maxWeeklyHours } = req.body;
    const faculty = await Faculty.findById(req.params.id);

    if (!faculty) {
      return sendError(res, 'Faculty member not found.', 404);
    }

    if (name) faculty.name = name.trim();
    if (employeeId) faculty.employeeId = employeeId.trim().toUpperCase();
    if (department) faculty.department = department;
    if (email !== undefined) faculty.email = email.trim().toLowerCase();
    if (phone !== undefined) faculty.phone = phone;
    if (subjects !== undefined) faculty.subjects = subjects;
    if (availability !== undefined) faculty.availability = availability;
    if (maxWeeklyHours !== undefined) faculty.maxWeeklyHours = Number(maxWeeklyHours);

    await faculty.save();

    const populated = await Faculty.findById(faculty._id)
      .populate('department', 'name code')
      .populate('subjects', 'name code');

    return sendSuccess(res, populated, 'Faculty updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const updateFacultyAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body;
    if (!Array.isArray(availability)) {
      return sendError(res, 'Availability must be an array of slots.', 400);
    }

    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return sendError(res, 'Faculty member not found.', 404);
    }

    faculty.availability = availability;
    await faculty.save();

    return sendSuccess(res, faculty.availability, 'Faculty availability updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteFaculty = async (req, res, next) => {
  try {
    const deleted = await Faculty.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return sendError(res, 'Faculty member not found.', 404);
    }

    // Clean up references in Subjects
    await Subject.updateMany(
      { facultyEligible: req.params.id },
      { $pull: { facultyEligible: req.params.id } }
    );

    return sendSuccess(res, null, 'Faculty deleted successfully.');
  } catch (error) {
    next(error);
  }
};
