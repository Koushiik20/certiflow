import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserCheck, Shield, Award, Users, AlertCircle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DemoBanner: React.FC = () => {
  const { user, demoUsers, demoSwitch } = useAuth();

  return (
    <div className="bg-slate-900 border-b border-slate-700 text-white px-4 py-2.5 text-xs shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider flex items-center gap-1">
            <Shield className="w-3 h-3" /> Demo Mode
          </span>
          <span className="text-slate-300 hidden md:inline">
            Quick Persona Switcher (Instant Evaluation):
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {demoUsers.map((demo) => {
            const isActive = user?.email === demo.email;
            return (
              <button
                key={demo.email}
                onClick={() => demoSwitch(demo.email)}
                title={`${demo.title}: ${demo.description}`}
                className={`px-2.5 py-1 rounded transition-all duration-150 flex items-center space-x-1 font-medium ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-inner ring-2 ring-blue-400 font-semibold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600'
                }`}
              >
                <span>{demo.name}</span>
                <span className="text-[10px] opacity-75 hidden sm:inline">
                  ({demo.role === 'TRAINING_CENTRE' ? 'TC' : demo.role === 'DISTRICT_OFFICER' ? 'District' : demo.role === 'QUALITY_TEAM' ? 'Quality' : 'State'})
                </span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1"></span>}
              </button>
            );
          })}

          <Link
            to="/verify/CERT-2026-800001"
            className="px-2.5 py-1 rounded bg-emerald-900 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 transition flex items-center space-x-1 font-medium"
            title="Open Public Verification View"
          >
            <span>Public Verify</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

