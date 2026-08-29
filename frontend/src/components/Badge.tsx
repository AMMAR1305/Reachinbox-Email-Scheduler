import React from 'react';
import { EmailJobStatus } from '../types';

interface BadgeProps {
  status: EmailJobStatus | string;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const getStyles = () => {
    switch (status) {
      case 'SENT':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'PROCESSING':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse';
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'RESCHEDULED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'FAILED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'CANCELLED':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      default:
        return 'bg-slate-500/10 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <span
      className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStyles()} inline-flex items-center gap-1.5`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {status}
    </span>
  );
};
