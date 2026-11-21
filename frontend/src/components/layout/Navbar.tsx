import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            CF
          </div>
          <span className="font-bold text-base text-slate-900 tracking-tight">CertiFlow</span>
        </Link>

        {/* User Info & Actions */}
        {user ? (
          <div className="flex items-center space-x-3 text-xs">
            <div className="text-right">
              <span className="font-bold text-slate-800">{user.name}</span>
              <span className="ml-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[11px]">
                {user.role.replace(/_/g, ' ')}
              </span>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-md hover:bg-blue-50 transition"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};
