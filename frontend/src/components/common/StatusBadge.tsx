import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getBadgeStyle = (st: string) => {
    switch (st.toUpperCase()) {
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'SUBMITTED':
        return 'bg-sky-50 text-sky-700 border-sky-300';
      case 'DISTRICT_REVIEW':
        return 'bg-blue-50 text-blue-800 border-blue-300 font-semibold';
      case 'QUALITY_REVIEW':
        return 'bg-purple-50 text-purple-800 border-purple-300 font-semibold';
      case 'STATE_REVIEW':
        return 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold';
      case 'ISSUING':
        return 'bg-indigo-50 text-indigo-700 border-indigo-300 animate-pulse font-semibold';
      case 'ISSUED':
      case 'VALID':
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-400 font-bold';
      case 'RETURNED':
        return 'bg-orange-100 text-orange-800 border-orange-400 font-semibold';
      case 'REJECTED':
      case 'CANCELLED':
      case 'FAILED':
        return 'bg-rose-100 text-rose-800 border-rose-400 font-bold';
      case 'RETRYING':
        return 'bg-yellow-50 text-yellow-800 border-yellow-300 font-semibold animate-pulse';
      case 'FLAGGED':
        return 'bg-amber-100 text-amber-900 border-amber-400 font-bold';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const formatText = (st: string) => {
    return st.replace(/_/g, ' ');
  };

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border ${getBadgeStyle(
        status
      )} ${sizeClasses[size]} tracking-wide uppercase transition-colors`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {formatText(status)}
    </span>
  );
};

