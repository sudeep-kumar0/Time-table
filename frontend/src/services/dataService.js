import api from './api.js';

export const departmentService = {
  getAll: (params) => api.get('/departments', { params }).then((r) => r.data.data),
  getById: (id) => api.get(`/departments/${id}`).then((r) => r.data.data),
  create: (data) => api.post('/departments', data).then((r) => r.data.data),
  update: (id, data) => api.put(`/departments/${id}`, data).then((r) => r.data.data),
  delete: (id) => api.delete(`/departments/${id}`).then((r) => r.data.data),
};

export const divisionService = {
  getAll: (params) => api.get('/divisions', { params }).then((r) => r.data.data),
  getById: (id) => api.get(`/divisions/${id}`).then((r) => r.data.data),
  create: (data) => api.post('/divisions', data).then((r) => r.data.data),
  update: (id, data) => api.put(`/divisions/${id}`, data).then((r) => r.data.data),
  delete: (id) => api.delete(`/divisions/${id}`).then((r) => r.data.data),
};

export const facultyService = {
  getAll: (params) => api.get('/faculty', { params }).then((r) => r.data.data),
  getById: (id) => api.get(`/faculty/${id}`).then((r) => r.data.data),
  create: (data) => api.post('/faculty', data).then((r) => r.data.data),
  update: (id, data) => api.put(`/faculty/${id}`, data).then((r) => r.data.data),
  updateAvailability: (id, availability) => api.put(`/faculty/${id}/availability`, { availability }).then((r) => r.data.data),
  delete: (id) => api.delete(`/faculty/${id}`).then((r) => r.data.data),
};

export const subjectService = {
  getAll: (params) => api.get('/subjects', { params }).then((r) => r.data.data),
  getById: (id) => api.get(`/subjects/${id}`).then((r) => r.data.data),
  create: (data) => api.post('/subjects', data).then((r) => r.data.data),
  update: (id, data) => api.put(`/subjects/${id}`, data).then((r) => r.data.data),
  delete: (id) => api.delete(`/subjects/${id}`).then((r) => r.data.data),
};

export const classroomService = {
  getAll: (params) => api.get('/classrooms', { params }).then((r) => r.data.data),
  getById: (id) => api.get(`/classrooms/${id}`).then((r) => r.data.data),
  create: (data) => api.post('/classrooms', data).then((r) => r.data.data),
  update: (id, data) => api.put(`/classrooms/${id}`, data).then((r) => r.data.data),
  updateAvailability: (id, availability) => api.put(`/classrooms/${id}/availability`, { availability }).then((r) => r.data.data),
  delete: (id) => api.delete(`/classrooms/${id}`).then((r) => r.data.data),
};

export const timeslotService = {
  getAll: (params) => api.get('/timeslots', { params }).then((r) => r.data.data),
  create: (data) => api.post('/timeslots', data).then((r) => r.data.data),
  initialize: () => api.post('/timeslots/initialize').then((r) => r.data.data),
  update: (id, data) => api.put(`/timeslots/${id}`, data).then((r) => r.data.data),
  delete: (id) => api.delete(`/timeslots/${id}`).then((r) => r.data.data),
};

export const timetableService = {
  generate: (payload) => api.post('/timetables/generate', payload).then((r) => r.data),
  validate: (payload) => api.post('/timetables/validate', payload).then((r) => r.data.data),
  optimize: (id) => api.post(`/timetables/optimize/${id}`).then((r) => r.data.data),
  getAll: (params) => api.get('/timetables', { params }).then((r) => r.data.data),
  getById: (id) => api.get(`/timetables/${id}`).then((r) => r.data.data),
  delete: (id) => api.delete(`/timetables/${id}`).then((r) => r.data.data),
};

export const conflictService = {
  getConflicts: (params) => api.get('/conflicts', { params }).then((r) => r.data.data),
};

export const reportService = {
  getReports: (params) => api.get('/reports', { params }).then((r) => r.data.data),
};

export const historyService = {
  getLogs: (params) => api.get('/generation-logs', { params }).then((r) => r.data.data),
};
