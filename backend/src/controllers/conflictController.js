import { Timetable } from '../models/Timetable.js';
import { Faculty } from '../models/Faculty.js';
import { Classroom } from '../models/Classroom.js';
import { sendSuccess } from '../utils/response.js';
import { isFacultyAvailableForSlot, isRoomAvailableForSlot } from '../timetable/helpers.js';

export const getConflicts = async (req, res, next) => {
  try {
    const { academicYear = '2025-2026' } = req.query;

    const timetables = await Timetable.find({
      academicYear,
      status: 'ACTIVE',
    })
      .populate('division')
      .populate('entries.subject')
      .populate('entries.faculty')
      .populate('entries.classroom');

    const facultyList = await Faculty.find();
    const classrooms = await Classroom.find();

    const facultyMap = new Map(facultyList.map((f) => [f._id.toString(), f]));
    const roomMap = new Map(classrooms.map((r) => [r._id.toString(), r]));

    const conflicts = [];

    // Map: `${facultyId}_${day}_${period}` -> array of entries
    const facultySlotAllocations = new Map();
    // Map: `${roomId}_${day}_${period}` -> array of entries
    const roomSlotAllocations = new Map();

    for (const tt of timetables) {
      const divisionName = tt.division?.name || 'Unknown Division';
      const studentCount = tt.division?.studentCount || 0;

      for (const entry of tt.entries || []) {
        const facId = (entry.faculty?._id || entry.faculty)?.toString();
        const rmId = (entry.classroom?._id || entry.classroom)?.toString();
        const facObj = facultyMap.get(facId) || entry.faculty;
        const rmObj = roomMap.get(rmId) || entry.classroom;
        const subObj = entry.subject;

        const info = {
          timetableId: tt._id,
          division: divisionName,
          subject: subObj?.name || 'Unknown Subject',
          faculty: facObj?.name || 'Unknown Faculty',
          room: rmObj?.roomNumber || 'Unknown Room',
          day: entry.day,
          period: entry.period,
          startTime: entry.startTime,
          endTime: entry.endTime,
        };

        // 1. Cross-Division Faculty Conflict
        if (facId) {
          const facKey = `${facId}_${entry.day}_${entry.period}`;
          if (!facultySlotAllocations.has(facKey)) {
            facultySlotAllocations.set(facKey, []);
          }
          facultySlotAllocations.get(facKey).push(info);
        }

        // 2. Cross-Division Room Conflict
        if (rmId) {
          const rmKey = `${rmId}_${entry.day}_${entry.period}`;
          if (!roomSlotAllocations.has(rmKey)) {
            roomSlotAllocations.set(rmKey, []);
          }
          roomSlotAllocations.get(rmKey).push(info);
        }

        // 3. Room Capacity Violation
        if (rmObj && rmObj.capacity < studentCount) {
          conflicts.push({
            id: `cap_${tt._id}_${entry.day}_${entry.period}`,
            type: 'Capacity Violation',
            severity: 'HIGH',
            subject: subObj?.name,
            division: divisionName,
            faculty: facObj?.name,
            room: `${rmObj.roomNumber} (Cap: ${rmObj.capacity})`,
            day: entry.day,
            period: entry.period,
            time: `${entry.startTime} - ${entry.endTime}`,
            explanation: `Classroom ${rmObj.roomNumber} capacity (${rmObj.capacity}) is insufficient for ${divisionName} (${studentCount} students).`,
            suggestedAction: 'Reassign this session to an auditorium or larger lecture hall.',
          });
        }

        // 4. Lab Requirement Violation
        if (subObj && (subObj.requiresLab || subObj.type === 'LAB') && rmObj && rmObj.type !== 'LAB') {
          conflicts.push({
            id: `lab_${tt._id}_${entry.day}_${entry.period}`,
            type: 'Lab Requirement Violation',
            severity: 'HIGH',
            subject: subObj.name,
            division: divisionName,
            faculty: facObj?.name,
            room: rmObj.roomNumber,
            day: entry.day,
            period: entry.period,
            time: `${entry.startTime} - ${entry.endTime}`,
            explanation: `Practical course "${subObj.name}" is scheduled in standard ${rmObj.type} instead of a designated Laboratory.`,
            suggestedAction: 'Move class to a computer or hardware laboratory.',
          });
        }

        // 5. Faculty Availability Violation
        if (facObj && !isFacultyAvailableForSlot(facObj, entry.day, entry.period)) {
          conflicts.push({
            id: `fac_avail_${tt._id}_${entry.day}_${entry.period}`,
            type: 'Faculty Availability',
            severity: 'MEDIUM',
            subject: subObj?.name,
            division: divisionName,
            faculty: facObj.name,
            room: rmObj?.roomNumber,
            day: entry.day,
            period: entry.period,
            time: `${entry.startTime} - ${entry.endTime}`,
            explanation: `Faculty ${facObj.name} is marked as unavailable during ${entry.day} Period ${entry.period}.`,
            suggestedAction: 'Reschedule to a free period or update faculty availability matrix.',
          });
        }

        // 6. Room Availability Violation
        if (rmObj && !isRoomAvailableForSlot(rmObj, entry.day, entry.period)) {
          conflicts.push({
            id: `rm_avail_${tt._id}_${entry.day}_${entry.period}`,
            type: 'Room Availability',
            severity: 'MEDIUM',
            subject: subObj?.name,
            division: divisionName,
            faculty: facObj?.name,
            room: rmObj.roomNumber,
            day: entry.day,
            period: entry.period,
            time: `${entry.startTime} - ${entry.endTime}`,
            explanation: `Room ${rmObj.roomNumber} is reserved or unavailable during ${entry.day} Period ${entry.period}.`,
            suggestedAction: 'Select an available classroom slot.',
          });
        }
      }
    }

    // Process overlapping faculty allocations
    for (const [key, items] of facultySlotAllocations.entries()) {
      if (items.length > 1) {
        const first = items[0];
        const others = items.slice(1);
        conflicts.push({
          id: `fac_clash_${key}`,
          type: 'Faculty Conflict',
          severity: 'CRITICAL',
          subject: `${first.subject} & ${others.map((o) => o.subject).join(', ')}`,
          division: `${first.division} & ${others.map((o) => o.division).join(', ')}`,
          faculty: first.faculty,
          room: `${first.room} / ${others.map((o) => o.room).join(', ')}`,
          day: first.day,
          period: first.period,
          time: `${first.startTime} - ${first.endTime}`,
          explanation: `Faculty ${first.faculty} is double-booked on ${first.day} Period ${first.period} across divisions (${first.division} and ${others.map((o) => o.division).join(', ')}).`,
          suggestedAction: `Move ${others[0].subject} (${others[0].division}) to another available period.`,
        });
      }
    }

    // Process overlapping room allocations
    for (const [key, items] of roomSlotAllocations.entries()) {
      if (items.length > 1) {
        const first = items[0];
        const others = items.slice(1);
        conflicts.push({
          id: `rm_clash_${key}`,
          type: 'Classroom Conflict',
          severity: 'CRITICAL',
          subject: `${first.subject} & ${others.map((o) => o.subject).join(', ')}`,
          division: `${first.division} & ${others.map((o) => o.division).join(', ')}`,
          faculty: `${first.faculty} / ${others.map((o) => o.faculty).join(', ')}`,
          room: first.room,
          day: first.day,
          period: first.period,
          time: `${first.startTime} - ${first.endTime}`,
          explanation: `Classroom ${first.room} is simultaneously assigned to ${items.length} classes on ${first.day} Period ${first.period}.`,
          suggestedAction: `Reassign ${others[0].subject} to an unoccupied room.`,
        });
      }
    }

    return sendSuccess(res, {
      conflicts,
      totalConflicts: conflicts.length,
      hasActiveConflicts: conflicts.length > 0,
      criticalCount: conflicts.filter((c) => c.severity === 'CRITICAL').length,
    });
  } catch (error) {
    next(error);
  }
};
