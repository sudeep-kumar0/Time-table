import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar.jsx';
import { Modal } from '../components/Modal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { subjectService, departmentService, facultyService } from '../services/dataService.js';
import { Plus, Search, Edit2, Trash2, BookOpen, FlaskConical, Clock, Users } from 'lucide-react';

export const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: '',
    type: 'THEORY',
    weeklyPeriods: 4,
    requiresLab: false,
    preferredConsecutivePeriods: 1,
    facultyEligible: [],
  });

  const toast = useToast();

  useEffect(() => {
    loadAuxData();
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [search, typeFilter, selectedDeptFilter]);

  const loadAuxData = async () => {
    try {
      const [depts, facs] = await Promise.all([
        departmentService.getAll(),
        facultyService.getAll(),
      ]);
      setDepartments(depts || []);
      setFacultyList(facs || []);
      if (depts && depts.length > 0 && !formData.department) {
        setFormData((prev) => ({ ...prev, department: depts[0]._id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (selectedDeptFilter) params.department = selectedDeptFilter;
      const data = await subjectService.getAll(params);
      setSubjects(data || []);
    } catch (err) {
      toast.error('Failed to load subjects.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (sub = null) => {
    if (sub) {
      setEditingSubject(sub);
      setFormData({
        name: sub.name,
        code: sub.code,
        department: sub.department?._id || sub.department,
        type: sub.type || 'THEORY',
        weeklyPeriods: sub.weeklyPeriods || 4,
        requiresLab: Boolean(sub.requiresLab),
        preferredConsecutivePeriods: sub.preferredConsecutivePeriods || (sub.type === 'LAB' ? 2 : 1),
        facultyEligible: sub.facultyEligible ? sub.facultyEligible.map((f) => f._id || f) : [],
      });
    } else {
      setEditingSubject(null);
      setFormData({
        name: '',
        code: '',
        department: departments[0]?._id || '',
        type: 'THEORY',
        weeklyPeriods: 4,
        requiresLab: false,
        preferredConsecutivePeriods: 1,
        facultyEligible: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleTypeChange = (newType) => {
    const isLab = newType === 'LAB';
    setFormData((prev) => ({
      ...prev,
      type: newType,
      requiresLab: isLab,
      preferredConsecutivePeriods: isLab ? 2 : 1,
      weeklyPeriods: isLab ? 2 : prev.weeklyPeriods,
    }));
  };

  const toggleFacultyEligible = (facId) => {
    setFormData((prev) => {
      const exists = prev.facultyEligible.includes(facId);
      if (exists) {
        return { ...prev, facultyEligible: prev.facultyEligible.filter((id) => id !== facId) };
      } else {
        return { ...prev, facultyEligible: [...prev.facultyEligible, facId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await subjectService.update(editingSubject._id, formData);
        toast.success('Subject updated successfully.');
      } else {
        await subjectService.create(formData);
        toast.success('Subject created successfully.');
      }
      setIsModalOpen(false);
      loadSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving subject.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete subject "${name}"?`)) return;
    try {
      await subjectService.delete(id);
      toast.success('Subject deleted successfully.');
      loadSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting subject.');
    }
  };

  return (
    <div className="space-y-6">
      <Navbar
        title="Subjects & Curriculum"
        subtitle="Configure lecture/lab courses, required weekly sessions, lab room constraints, and teacher rosters"
        actions={
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Subject
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
              placeholder="Search subjects by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-700 font-medium focus:outline-brand-500"
          >
            <option value="">All Types</option>
            <option value="THEORY">Theory</option>
            <option value="LAB">Laboratory</option>
            <option value="TUTORIAL">Tutorial</option>
          </select>

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

        <span className="text-xs text-slate-500 font-semibold">{subjects.length} Subject(s)</span>
      </div>

      {/* Subjects Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Subject Name</th>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Weekly Sessions</th>
              <th className="py-3 px-4">Consecutive</th>
              <th className="py-3 px-4">Eligible Faculty</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="8" className="py-8 text-center text-slate-400">Loading subjects...</td>
              </tr>
            ) : subjects.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-8 text-center text-slate-400">No subjects found.</td>
              </tr>
            ) : (
              subjects.map((sub) => {
                const isLab = sub.type === 'LAB' || sub.requiresLab;
                return (
                  <tr key={sub._id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      {isLab ? (
                        <FlaskConical className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      ) : (
                        <BookOpen className="w-4 h-4 text-brand-600 flex-shrink-0" />
                      )}
                      {sub.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono font-bold text-slate-800">
                        {sub.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {sub.department?.name || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider border ${
                        isLab
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {sub.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {sub.weeklyPeriods} / week
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {sub.preferredConsecutivePeriods || 1} period(s) block
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {sub.facultyEligible && sub.facultyEligible.length > 0 ? (
                          sub.facultyEligible.map((f) => (
                            <span key={f._id || f} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                              {f.name || 'Faculty'}
                            </span>
                          ))
                        ) : (
                          <span className="text-rose-500 italic font-semibold">0 Eligible (Conflict!)</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenModal(sub)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="Edit Subject"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sub._id, sub.name)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Subject"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? 'Edit Subject' : 'Add Subject'}
        subtitle="Define course classification, weekly quota, and eligible educators"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Subject Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Database Management Systems"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Subject Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CS502"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono uppercase"
              />
            </div>
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
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              >
                <option value="THEORY">THEORY (Lecture Classroom)</option>
                <option value="LAB">LAB (Strict Laboratory Requirement)</option>
                <option value="TUTORIAL">TUTORIAL (Classroom Discussion)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Weekly Periods Quota *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={formData.weeklyPeriods}
                onChange={(e) => setFormData({ ...formData, weeklyPeriods: Number(e.target.value) })}
                className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Consecutive Block Size
              </label>
              <input
                type="number"
                min="1"
                max="4"
                value={formData.preferredConsecutivePeriods}
                onChange={(e) => setFormData({ ...formData, preferredConsecutivePeriods: Number(e.target.value) })}
                className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
              <span className="text-[10px] text-slate-400">e.g. 2 for practical labs</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Eligible Faculty (Qualified Teachers)
            </label>
            <div className="p-3 border border-slate-200 rounded-xl max-h-36 overflow-y-auto space-y-1.5 bg-slate-50/50">
              {facultyList.map((fac) => {
                const checked = formData.facultyEligible.includes(fac._id);
                return (
                  <label
                    key={fac._id}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFacultyEligible(fac._id)}
                      className="w-4 h-4 text-brand-600 rounded border-slate-300"
                    />
                    <span className="font-semibold text-slate-800">{fac.name}</span>
                    <span className="text-slate-400 font-mono text-[10px]">({fac.employeeId})</span>
                  </label>
                );
              })}
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
              {editingSubject ? 'Update Subject' : 'Create Subject'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
