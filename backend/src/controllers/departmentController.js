import { Department } from '../models/Department.js';
import { Division } from '../models/Division.js';
import { Faculty } from '../models/Faculty.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getAllDepartments = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
        ],
      };
    }
    const departments = await Department.find(query).sort({ name: 1 });
    return sendSuccess(res, departments);
  } catch (error) {
    next(error);
  }
};

export const getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return sendError(res, 'Department not found.', 404);
    }
    return sendSuccess(res, department);
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) {
      return sendError(res, 'Department name and code are required.', 400);
    }

    const existing = await Department.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return sendError(res, `Department with code '${code}' already exists.`, 409);
    }

    const department = await Department.create({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      description: description || '',
    });

    return sendSuccess(res, department, 'Department created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const { name, code, description } = req.body;
    const department = await Department.findById(req.params.id);
    if (!department) {
      return sendError(res, 'Department not found.', 404);
    }

    if (name) department.name = name.trim();
    if (code) department.code = code.toUpperCase().trim();
    if (description !== undefined) department.description = description;

    await department.save();
    return sendSuccess(res, department, 'Department updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    const id = req.params.id;

    const divisionsCount = await Division.countDocuments({ department: id });
    if (divisionsCount > 0) {
      return sendError(
        res,
        `Cannot delete department: ${divisionsCount} division(s) are associated with it.`,
        400
      );
    }

    const facultyCount = await Faculty.countDocuments({ department: id });
    if (facultyCount > 0) {
      return sendError(
        res,
        `Cannot delete department: ${facultyCount} faculty member(s) are linked to it.`,
        400
      );
    }

    const deleted = await Department.findByIdAndDelete(id);
    if (!deleted) {
      return sendError(res, 'Department not found.', 404);
    }

    return sendSuccess(res, null, 'Department deleted successfully.');
  } catch (error) {
    next(error);
  }
};
