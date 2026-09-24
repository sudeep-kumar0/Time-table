import { GenerationLog } from '../models/GenerationLog.js';
import { sendSuccess } from '../utils/response.js';

export const getAllGenerationLogs = async (req, res, next) => {
  try {
    const { division, success } = req.query;
    let query = {};

    if (division) query.division = division;
    if (success !== undefined) query.success = success === 'true';

    const logs = await GenerationLog.find(query)
      .populate('division', 'name semester academicYear')
      .populate('requestedBy', 'name email')
      .sort({ requestedAt: -1 })
      .limit(100);

    return sendSuccess(res, logs);
  } catch (error) {
    next(error);
  }
};
