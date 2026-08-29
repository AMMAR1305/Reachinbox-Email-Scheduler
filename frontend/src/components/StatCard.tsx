import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'blue' | 'emerald' | 'purple' | 'amber' | 'rose';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return 'from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-400';
      case 'emerald':
        return 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400';
      case 'purple':
        return 'from-purple-500/10 to-indigo-500/10 border-purple-500/20 text-purple-400';
      case 'amber':
        return 'from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-400';
      case 'rose':
        return 'from-rose-500/10 to-pink-500/10 border-rose-500/20 text-rose-400';
    }
  };

  return (
    <div className={`p-5 rounded-2xl border bg-gradient-to-br glass-panel ${getColorClasses()}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 text-3xl font-extrabold text-white tracking-tight">{value}</div>
      {subtitle && <div className="mt-1 text-xs text-slate-400">{subtitle}</div>}
    </div>
  );
};
