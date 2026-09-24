import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar.jsx';
import { Modal } from '../components/Modal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { divisionService, departmentService } from '../services/dataService.js';
import { Plus, Search, Edit2, Trash2, Users2, Filter } from 'lucide-react';

export const Divisions = () => {
  const [divisions, setDivisions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDivision, setEditingDivision] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    department: '',
    semester: 5,
    academicYear: '2025-2026',
    studentCount: 60,
  });

  const toast = useToast();

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    loadDivisions();
  }, [search, selectedDeptFilter]);

  const loadDepartments = async () => {
    try {
      const data = await departmentService.getAll();
      setDepartments(data || []);
      if (data && data.length > 0 && !formData.department) {
        setFormData((prev) => ({ ...prev, department: data[0]._id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadDivisions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedDeptFilter) params.department = selectedDeptFilter;
      const data = await divisionService.getAll(params);
      setDivisions(data || []);
    } catch (err) {
      toast.error('Failed to load divisions.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (div = null) => {
    if (div) {
      setEditingDivision(div);
      setFormData({
        name: div.name,
        department: div.department?._id || div.department,
        semester: div.semester,
        academicYear: div.academicYear || '2025-2026',
        studentCount: div.studentCount,
      });
    } else {
      setEditingDivision(null);
      setFormData({
        name: '',
        department: departments[0]?._id || '',
        semester: 5,
        academicYear: '2025-2026',
        studentCount: 60,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDivision) {
        await divisionService.update(editingDivision._id, formData);
        toast.success('Division updated successfully.');
      } else {
        await divisionService.create(formData);
        toast.success('Division created successfully.');
      }
      setIsModalOpen(false);
      loadDivisions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving division.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete division "${name}"?`)) return;
    try {
      await divisionService.delete(id);
      toast.success('Division deleted successfully.');
      loadDivisions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting division.');
    }
  };

  return (
    <div className="space-y-6">
      <Navbar
        title="Student Divisions"
        subtitle="Configure student divisions, batch capacities, semesters, and departments"
        actions={
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Division
          </button>
        }
      />

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search divisions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
          </div>

          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-700 font-medium focus:outline-brand-500"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500 font-semibold">{divisions.length} Division(s)</span>
      </div>

      {/* Divisions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Division Name</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Semester</th>
              <th className="py-3 px-4">Student Count</th>
              <th className="py-3 px-4">Academic Year</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400">Loading divisions...</td>
              </tr>
            ) : divisions.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400">No divisions registered yet.</td>
              </tr>
            ) : (
              divisions.map((div) => (
                <tr key={div._id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <Users2 className="w-4 h-4 text-brand-600" />
                    {div.name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {div.department?.name || '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-100">
                      Sem {div.semester}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {div.studentCount} Students
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono">
                    {div.academicYear}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenModal(div)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        title="Edit Division"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(div._id, div.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Division"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDivision ? 'Edit Division' : 'Add Division'}
        subtitle="Define division name, cohort student count, and semester"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Division Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ISE-A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Department *
              </label>
              <select
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              >
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Semester (1 - 8) *
              </label>
              <input
                type="number"
                min="1"
                max="8"
                required
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Student Count (Capacity Check) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.studentCount}
                onChange={(e) => setFormData({ ...formData, studentCount: e.target.value })}
                className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Academic Year *
              </label>
              <input
                type="text"
                required
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-xs"
            >
              {editingDivision ? 'Update Division' : 'Create Division'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
