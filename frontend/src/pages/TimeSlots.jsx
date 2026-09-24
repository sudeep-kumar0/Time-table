import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar.jsx';
import { Modal } from '../components/Modal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { timeslotService } from '../services/dataService.js';
import { Plus, Clock, RefreshCw, Trash2, Edit2, Calendar } from 'lucide-react';

export const TimeSlots = () => {
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dayFilter, setDayFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);

  const [formData, setFormData] = useState({
    day: 'Monday',
    periodNumber: 1,
    startTime: '09:00',
    endTime: '10:00',
    isBreak: false,
    label: 'Period 1',
  });

  const toast = useToast();
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    loadTimeSlots();
  }, [dayFilter]);

  const loadTimeSlots = async () => {
    try {
      setLoading(true);
      const params = {};
      if (dayFilter) params.day = dayFilter;
      const data = await timeslotService.getAll(params);
      setTimeSlots(data || []);
    } catch (err) {
      toast.error('Failed to load time slots.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeDefaults = async () => {
    if (!window.confirm('Reset/Initialize standard college time slots (Monday-Friday, 6 periods/day)?')) return;
    try {
      setLoading(true);
      await timeslotService.initialize();
      toast.success('Default time slots initialized successfully (Mon-Fri, 6 periods/day).');
      loadTimeSlots();
    } catch (err) {
      toast.error('Failed to initialize default time slots.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (slot = null) => {
    if (slot) {
      setEditingSlot(slot);
      setFormData({
        day: slot.day,
        periodNumber: slot.periodNumber,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBreak: Boolean(slot.isBreak),
        label: slot.label || `Period ${slot.periodNumber}`,
      });
    } else {
      setEditingSlot(null);
      setFormData({
        day: 'Monday',
        periodNumber: 1,
        startTime: '09:00',
        endTime: '10:00',
        isBreak: false,
        label: 'Period 1',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSlot) {
        await timeslotService.update(editingSlot._id, formData);
        toast.success('Time slot updated.');
      } else {
        await timeslotService.create(formData);
        toast.success('Time slot created.');
      }
      setIsModalOpen(false);
      loadTimeSlots();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving time slot.');
    }
  };

  const handleDelete = async (id, day, p) => {
    if (!window.confirm(`Delete time slot ${day} Period ${p}?`)) return;
    try {
      await timeslotService.delete(id);
      toast.success('Time slot deleted.');
      loadTimeSlots();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting time slot.');
    }
  };

  return (
    <div className="space-y-6">
      <Navbar
        title="Time Slots"
        subtitle="Configure daily periods, instruction intervals, start/end times, and recesses"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleInitializeDefaults}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              Reset Mon-Fri Defaults
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Slot
            </button>
          </div>
        }
      />

      {/* Day Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setDayFilter('')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                dayFilter === '' ? 'bg-white text-brand-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Days
            </button>
            {daysOfWeek.slice(0, 5).map((d) => (
              <button
                key={d}
                onClick={() => setDayFilter(d)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  dayFilter === d ? 'bg-white text-brand-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-slate-500 font-semibold">{timeSlots.length} Active Slot(s)</span>
      </div>

      {/* Slots Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Day</th>
              <th className="py-3 px-4">Period Number</th>
              <th className="py-3 px-4">Time Interval</th>
              <th className="py-3 px-4">Slot Type / Label</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-400">Loading time slots...</td>
              </tr>
            ) : timeSlots.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-400">
                  No time slots configured. Click "Reset Mon-Fri Defaults" to auto-generate standard college periods.
                </td>
              </tr>
            ) : (
              timeSlots.map((slot) => (
                <tr key={slot._id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {slot.day}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-extrabold text-[11px]">
                      {slot.periodNumber}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {slot.startTime} – {slot.endTime}
                  </td>
                  <td className="py-3.5 px-4">
                    {slot.isBreak ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                        Break: {slot.label || 'Recess'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[10px] border border-blue-100">
                        {slot.label || `Period ${slot.periodNumber}`}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenModal(slot)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        title="Edit Slot"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(slot._id, slot.day, slot.periodNumber)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Slot"
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
        title={editingSlot ? 'Edit Time Slot' : 'Add Time Slot'}
        subtitle="Configure individual day and period time boundary"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Day of Week *
              </label>
              <select
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              >
                {daysOfWeek.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Period Number (1 - 10) *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={formData.periodNumber}
                onChange={(e) => setFormData({ ...formData, periodNumber: Number(e.target.value) })}
                className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Start Time (HH:MM) *
              </label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                End Time (HH:MM) *
              </label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Slot Label (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Period 1 or Lunch Recess"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isBreak}
              onChange={(e) => setFormData({ ...formData, isBreak: e.target.checked })}
              className="w-4 h-4 text-brand-600 rounded"
            />
            <span className="font-semibold text-slate-800">Designate as Break / Recess Period</span>
          </label>

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
              {editingSlot ? 'Update Slot' : 'Create Slot'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
