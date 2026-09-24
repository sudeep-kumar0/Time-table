import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { LogIn, KeyRound, Mail, Sparkles, UserCheck } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      toast.success('Welcome back! Signed in successfully.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass);
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-8">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Sign In to SmartSchedule</h2>
        <p className="text-xs text-slate-500 mt-1">Access college timetable generation and schedule management</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@smartschedule.edu"
              className="w-full text-sm pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-sm pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <LogIn className="w-4 h-4" /> Sign In
            </>
          )}
        </button>
      </form>

      {/* Demo Quick Fill Buttons */}
      <div className="mt-6 pt-5 border-t border-slate-100">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-2.5">
          Quick Demo Credentials
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillCredentials('admin@smartschedule.edu', 'Admin@123')}
            className="p-2 text-xs rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold transition-colors flex items-center justify-center gap-1.5 border border-slate-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            Admin Demo
          </button>
          <button
            type="button"
            onClick={() => fillCredentials('priya.sharma@smartschedule.edu', 'Faculty@123')}
            className="p-2 text-xs rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold transition-colors flex items-center justify-center gap-1.5 border border-slate-200"
          >
            <UserCheck className="w-3.5 h-3.5 text-sky-600" />
            Faculty Demo
          </button>
        </div>
      </div>

      <div className="mt-4 text-center">
        <Link to="/register" className="text-xs text-brand-600 hover:underline font-semibold">
          Need an administrator account? Register here
        </Link>
      </div>
    </div>
  );
};
