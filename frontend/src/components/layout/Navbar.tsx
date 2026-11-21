import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon, Building2, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Directorate Seal */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-900 to-indigo-950 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <span className="font-serif font-black text-xl tracking-tighter">CF</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-lg text-slate-900 tracking-tight">CertiFlow</span>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                Gov Skilling
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">State Certificate Issuance Platform</p>
          </div>
        </Link>

        {/* User Identity & Logout */}
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-slate-800 flex items-center justify-end space-x-1">
                  <span>{user.name}</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-end space-x-1.5">
                  <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                    {user.role.replace(/_/g, ' ')}
                  </span>
                  {user.district && (
                    <span className="flex items-center text-slate-600">
                      <MapPin className="w-3 h-3 mr-0.5" />
                      {user.district.name.replace('District', '').trim()}
                    </span>
                  )}
                  {user.trainingCentre && (
                    <span className="flex items-center text-slate-600">
                      <Building2 className="w-3 h-3 mr-0.5" />
                      {user.trainingCentre.name.split(' ')[0]}
                    </span>
                  )}
                </div>
              </div>

              <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 font-bold">
                {user.name.charAt(0)}
              </div>

              <button
                onClick={logout}
                title="Logout"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-sm font-semibold text-blue-700 hover:text-blue-900 px-4 py-2 rounded-lg border border-blue-300 hover:bg-blue-50 transition"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

