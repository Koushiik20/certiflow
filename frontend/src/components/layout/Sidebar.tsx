import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FolderKanban,
  CheckSquare,
  SearchCheck,
  ShieldAlert,
  Award,
  Send,
  History,
  ClockAlert,
  ExternalLink,
  PlusCircle
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const navItems = [
    {
      to: '/batches',
      label: 'Batches Directory',
      icon: FolderKanban,
      show: true,
    },
    {
      to: '/approvals',
      label: 'District Approvals',
      icon: CheckSquare,
      badge: role === 'DISTRICT_OFFICER' ? 'Action' : undefined,
      show: ['DISTRICT_OFFICER', 'ADMIN', 'STATE_OFFICE'].includes(role),
    },
    {
      to: '/quality',
      label: 'Quality Audit Queue',
      icon: SearchCheck,
      badge: role === 'QUALITY_TEAM' ? 'Review' : undefined,
      show: ['QUALITY_TEAM', 'ADMIN', 'STATE_OFFICE'].includes(role),
    },
    {
      to: '/state-office',
      label: 'State Final Approval',
      icon: ShieldAlert,
      badge: role === 'STATE_OFFICE' ? 'Final' : undefined,
      show: ['STATE_OFFICE', 'ADMIN'].includes(role),
    },
    {
      to: '/certificates',
      label: 'Issued Certificates',
      icon: Award,
      show: true,
    },
    {
      to: '/deliveries',
      label: 'WhatsApp Deliveries',
      icon: Send,
      show: ['STATE_OFFICE', 'TRAINING_CENTRE', 'ADMIN'].includes(role),
    },
    {
      to: '/sla',
      label: 'SLA & Overdue Monitor',
      icon: ClockAlert,
      show: ['STATE_OFFICE', 'DISTRICT_OFFICER', 'QUALITY_TEAM', 'ADMIN'].includes(role),
    },
    {
      to: '/audit-logs',
      label: 'Audit Trail',
      icon: History,
      show: ['STATE_OFFICE', 'DISTRICT_OFFICER', 'QUALITY_TEAM', 'ADMIN'].includes(role),
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 min-h-[calc(100vh-6.5rem)] flex flex-col justify-between py-5 px-3">
      <div className="space-y-6">
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold tracking-wider uppercase text-slate-400">
            Lifecycle Navigation
          </div>
          <nav className="space-y-1">
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white font-semibold shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4 opacity-80" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] bg-blue-500/30 text-blue-300 border border-blue-400/40 px-1.5 py-0.2 rounded font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
          </nav>
        </div>

        {/* Public Links Section */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold tracking-wider uppercase text-slate-400">
            Public Access
          </div>
          <div className="space-y-1">
            <NavLink
              to="/verify"
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-emerald-700 text-white font-semibold'
                    : 'text-emerald-400 hover:bg-emerald-950/50 hover:text-emerald-300'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Award className="w-4 h-4" />
                <span>Verify Credentials</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </NavLink>
          </div>
        </div>
      </div>

      {/* Role Scoping Footnote */}
      <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 text-xs">
        <p className="font-semibold text-slate-200">Active Role Policy</p>
        <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
          {role === 'TRAINING_CENTRE' && 'Authorized to draft batches, upload spreadsheets, and resubmit corrections.'}
          {role === 'DISTRICT_OFFICER' && 'Authorized to audit candidate marks and provide 1 of 2 district approvals.'}
          {role === 'QUALITY_TEAM' && 'Authorized to inspect large batches (>50) and flag anomalies.'}
          {role === 'STATE_OFFICE' && 'Final issuance authority, analytics controller, and certificate revocation.'}
          {role === 'ADMIN' && 'Full administrative override.'}
        </p>
      </div>
    </aside>
  );
};

