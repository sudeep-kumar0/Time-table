import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Faculty } from '../models/Faculty.js';
import { env } from '../config/env.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'ADMIN', facultyProfile } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 'Name, email, and password are required.', 400);
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return sendError(res, 'A user with this email address already exists.', 409);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role.toUpperCase(),
      facultyProfile: facultyProfile || null,
    });

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return sendSuccess(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
      'User registered successfully.',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required.', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).populate('facultyProfile');
    if (!user) {
      return sendError(res, 'Invalid email or password credentials.', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password credentials.', 401);
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return sendSuccess(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          facultyProfile: user.facultyProfile,
        },
        token,
      },
      'Logged in successfully.'
    );
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash').populate('facultyProfile');
    return sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};
