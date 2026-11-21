import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FolderKanban,
  Award,
  Send,
  History,
  ClockAlert,
  ExternalLink
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const navItems = [
    { to: '/batches', label: 'Batches', icon: FolderKanban },
    { to: '/certificates', label: 'Certificates', icon: Award },
    { to: '/deliveries', label: 'Deliveries', icon: Send },
    { to: '/sla', label: 'SLA Monitor', icon: ClockAlert },
    { to: '/audit-logs', label: 'Audit Trail', icon: History },
  ];

  return (
    <aside className="w-56 bg-white border-r border-slate-200 min-h-[calc(100vh-5.5rem)] flex flex-col justify-between p-3">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-4 h-4 opacity-75" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="pt-3 border-t border-slate-100">
        <NavLink
          to="/verify/CERT-2026-800001"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition"
        >
          <span>Public Verification</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </NavLink>
      </div>
    </aside>
  );
};
