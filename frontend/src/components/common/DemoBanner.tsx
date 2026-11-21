import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DemoBanner: React.FC = () => {
  const { user, demoUsers, demoSwitch } = useAuth();

  return (
    <div className="bg-slate-900 text-slate-200 px-4 py-2 text-xs border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">
            Switch Role:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {demoUsers.map((demo) => {
              const isActive = user?.email === demo.email;
              const shortRole =
                demo.role === 'TRAINING_CENTRE'
                  ? 'Training'
                  : demo.role === 'DISTRICT_OFFICER'
                  ? demo.name === 'Dev'
                    ? 'District 1'
                    : 'District 2'
                  : demo.role === 'QUALITY_TEAM'
                  ? 'Quality'
                  : 'State';

              return (
                <button
                  key={demo.email}
                  onClick={() => demoSwitch(demo.email)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {demo.name} <span className="opacity-70 text-[10px]">({shortRole})</span>
                </button>
              );
            })}
          </div>
        </div>

        <Link
          to="/verify/CERT-2026-800001"
          className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center space-x-1 text-xs"
        >
          <span>Public Verify View</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
