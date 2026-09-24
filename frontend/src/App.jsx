import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';

import { MainLayout } from './layouts/MainLayout.jsx';
import { AuthLayout } from './layouts/AuthLayout.jsx';

import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Departments } from './pages/Departments.jsx';
import { Divisions } from './pages/Divisions.jsx';
import { Faculty } from './pages/Faculty.jsx';
import { Subjects } from './pages/Subjects.jsx';
import { Classrooms } from './pages/Classrooms.jsx';
import { TimeSlots } from './pages/TimeSlots.jsx';
import { GenerateTimetable } from './pages/GenerateTimetable.jsx';
import { Timetables } from './pages/Timetables.jsx';
import { Conflicts } from './pages/Conflicts.jsx';
import { Reports } from './pages/Reports.jsx';
import { GenerationHistory } from './pages/GenerationHistory.jsx';
import { Settings } from './pages/Settings.jsx';
import { FacultyAvailability } from './pages/FacultyAvailability.jsx';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-xs font-semibold">
        Loading SmartSchedule...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Application Protected Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/timetables" element={<Timetables />} />
              <Route path="/conflicts" element={<Conflicts />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/history" element={<GenerationHistory />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/faculty-availability" element={<FacultyAvailability />} />

              {/* Admin Protected Routes */}
              <Route
                path="/departments"
                element={
                  <ProtectedRoute requireAdmin>
                    <Departments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/divisions"
                element={
                  <ProtectedRoute requireAdmin>
                    <Divisions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/faculty"
                element={
                  <ProtectedRoute requireAdmin>
                    <Faculty />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subjects"
                element={
                  <ProtectedRoute requireAdmin>
                    <Subjects />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/classrooms"
                element={
                  <ProtectedRoute requireAdmin>
                    <Classrooms />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/timeslots"
                element={
                  <ProtectedRoute requireAdmin>
                    <TimeSlots />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/generate"
                element={
                  <ProtectedRoute requireAdmin>
                    <GenerateTimetable />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Default Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
