import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar.jsx';
import { Modal } from '../components/Modal.jsx';
import { AvailabilityMatrix } from '../components/AvailabilityMatrix.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { facultyService, departmentService, subjectService } from '../services/dataService.js';
import { Plus, Search, Edit2, Trash2, CalendarCheck2, GraduationCap, Mail, Phone } from 'lucide-react';

export const Faculty = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [activeFacultyForAvailability, setActiveFacultyForAvailability] = useState(null);
  const [tempAvailability, setTempAvailability] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    department: '',
    email: '',
    phone: '',
    subjects: [],
    maxWeeklyHours: 18,
  });

  const toast = useToast();

  useEffect(() => {
    loadAuxData();
  }, []);

  useEffect(() => {
    loadFaculty();
  }, [search, selectedDeptFilter]);

  const loadAuxData = async () => {
    try {
      const [depts, subs] = await Promise.all([
        departmentService.getAll(),
        subjectService.getAll(),
      ]);
      setDepartments(depts || []);
      setSubjects(subs || []);
      if (depts && depts.length > 0 && !formData.department) {
        setFormData((prev) => ({ ...prev, department: depts[0]._id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadFaculty = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedDeptFilter) params.department = selectedDeptFilter;
      const data = await facultyService.getAll(params);
      setFacultyList(data || []);
    } catch (err) {
      toast.error('Failed to load faculty.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFormModal = (fac = null) => {
    if (fac) {
      setEditingFaculty(fac);
      setFormData({
        name: fac.name,
        employeeId: fac.employeeId,
        department: fac.department?._id || fac.department,
        email: fac.email || '',
        phone: fac.phone || '',
        subjects: fac.subjects ? fac.subjects.map((s) => s._id || s) : [],
        maxWeeklyHours: fac.maxWeeklyHours || 18,
      });
    } else {
      setEditingFaculty(null);
      setFormData({
        name: '',
        employeeId: '',
        department: departments[0]?._id || '',
        email: '',
        phone: '',
        subjects: [],
        maxWeeklyHours: 18,
      });
    }
    setIsFormModalOpen(true);
  };

  const handleOpenAvailabilityModal = (fac) => {
    setActiveFacultyForAvailability(fac);
    setTempAvailability(fac.availability || []);
    setIsAvailabilityModalOpen(true);
  };

  const handleSaveAvailability = async () => {
    if (!activeFacultyForAvailability) return;
    try {
      await facultyService.updateAvailability(activeFacultyForAvailability._id, tempAvailability);
      toast.success(`Availability updated for ${activeFacultyForAvailability.name}`);
      setIsAvailabilityModalOpen(false);
      loadFaculty();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating availability.');
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      if (editingFaculty) {
        await facultyService.update(editingFaculty._id, formData);
        toast.success('Faculty profile updated successfully.');
      } else {
        await facultyService.create(formData);
        toast.success('Faculty member added successfully.');
      }
      setIsFormModalOpen(false);
      loadFaculty();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving faculty.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete faculty member "${name}"?`)) return;
    try {
      await facultyService.delete(id);
      toast.success('Faculty member removed.');
      loadFaculty();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting faculty.');
    }
  };

  const toggleSubjectSelect = (subId) => {
    setFormData((prev) => {
      const exists = prev.subjects.includes(subId);
      if (exists) {
        return { ...prev, subjects: prev.subjects.filter((id) => id !== subId) };
      } else {
        return { ...prev, subjects: [...prev.subjects, subId] };
      }
    });
  };

  return (
    <div className="space-y-6">
      <Navbar
        title="Faculty Management"
        subtitle="Manage teaching staff, workload hours, assigned subjects, and day/period availability matrices"
        actions={
          <button
            onClick={() => handleOpenFormModal()}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Faculty
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
              placeholder="Search by name or Employee ID..."
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

        <span className="text-xs text-slate-500 font-semibold">{facultyList.length} Faculty Member(s)</span>
      </div>

      {/* Faculty Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Faculty Name</th>
              <th className="py-3 px-4">Employee ID</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Qualified Subjects</th>
              <th className="py-3 px-4">Availability</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-400">Loading faculty records...</td>
              </tr>
            ) : facultyList.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-400">No faculty members found.</td>
              </tr>
            ) : (
              facultyList.map((fac) => {
                const unavailableCount = (fac.availability || []).filter((a) => a.isAvailable === false).length;

                return (
                  <tr key={fac._id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-brand-600 flex-shrink-0" />
                      {fac.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono font-bold text-slate-800">
                        {fac.employeeId}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {fac.department?.name || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      <div className="space-y-0.5 text-[11px]">
                        {fac.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> {fac.email}</div>}
                        {fac.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {fac.phone}</div>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {fac.subjects && fac.subjects.length > 0 ? (
                          fac.subjects.map((s) => (
                            <span key={s._id || s} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-100">
                              {s.name || 'Subject'}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">None assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleOpenAvailabilityModal(fac)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                          unavailableCount > 0
                            ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        <CalendarCheck2 className="w-3.5 h-3.5" />
                        {unavailableCount > 0 ? `${unavailableCount} Blocked Slot(s)` : 'Full Availability'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenFormModal(fac)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="Edit Faculty"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(fac._id, fac.name)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Faculty"
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

      {/* Add / Edit Profile Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingFaculty ? 'Edit Faculty Member' : 'Add Faculty Member'}
        subtitle="Specify employee ID, academic department, and qualified subjects"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Ramesh Kumar"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Employee ID *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. FAC001"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
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
                Max Weekly Teaching Hours
              </label>
              <input
                type="number"
                min="1"
                max="40"
                value={formData.maxWeeklyHours}
                onChange={(e) => setFormData({ ...formData, maxWeeklyHours: e.target.value })}
                className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="faculty@smartschedule.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Eligible Subjects (Curriculum Competency)
            </label>
            <div className="p-3 border border-slate-200 rounded-xl max-h-36 overflow-y-auto space-y-1.5 bg-slate-50/50">
              {subjects.map((sub) => {
                const checked = formData.subjects.includes(sub._id);
                return (
                  <label
                    key={sub._id}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSubjectSelect(sub._id)}
                      className="w-4 h-4 text-brand-600 rounded border-slate-300"
                    />
                    <span className="font-semibold text-slate-800">{sub.name}</span>
                    <span className="text-slate-400 font-mono text-[10px]">({sub.code})</span>
                    <span className="ml-auto text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-bold uppercase">
                      {sub.type}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-xs"
            >
              {editingFaculty ? 'Update Faculty' : 'Save Faculty'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Availability Matrix Modal */}
      <Modal
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
        title={`Configure Availability — ${activeFacultyForAvailability?.name || 'Faculty'}`}
        subtitle="Enforce hard constraints: Faculty will NEVER be scheduled during red/busy periods."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <AvailabilityMatrix
            availability={tempAvailability}
            onChange={(updated) => setTempAvailability(updated)}
          />

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAvailabilityModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAvailability}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-xs text-xs"
            >
              Save Availability Matrix
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
