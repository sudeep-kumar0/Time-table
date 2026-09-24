import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { connectDB, getDbStatus } from './config/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import divisionRoutes from './routes/divisionRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import classroomRoutes from './routes/classroomRoutes.js';
import timeslotRoutes from './routes/timeslotRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import conflictRoutes from './routes/conflictRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import generationLogRoutes from './routes/generationLogRoutes.js';

const app = express();

// Middlewares
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = getDbStatus();
  res.json({
    status: 'ONLINE',
    service: 'SmartSchedule API Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: {
      configured: env.hasMongoUri,
      connected: dbStatus.isConnected,
      host: dbStatus.host,
    },
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/divisions', divisionRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/timeslots', timeslotRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/conflicts', conflictRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/generation-logs', generationLogRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  const port = env.PORT || 5000;

  if (env.hasMongoUri) {
    try {
      await connectDB();
    } catch (err) {
      console.error('Failed to connect to MongoDB on startup:', err.message);
    }
  } else {
    console.error('\n' + '='.repeat(70));
    console.error('⚠️  [NOTICE]: MONGODB_URI is not set in backend/.env.');
    console.error('   The server will start, but database operations require your Atlas URI.');
    console.error('   Add your connection string to backend/.env: MONGODB_URI=mongodb+srv://...');
    console.error('='.repeat(70) + '\n');
  }

  const server = app.listen(port, () => {
    console.log(`🚀 SmartSchedule backend running on http://localhost:${port}`);
    console.log(`⚡ API Healthcheck available at http://localhost:${port}/api/health`);
  });

  return server;
};

// Auto-start server unless running in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
