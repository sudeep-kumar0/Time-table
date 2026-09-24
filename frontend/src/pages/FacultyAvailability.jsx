import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar.jsx';
import { AvailabilityMatrix } from '../components/AvailabilityMatrix.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { facultyService } from '../services/dataService.js';
import { CalendarCheck2, ShieldCheck } from 'lucide-react';

export const FacultyAvailability = () => {
  const { user } = useAuth();
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [facultyId, setFacultyId] = useState(null);
  const toast = useToast();

  useEffect(() => {
    loadFacultyProfile();
  }, [user]);

  const loadFacultyProfile = async () => {
    try {
      setLoading(true);
      // If user has facultyProfile
      const fId = user?.facultyProfile?._id || user?.facultyProfile;
      if (fId) {
        setFacultyId(fId);
        const fac = await facultyService.getById(fId);
        setAvailability(fac?.availability || []);
      }
    } catch (err) {
      toast.error('Failed to load faculty profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!facultyId) {
      toast.warning('No faculty profile linked to this user account.');
      return;
    }
    try {
      await facultyService.updateAvailability(facultyId, availability);
      toast.success('Your teaching availability matrix has been updated successfully!');
    } catch (err) {
      toast.error('Failed to update availability.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Navbar
        title="My Teaching Availability"
        subtitle={`Configure personal busy/free periods for ${user?.name || 'Faculty Member'}`}
      />

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <CalendarCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Personal Weekly Availability Matrix</h3>
            <p className="text-xs text-slate-500">
              The timetable scheduling engine strictly respects these constraints and will never assign you classes during busy slots.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading your profile...</div>
        ) : (
          <div className="space-y-6">
            <AvailabilityMatrix
              availability={availability}
              onChange={(updated) => setAvailability(updated)}
            />

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={handleSave}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Save My Availability
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
