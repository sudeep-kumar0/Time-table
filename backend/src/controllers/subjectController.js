import { Subject } from '../models/Subject.js';
import { Faculty } from '../models/Faculty.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getAllSubjects = async (req, res, next) => {
  try {
    const { department, type, search } = req.query;
    let query = {};

    if (department) {
      query.department = department;
    }
    if (type) {
      query.type = type.toUpperCase();
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const subjects = await Subject.find(query)
      .populate('department', 'name code')
      .populate('facultyEligible', 'name employeeId')
      .sort({ name: 1 });

    return sendSuccess(res, subjects);
  } catch (error) {
    next(error);
  }
};

export const getSubjectById = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('department')
      .populate('facultyEligible');

    if (!subject) {
      return sendError(res, 'Subject not found.', 404);
    }
    return sendSuccess(res, subject);
  } catch (error) {
    next(error);
  }
};

export const createSubject = async (req, res, next) => {
  try {
    const {
      name,
      code,
      department,
      type = 'THEORY',
      weeklyPeriods,
      requiresLab,
      preferredConsecutivePeriods,
      facultyEligible = [],
    } = req.body;

    if (!name || !code || !department || !weeklyPeriods) {
      return sendError(res, 'Name, code, department, and weekly periods are required.', 400);
    }

    const existing = await Subject.findOne({ code: code.trim().toUpperCase() });
    if (existing) {
      return sendError(res, `Subject with code '${code}' already exists.`, 409);
    }

    const isLab = type.toUpperCase() === 'LAB' || Boolean(requiresLab);
    const consecutive = preferredConsecutivePeriods || (isLab ? 2 : 1);

    const subject = await Subject.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      department,
      type: type.toUpperCase(),
      weeklyPeriods: Number(weeklyPeriods),
      requiresLab: isLab,
      preferredConsecutivePeriods: Number(consecutive),
      facultyEligible,
    });

    // If eligible faculty assigned, link subject to faculty profiles
    if (facultyEligible.length > 0) {
      await Faculty.updateMany(
        { _id: { $in: facultyEligible } },
        { $addToSet: { subjects: subject._id } }
      );
    }

    const populated = await Subject.findById(subject._id)
      .populate('department', 'name code')
      .populate('facultyEligible', 'name employeeId');

    return sendSuccess(res, populated, 'Subject created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateSubject = async (req, res, next) => {
  try {
    const {
      name,
      code,
      department,
      type,
      weeklyPeriods,
      requiresLab,
      preferredConsecutivePeriods,
      facultyEligible,
    } = req.body;

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return sendError(res, 'Subject not found.', 404);
    }

    if (name) subject.name = name.trim();
    if (code) subject.code = code.trim().toUpperCase();
    if (department) subject.department = department;
    if (type) subject.type = type.toUpperCase();
    if (weeklyPeriods !== undefined) subject.weeklyPeriods = Number(weeklyPeriods);
    if (requiresLab !== undefined) subject.requiresLab = Boolean(requiresLab);
    if (preferredConsecutivePeriods !== undefined) {
      subject.preferredConsecutivePeriods = Number(preferredConsecutivePeriods);
    }
    if (facultyEligible !== undefined) {
      subject.facultyEligible = facultyEligible;
      // Sync with faculty
      await Faculty.updateMany(
        { _id: { $in: facultyEligible } },
        { $addToSet: { subjects: subject._id } }
      );
    }

    await subject.save();

    const populated = await Subject.findById(subject._id)
      .populate('department', 'name code')
      .populate('facultyEligible', 'name employeeId');

    return sendSuccess(res, populated, 'Subject updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteSubject = async (req, res, next) => {
  try {
    const deleted = await Subject.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return sendError(res, 'Subject not found.', 404);
    }

    // Clean references
    await Faculty.updateMany(
      { subjects: req.params.id },
      { $pull: { subjects: req.params.id } }
    );

    return sendSuccess(res, null, 'Subject deleted successfully.');
  } catch (error) {
    next(error);
  }
};
