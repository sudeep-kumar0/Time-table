import React, { useState, useEffect } from 'react';
import { Database, Bell, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

export const Navbar = ({ title, subtitle, actions }) => {
  const [dbStatus, setDbStatus] = useState({ connected: false, configured: false });

  useEffect(() => {
    api.get('/health')
      .then((res) => {
        setDbStatus(res.data.database || { connected: false, configured: false });
      })
      .catch(() => {
        setDbStatus({ connected: false, configured: false });
      });
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 font-normal">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* MongoDB Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs">
          <Database className={`w-3.5 h-3.5 ${dbStatus.connected ? 'text-emerald-500' : 'text-amber-500'}`} />
          <span className="font-medium text-slate-600">
            {dbStatus.connected ? 'Atlas DB Connected' : dbStatus.configured ? 'DB Connecting...' : 'Atlas DB Required'}
          </span>
          <span className={`w-2 h-2 rounded-full ${dbStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
        </div>

        {/* Custom Actions */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
};
