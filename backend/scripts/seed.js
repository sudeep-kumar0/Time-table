import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/env.js';
import { connectDB } from '../src/config/db.js';

import { User } from '../src/models/User.js';
import { Department } from '../src/models/Department.js';
import { Division } from '../src/models/Division.js';
import { Faculty } from '../src/models/Faculty.js';
import { Subject } from '../src/models/Subject.js';
import { Classroom } from '../src/models/Classroom.js';
import { TimeSlot } from '../src/models/TimeSlot.js';
import { Timetable } from '../src/models/Timetable.js';
import { GenerationLog } from '../src/models/GenerationLog.js';

const seedDatabase = async () => {
  if (!env.hasMongoUri) {
    console.error('\n' + '='.repeat(70));
    console.error('❌  [SEED ERROR]: Cannot seed database without MONGODB_URI.');
    console.error('   Please provide your MongoDB Atlas connection string in backend/.env:');
    console.error('   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/smartschedule');
    console.error('='.repeat(70) + '\n');
    process.exit(1);
  }

  try {
    await connectDB();
    console.log('🔄 Cleaning existing database collections...');

    await Promise.all([
      User.deleteMany(),
      Department.deleteMany(),
      Division.deleteMany(),
      Faculty.deleteMany(),
      Subject.deleteMany(),
      Classroom.deleteMany(),
      TimeSlot.deleteMany(),
      Timetable.deleteMany(),
      GenerationLog.deleteMany(),
    ]);

    console.log('🌱 Seeding Time Slots (Monday - Friday, 6 periods/day)...');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const periodsTemplate = [
      { periodNumber: 1, startTime: '09:00', endTime: '10:00', label: 'Period 1' },
      { periodNumber: 2, startTime: '10:00', endTime: '11:00', label: 'Period 2' },
      { periodNumber: 3, startTime: '11:15', endTime: '12:15', label: 'Period 3' },
      { periodNumber: 4, startTime: '12:15', endTime: '13:15', label: 'Period 4' },
      { periodNumber: 5, startTime: '14:00', endTime: '15:00', label: 'Period 5' },
      { periodNumber: 6, startTime: '15:00', endTime: '16:00', label: 'Period 6' },
    ];

    const timeSlotsToInsert = [];
    for (const day of days) {
      for (const p of periodsTemplate) {
        timeSlotsToInsert.push({
          day,
          periodNumber: p.periodNumber,
          startTime: p.startTime,
          endTime: p.endTime,
          isBreak: false,
          label: p.label,
        });
      }
    }
    await TimeSlot.insertMany(timeSlotsToInsert);

    console.log('🌱 Seeding Departments...');
    const [deptISE, deptCSE, deptECE] = await Department.insertMany([
      { name: 'Information Science & Engineering', code: 'ISE', description: 'Department of Information Science & Engineering' },
      { name: 'Computer Science & Engineering', code: 'CSE', description: 'Department of Computer Science & Engineering' },
      { name: 'Electronics & Communication Engineering', code: 'ECE', description: 'Department of Electronics & Communication' },
    ]);

    console.log('🌱 Seeding Classrooms & Laboratories...');
    const classrooms = await Classroom.insertMany([
      { name: 'Lecture Hall 101', roomNumber: 'LH-101', type: 'CLASSROOM', capacity: 70, building: 'Academic Block A', floor: 1 },
      { name: 'Lecture Hall 102', roomNumber: 'LH-102', type: 'CLASSROOM', capacity: 75, building: 'Academic Block A', floor: 1 },
      { name: 'Lecture Hall 201', roomNumber: 'LH-201', type: 'CLASSROOM', capacity: 65, building: 'Academic Block A', floor: 2 },
      { name: 'Classroom 301', roomNumber: 'CR-301', type: 'CLASSROOM', capacity: 60, building: 'Academic Block B', floor: 3 },
      { name: 'Seminar Hall 401', roomNumber: 'SH-401', type: 'CLASSROOM', capacity: 80, building: 'Academic Block B', floor: 4 },
      // 2 Designated Laboratories
      { name: 'Database & Systems Lab', roomNumber: 'LAB-101', type: 'LAB', capacity: 65, building: 'IT Complex', floor: 1 },
      { name: 'Advanced Web & AI Lab', roomNumber: 'LAB-102', type: 'LAB', capacity: 60, building: 'IT Complex', floor: 2 },
    ]);

    console.log('🌱 Seeding Faculty (8+ members with specific availability)...');
    const facultyList = await Faculty.insertMany([
      {
        name: 'Dr. Ramesh Kumar',
        employeeId: 'FAC001',
        department: deptISE._id,
        email: 'ramesh.kumar@smartschedule.edu',
        phone: '+91 98765 43210',
        maxWeeklyHours: 18,
        availability: [], // Fully available
      },
      {
        name: 'Prof. Priya Sharma',
        employeeId: 'FAC002',
        department: deptISE._id,
        email: 'priya.sharma@smartschedule.edu',
        phone: '+91 98765 43211',
        maxWeeklyHours: 16,
        availability: [
          { day: 'Monday', periodNumber: 1, isAvailable: false },
          { day: 'Wednesday', periodNumber: 6, isAvailable: false },
        ],
      },
      {
        name: 'Dr. Amit Patel',
        employeeId: 'FAC003',
        department: deptISE._id,
        email: 'amit.patel@smartschedule.edu',
        phone: '+91 98765 43212',
        maxWeeklyHours: 20,
        availability: [
          { day: 'Tuesday', periodNumber: 5, isAvailable: false },
        ],
      },
      {
        name: 'Prof. Sunita Rao',
        employeeId: 'FAC004',
        department: deptISE._id,
        email: 'sunita.rao@smartschedule.edu',
        phone: '+91 98765 43213',
        maxWeeklyHours: 18,
        availability: [],
      },
      {
        name: 'Dr. Vikramaditya Joshi',
        employeeId: 'FAC005',
        department: deptCSE._id,
        email: 'vikram.joshi@smartschedule.edu',
        phone: '+91 98765 43214',
        maxWeeklyHours: 20,
        availability: [],
      },
      {
        name: 'Prof. Ananya Sen',
        employeeId: 'FAC006',
        department: deptCSE._id,
        email: 'ananya.sen@smartschedule.edu',
        phone: '+91 98765 43215',
        maxWeeklyHours: 16,
        availability: [
          { day: 'Friday', periodNumber: 4, isAvailable: false },
        ],
      },
      {
        name: 'Prof. Rajesh Nair',
        employeeId: 'FAC007',
        department: deptECE._id,
        email: 'rajesh.nair@smartschedule.edu',
        phone: '+91 98765 43216',
        maxWeeklyHours: 18,
        availability: [],
      },
      {
        name: 'Dr. Kavita Hegde',
        employeeId: 'FAC008',
        department: deptISE._id,
        email: 'kavita.hegde@smartschedule.edu',
        phone: '+91 98765 43217',
        maxWeeklyHours: 18,
        availability: [
          { day: 'Thursday', periodNumber: 1, isAvailable: false },
        ],
      },
    ]);

    console.log('🌱 Seeding Subjects (Theory + Labs with periods and eligible faculty)...');
    const [facRamesh, facPriya, facAmit, facSunita, facVikram, facAnanya, facRajesh, facKavita] = facultyList;

    const subjects = await Subject.insertMany([
      {
        name: 'Java Programming',
        code: 'CS501',
        department: deptISE._id,
        type: 'THEORY',
        weeklyPeriods: 4,
        requiresLab: false,
        preferredConsecutivePeriods: 1,
        facultyEligible: [facPriya._id, facSunita._id],
      },
      {
        name: 'Database Management Systems',
        code: 'CS502',
        department: deptISE._id,
        type: 'THEORY',
        weeklyPeriods: 4,
        requiresLab: false,
        preferredConsecutivePeriods: 1,
        facultyEligible: [facRamesh._id, facKavita._id],
      },
      {
        name: 'Operating Systems',
        code: 'CS503',
        department: deptISE._id,
        type: 'THEORY',
        weeklyPeriods: 4,
        requiresLab: false,
        preferredConsecutivePeriods: 1,
        facultyEligible: [facAmit._id, facVikram._id],
      },
      {
        name: 'Computer Networks',
        code: 'CS504',
        department: deptISE._id,
        type: 'THEORY',
        weeklyPeriods: 3,
        requiresLab: false,
        preferredConsecutivePeriods: 1,
        facultyEligible: [facSunita._id, facPriya._id],
      },
      {
        name: 'Web Development',
        code: 'CS505',
        department: deptISE._id,
        type: 'THEORY',
        weeklyPeriods: 3,
        requiresLab: false,
        preferredConsecutivePeriods: 1,
        facultyEligible: [facKavita._id, facAnanya._id],
      },
      {
        name: 'Machine Learning',
        code: 'CS506',
        department: deptISE._id,
        type: 'THEORY',
        weeklyPeriods: 3,
        requiresLab: false,
        preferredConsecutivePeriods: 1,
        facultyEligible: [facVikram._id, facAmit._id],
      },
      {
        name: 'Software Engineering',
        code: 'CS507',
        department: deptISE._id,
        type: 'THEORY',
        weeklyPeriods: 3,
        requiresLab: false,
        preferredConsecutivePeriods: 1,
        facultyEligible: [facAnanya._id, facPriya._id],
      },
      // Practical Labs (2 consecutive periods each)
      {
        name: 'DBMS Lab',
        code: 'CS508L',
        department: deptISE._id,
        type: 'LAB',
        weeklyPeriods: 2,
        requiresLab: true,
        preferredConsecutivePeriods: 2,
        facultyEligible: [facRamesh._id],
      },
      {
        name: 'Web Development Lab',
        code: 'CS509L',
        department: deptISE._id,
        type: 'LAB',
        weeklyPeriods: 2,
        requiresLab: true,
        preferredConsecutivePeriods: 2,
        facultyEligible: [facKavita._id],
      },
    ]);

    // Link subjects to faculty records
    for (const sub of subjects) {
      await Faculty.updateMany(
        { _id: { $in: sub.facultyEligible } },
        { $addToSet: { subjects: sub._id } }
      );
    }

    console.log('🌱 Seeding Divisions (including realistic & intentionally impossible test scenario)...');
    const divisions = await Division.insertMany([
      {
        name: 'ISE-A',
        department: deptISE._id,
        semester: 5,
        academicYear: '2025-2026',
        studentCount: 60,
      },
      {
        name: 'ISE-B',
        department: deptISE._id,
        semester: 5,
        academicYear: '2025-2026',
        studentCount: 55,
      },
      {
        name: 'CSE-A',
        department: deptCSE._id,
        semester: 5,
        academicYear: '2025-2026',
        studentCount: 65,
      },
      // ⚠️ INTENTIONALLY IMPOSSIBLE TEST SCENARIO FOR INTERVIEW DEMO:
      // Student count is 95, but maximum laboratory capacity in college is 65!
      // When generating timetable for ISE-OVERSIZE, generator rejects and explains exact lab capacity failure!
      {
        name: 'ISE-OVERSIZE',
        department: deptISE._id,
        semester: 5,
        academicYear: '2025-2026',
        studentCount: 95,
      },
    ]);

    console.log('🌱 Seeding Users (Admin & Faculty)...');
    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('Admin@123', salt);
    const facultyHash = await bcrypt.hash('Faculty@123', salt);

    await User.create([
      {
        name: 'College Administrator',
        email: 'admin@smartschedule.edu',
        passwordHash: adminHash,
        role: 'ADMIN',
      },
      {
        name: 'Prof. Priya Sharma',
        email: 'priya.sharma@smartschedule.edu',
        passwordHash: facultyHash,
        role: 'FACULTY',
        facultyProfile: facPriya._id,
      },
    ]);

    console.log('\n' + '='.repeat(70));
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('======================================================================');
    console.log('Credentials seeded:');
    console.log('  Admin User:   admin@smartschedule.edu / Admin@123');
    console.log('  Faculty User: priya.sharma@smartschedule.edu / Faculty@123');
    console.log('');
    console.log('Divisions:');
    console.log('  • ISE-A (60 students) -> Valid target for generation');
    console.log('  • ISE-B (55 students) -> Valid target for generation');
    console.log('  • CSE-A (65 students) -> Valid target for generation');
    console.log('  • ISE-OVERSIZE (95 students) -> [INTERVIEW DEMO: Lab Capacity Conflict]');
    console.log('======================================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
