import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar.jsx';
import api from '../services/api.js';
import { Settings as SettingsIcon, Database, Server, Key, ShieldCheck, Terminal, Cpu } from 'lucide-react';

export const Settings = () => {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api.get('/health')
      .then((r) => setHealth(r.data))
      .catch(() => setHealth({ status: 'OFFLINE' }));
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Navbar
        title="System Settings & Environment Configuration"
        subtitle="MongoDB Atlas connection status, API health, and system parameters"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend & DB Health Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Backend Engine Status</h3>
              <p className="text-xs text-slate-500">Node.js Express & Mongoose API</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">API Status:</span>
              <span className="font-bold text-emerald-600">{health?.status || 'ONLINE'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Service:</span>
              <span className="font-semibold text-slate-800">{health?.service || 'SmartSchedule API Engine'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Version:</span>
              <span className="font-mono text-slate-700">{health?.version || '1.0.0'}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="text-slate-500">MongoDB Configured:</span>
              <span className={`font-bold ${health?.database?.configured ? 'text-emerald-600' : 'text-amber-600'}`}>
                {health?.database?.configured ? 'Yes (backend/.env)' : 'Pending in backend/.env'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">MongoDB Connected:</span>
              <span className={`font-bold ${health?.database?.connected ? 'text-emerald-600' : 'text-amber-600'}`}>
                {health?.database?.connected ? 'Connected' : 'Disconnected / Unconfigured'}
              </span>
            </div>
          </div>
        </div>

        {/* Database Setup Guide */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">MongoDB Atlas Setup</h3>
              <p className="text-xs text-slate-500">How to add your database credentials</p>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
            <p>
              1. Open <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">backend/.env</code> in your editor.
            </p>
            <p>
              2. Add your MongoDB Atlas connection URI:
            </p>
            <pre className="p-2.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
              MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/smartschedule
            </pre>
            <p>
              3. Run the database seed script to populate realistic departments, classrooms, faculty, and test cases:
            </p>
            <pre className="p-2.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px]">
              npm run seed
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
