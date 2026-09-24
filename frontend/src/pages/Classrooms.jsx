import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar.jsx';
import { Modal } from '../components/Modal.jsx';
import { AvailabilityMatrix } from '../components/AvailabilityMatrix.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { classroomService } from '../services/dataService.js';
import { Plus, Search, Edit2, Trash2, DoorOpen, FlaskConical, CalendarCheck2, Users } from 'lucide-react';

export const Classrooms = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [activeRoomForAvailability, setActiveRoomForAvailability] = useState(null);
  const [tempAvailability, setTempAvailability] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    roomNumber: '',
    type: 'CLASSROOM',
    capacity: 70,
    building: 'Academic Block A',
    floor: 1,
  });

  const toast = useToast();

  useEffect(() => {
    loadClassrooms();
  }, [search, typeFilter]);

  const loadClassrooms = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      const data = await classroomService.getAll(params);
      setClassrooms(data || []);
    } catch (err) {
      toast.error('Failed to load classrooms.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFormModal = (room = null) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        name: room.name,
        roomNumber: room.roomNumber,
        type: room.type || 'CLASSROOM',
        capacity: room.capacity || 70,
        building: room.building || 'Main Block',
        floor: room.floor || 1,
      });
    } else {
      setEditingRoom(null);
      setFormData({
        name: '',
        roomNumber: '',
        type: 'CLASSROOM',
        capacity: 70,
        building: 'Academic Block A',
        floor: 1,
      });
    }
    setIsFormModalOpen(true);
  };

  const handleOpenAvailabilityModal = (room) => {
    setActiveRoomForAvailability(room);
    setTempAvailability(room.availability || []);
    setIsAvailabilityModalOpen(true);
  };

  const handleSaveAvailability = async () => {
    if (!activeRoomForAvailability) return;
    try {
      await classroomService.updateAvailability(activeRoomForAvailability._id, tempAvailability);
      toast.success(`Availability matrix updated for ${activeRoomForAvailability.roomNumber}`);
      setIsAvailabilityModalOpen(false);
      loadClassrooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating room availability.');
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        await classroomService.update(editingRoom._id, formData);
        toast.success('Room updated successfully.');
      } else {
        await classroomService.create(formData);
        toast.success('Room added successfully.');
      }
      setIsFormModalOpen(false);
      loadClassrooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving room.');
    }
  };

  const handleDelete = async (id, roomNumber) => {
    if (!window.confirm(`Are you sure you want to delete room "${roomNumber}"?`)) return;
    try {
      await classroomService.delete(id);
      toast.success('Room removed successfully.');
      loadClassrooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting room.');
    }
  };

  return (
    <div className="space-y-6">
      <Navbar
        title="Classrooms & Laboratories"
        subtitle="Manage lecture halls, specialized laboratories, seating capacities, and room availability"
        actions={
          <button
            onClick={() => handleOpenFormModal()}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Room
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
              placeholder="Search by room or building..."
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
            <option value="">All Facilities</option>
            <option value="CLASSROOM">Classroom / Lecture Hall</option>
            <option value="LAB">Specialized Laboratory</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-semibold">{classrooms.length} Facility / Room(s)</span>
      </div>

      {/* Classrooms Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Room Name / Number</th>
              <th className="py-3 px-4">Facility Type</th>
              <th className="py-3 px-4">Seating Capacity</th>
              <th className="py-3 px-4">Building & Floor</th>
              <th className="py-3 px-4">Period Availability</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400">Loading rooms...</td>
              </tr>
            ) : classrooms.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400">No classrooms or laboratories configured yet.</td>
              </tr>
            ) : (
              classrooms.map((room) => {
                const isLab = room.type === 'LAB';
                const unavailableCount = (room.availability || []).filter((a) => a.isAvailable === false).length;

                return (
                  <tr key={room._id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      {isLab ? (
                        <FlaskConical className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      ) : (
                        <DoorOpen className="w-4 h-4 text-brand-600 flex-shrink-0" />
                      )}
                      <div>
                        <span>{room.name}</span>
                        <span className="ml-2 px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono font-bold text-[11px]">
                          {room.roomNumber}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider border ${
                        isLab
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {room.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {room.capacity} seats
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {room.building}, Floor {room.floor}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleOpenAvailabilityModal(room)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                          unavailableCount > 0
                            ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        <CalendarCheck2 className="w-3.5 h-3.5" />
                        {unavailableCount > 0 ? `${unavailableCount} Blocked Slot(s)` : 'Fully Available'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenFormModal(room)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="Edit Room"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(room._id, room.roomNumber)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Room"
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingRoom ? 'Edit Room' : 'Add Room'}
        subtitle="Specify room number, capacity, and facility type (Classroom vs Lab)"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Room Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Lecture Hall 101"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Room Number / Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. LH-101"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Facility Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              >
                <option value="CLASSROOM">CLASSROOM (Lecture Room)</option>
                <option value="LAB">LAB (Specialized Practical Lab)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Seating Capacity *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Building Name
              </label>
              <input
                type="text"
                placeholder="e.g. Academic Block A"
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Floor
              </label>
              <input
                type="number"
                min="0"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: Number(e.target.value) })}
                className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
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
              {editingRoom ? 'Update Room' : 'Save Room'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Availability Matrix Modal */}
      <Modal
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
        title={`Room Availability — ${activeRoomForAvailability?.name || 'Classroom'}`}
        subtitle="Enforce hard constraints: This room will NEVER be scheduled during red/unavailable slots."
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
              Save Room Availability Matrix
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
