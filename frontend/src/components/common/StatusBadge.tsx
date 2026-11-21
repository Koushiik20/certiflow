import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getBadgeStyle = (st: string) => {
    switch (st.toUpperCase()) {
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700';
      case 'SUBMITTED':
      case 'DISTRICT_REVIEW':
        return 'bg-blue-50 text-blue-700';
      case 'QUALITY_REVIEW':
        return 'bg-purple-50 text-purple-700';
      case 'STATE_REVIEW':
        return 'bg-amber-50 text-amber-800';
      case 'APPROVED':
      case 'ISSUED':
      case 'VALID':
      case 'DELIVERED':
        return 'bg-emerald-50 text-emerald-700 font-semibold';
      case 'RETURNED':
        return 'bg-orange-50 text-orange-700 font-semibold';
      case 'REJECTED':
      case 'CANCELLED':
      case 'FAILED':
        return 'bg-rose-50 text-rose-700 font-semibold';
      case 'RETRYING':
        return 'bg-amber-50 text-amber-700 animate-pulse';
      case 'FLAGGED':
        return 'bg-amber-100 text-amber-800 font-bold';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const formatText = (st: string) => st.replace(/_/g, ' ');

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md font-medium tracking-wide ${getBadgeStyle(
        status
      )} ${sizeClasses[size]}`}
    >
      {formatText(status)}
    </span>
  );
};
