import { Division } from '../models/Division.js';
import { Timetable } from '../models/Timetable.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getAllDivisions = async (req, res, next) => {
  try {
    const { department, search } = req.query;
    let query = {};

    if (department) {
      query.department = department;
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const divisions = await Division.find(query)
      .populate('department', 'name code')
      .sort({ semester: 1, name: 1 });

    return sendSuccess(res, divisions);
  } catch (error) {
    next(error);
  }
};

export const getDivisionById = async (req, res, next) => {
  try {
    const division = await Division.findById(req.params.id).populate('department');
    if (!division) {
      return sendError(res, 'Division not found.', 404);
    }
    return sendSuccess(res, division);
  } catch (error) {
    next(error);
  }
};

export const createDivision = async (req, res, next) => {
  try {
    const { name, department, semester, academicYear = '2025-2026', studentCount } = req.body;

    if (!name || !department || !semester || !studentCount) {
      return sendError(res, 'Name, department, semester, and student count are required.', 400);
    }

    const existing = await Division.findOne({
      name: name.trim().toUpperCase(),
      department,
      semester,
      academicYear,
    });

    if (existing) {
      return sendError(res, 'A division with this name, semester, and department already exists for this academic year.', 409);
    }

    const division = await Division.create({
      name: name.trim().toUpperCase(),
      department,
      semester: Number(semester),
      academicYear,
      studentCount: Number(studentCount),
    });

    const populated = await Division.findById(division._id).populate('department');
    return sendSuccess(res, populated, 'Division created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateDivision = async (req, res, next) => {
  try {
    const { name, department, semester, academicYear, studentCount } = req.body;
    const division = await Division.findById(req.params.id);
    if (!division) {
      return sendError(res, 'Division not found.', 404);
    }

    if (name) division.name = name.trim().toUpperCase();
    if (department) division.department = department;
    if (semester) division.semester = Number(semester);
    if (academicYear) division.academicYear = academicYear;
    if (studentCount !== undefined) division.studentCount = Number(studentCount);

    await division.save();
    const populated = await Division.findById(division._id).populate('department');
    return sendSuccess(res, populated, 'Division updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteDivision = async (req, res, next) => {
  try {
    const id = req.params.id;

    // Check associated timetables
    await Timetable.deleteMany({ division: id });

    const deleted = await Division.findByIdAndDelete(id);
    if (!deleted) {
      return sendError(res, 'Division not found.', 404);
    }

    return sendSuccess(res, null, 'Division deleted successfully.');
  } catch (error) {
    next(error);
  }
};
