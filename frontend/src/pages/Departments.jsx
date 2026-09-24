import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar.jsx';
import { Modal } from '../components/Modal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { departmentService } from '../services/dataService.js';
import { Plus, Search, Edit2, Trash2, Building2 } from 'lucide-react';

export const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const toast = useToast();

  useEffect(() => {
    loadDepartments();
  }, [search]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await departmentService.getAll({ search });
      setDepartments(data || []);
    } catch (err) {
      toast.error('Failed to load departments.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (dept = null) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({ name: dept.name, code: dept.code, description: dept.description || '' });
    } else {
      setEditingDept(null);
      setFormData({ name: '', code: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await departmentService.update(editingDept._id, formData);
        toast.success('Department updated successfully.');
      } else {
        await departmentService.create(formData);
        toast.success('Department created successfully.');
      }
      setIsModalOpen(false);
      loadDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving department.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete department "${name}"?`)) return;
    try {
      await departmentService.delete(id);
      toast.success('Department deleted successfully.');
      loadDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting department.');
    }
  };

  return (
    <div className="space-y-6">
      <Navbar
        title="Departments"
        subtitle="Manage academic departments offering curriculum and degree divisions"
        actions={
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Department
          </button>
        }
      />

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
          />
        </div>
        <span className="text-xs text-slate-500 font-semibold">{departments.length} Department(s)</span>
      </div>

      {/* Departments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Department Name</th>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="4" className="py-8 text-center text-slate-400">Loading departments...</td>
              </tr>
            ) : departments.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-8 text-center text-slate-400">No departments found.</td>
              </tr>
            ) : (
              departments.map((dept) => (
                <tr key={dept._id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-brand-600" />
                    {dept.name}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono font-bold text-slate-800">
                      {dept.code}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                    {dept.description || '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenModal(dept)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        title="Edit Department"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(dept._id, dept.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Department"
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

      {/* Modal for Add / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDept ? 'Edit Department' : 'Add Department'}
        subtitle="Specify academic department details and code"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Department Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Information Science & Engineering"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Department Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ISE"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows="3"
              placeholder="Optional overview..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
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
              {editingDept ? 'Update Department' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
